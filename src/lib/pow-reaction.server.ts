import * as jwt from './jwt.server';
import { sha256 } from '@noble/hashes/sha2';
import { utf8ToBytes, bytesToHex, randomBytes } from '@noble/hashes/utils';
import {
	powReactionChallengeSchema,
	type PowReactionChallenge
} from '$lib/pow-reaction-challenge.js';
import { countLeadingZeroBits } from '$lib/utils.js';

type Difficulty = {
	windowMs: number;
	multiplier: number;
	getEntries: ({ ip, since }: { ip: string; since: Date }) => Promise<number>;
	putEntry: ({ ip }: { ip: string }) => void;
};

export class PowReaction {
	secret: Uint8Array;
	reaction: string;
	difficulty: Difficulty;
	ttl: number;
	isRedeemed: (id: string) => Promise<boolean>;
	setRedeemed: (id: string) => Promise<void>;

	constructor({
		secret,
		reaction,
		ttl,
		difficulty,
		isRedeemed,
		setRedeemed
	}: {
		secret: Uint8Array;
		reaction: string;
		ttl?: number;
		difficulty: Difficulty;
		isRedeemed: (id: string) => Promise<boolean>;
		setRedeemed: (id: string) => Promise<void>;
	}) {
		this.secret = secret;
		this.reaction = reaction;
		this.ttl = ttl ?? 1000 * 60;
		this.difficulty = difficulty;
		this.isRedeemed = isRedeemed;
		this.setRedeemed = setRedeemed;
	}

	async getChallengeParams({ ip }: { ip: string }) {
		const entries = await this.difficulty.getEntries({
			ip,
			since: new Date(Date.now() - this.difficulty.windowMs)
		});
		const minDifficulty = 4;
		const difficulty = minDifficulty + Math.floor(entries * this.difficulty.multiplier);
		return { difficulty, rounds: 50 };
	}

	generateChallenge({
		ip,
		difficulty,
		rounds: roundsNumber
	}: {
		ip: string;
		difficulty: number;
		rounds: number;
	}) {
		const issuedAt = Date.now();
		const expiresAt = issuedAt + this.ttl;

		const rounds = [];
		for (let i = 0; i < roundsNumber; i++) {
			rounds.push(bytesToHex(randomBytes(16)));
		}

		const challenge: PowReactionChallenge = {
			id: crypto.randomUUID(),
			reaction: this.reaction,
			difficulty,
			exp: Math.floor(expiresAt / 1000),
			ip,
			rounds
		};

		return jwt.sign(challenge, this.secret);
	}

	async getChallenge({ ip }: { ip: string }) {
		const { difficulty, rounds } = await this.getChallengeParams({ ip });
		await this.difficulty.putEntry({ ip });
		return this.generateChallenge({ ip, difficulty, rounds });
	}

	async verifySolution(
		{
			challenge: payload,
			solutions
		}: {
			challenge: string;
			solutions: number[];
		},
		request: {
			ip: string;
		}
	) {
		let challenge: PowReactionChallenge;
		try {
			challenge = powReactionChallengeSchema.parse(jwt.verify(payload, this.secret));
		} catch (e) {
			console.error(e);
			return false;
		}

		if (challenge.reaction !== this.reaction) {
			return false;
		}

		if (!request.ip || request.ip !== challenge.ip) {
			return false;
		}

		const { difficulty, rounds } = challenge;
		if (solutions.length !== rounds.length) {
			return false;
		}

		if (solutions.some((n) => !Number.isSafeInteger(n) || n < 0 || n % 1 !== 0)) {
			return false;
		}

		for (let i = 0; i < rounds.length; i++) {
			const id = rounds[i];
			const nonce = solutions[i];
			const candidate = `${id}.${nonce}`;
			const hash = sha256(utf8ToBytes(candidate));
			const lz = countLeadingZeroBits(hash);
			if (lz < difficulty) {
				return false;
			}
		}

		if (await this.isRedeemed(challenge.id)) {
			return false;
		}

		await this.setRedeemed(challenge.id);

		return true;
	}
}
