import jwt from 'jsonwebtoken';
import { sha256 } from '@noble/hashes/sha2';
import { utf8ToBytes, bytesToHex, randomBytes } from '@noble/hashes/utils';
import {
	powReactionChallengeSchema,
	type PowReactionChallenge
} from '$lib/pow-reaction-challenge.js';
import { countLeadingZeroBits } from '$lib/utils.js';

export class PowReaction {
	secret: Uint8Array;
	reaction: string;
	difficultyMultiplier: number;
	ttl: number;

	constructor({
		secret,
		reaction,
		difficultyMultiplier,
		ttl
	}: {
		secret: Uint8Array;
		reaction: string;
		difficultyMultiplier: number;
		ttl?: number;
	}) {
		this.secret = secret;
		this.reaction = reaction;
		this.difficultyMultiplier = difficultyMultiplier;
		this.ttl = ttl ?? 1000 * 60;
	}

	getChallengeParams({ ip }: { ip?: string }) {
		// todo: progressive difficulty based on ip
		return { difficulty: 4, rounds: 50 };
	}

	generateChallenge({
		ip,
		difficulty,
		rounds: roundsNumber
	}: {
		ip?: string;
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
			reaction: this.reaction,
			difficulty,
			expiresAt,
			ip,
			rounds
		};

		const payload = jwt.sign(challenge, bytesToHex(this.secret), {
			algorithm: 'HS256'
		});

		return payload;
	}

	getChallenge({ ip }: { ip?: string }) {
		const { difficulty, rounds } = this.getChallengeParams({ ip });
		return this.generateChallenge({ ip, difficulty, rounds });
	}

	verifySolution(
		{
			challenge: payload,
			solutions
		}: {
			challenge: string;
			solutions: number[];
		},
		request: {
			ip?: string;
		}
	) {
		let challenge: PowReactionChallenge;
		try {
			challenge = powReactionChallengeSchema.parse(jwt.verify(payload, bytesToHex(this.secret)));
			if (Date.now() > challenge.expiresAt) {
				return false;
			}
		} catch {
			return false;
		}

		if (challenge.reaction !== this.reaction) {
			return false;
		}

		if (request.ip !== undefined && request.ip !== challenge.ip) {
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

		return true;
	}
}
