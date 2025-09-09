import * as jwt from './jwt.server';
import { sha256 } from '@noble/hashes/sha2';
import { utf8ToBytes, bytesToHex, randomBytes } from '@noble/hashes/utils';
import { powReactionChallengeSchema, type PowReactionChallenge } from './pow-reaction-challenge.js';
import { countLeadingZeroBits } from './utils.js';

type Difficulty = {
	/** Time window in milliseconds for counting previous entries */
	windowMs: number;
	/** Minimum starting difficulty, defaults to 4 */
	minDifficulty?: number;
	/** Difficulty increase per entry */
	multiplier: number;
	/** Function to get number of previous entries from given IP since given time */
	getEntries: ({ ip, since }: { ip: string; since: Date }) => Promise<number>;
	/** Function to log a new entry from given IP */
	putEntry: ({ ip }: { ip: string }) => void;
};

/** Server-side logic handling challenge generation and verification */
export class PowReaction {
	/** Secret used to sign JWTs, should be at least 32 bytes long */
	secret: Uint8Array;
	/** Reaction can be any string, such as emoji or enum value */
	reaction: string;
	/** Difficulty settings for PoW challenge */
	difficulty: Difficulty;
	/** Maximum solving time (Default: 60s) */
	ttl: number;
	/** Function to check whether a challenge solution was already submitted */
	isRedeemed: (id: string) => Promise<boolean>;
	/** Function to mark a challenge as redeemed */
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

	/** Get challenge parameters based on IP and previous entries */
	async getChallengeParams({ ip }: { ip: string }): Promise<{
		difficulty: number;
		rounds: number;
	}> {
		const entries = await this.difficulty.getEntries({
			ip,
			since: new Date(Date.now() - this.difficulty.windowMs)
		});
		const difficulty = (this.difficulty.minDifficulty ?? 4) + Math.floor(entries * this.difficulty.multiplier);
		return { difficulty, rounds: 50 };
	}

	/** Generate a new challenge for given IP and difficulty */
	generateChallenge({
		ip,
		difficulty,
		rounds: roundsNumber
	}: {
		ip: string;
		difficulty: number;
		rounds: number;
	}): string {
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

	/** Get a new challenge for given IP, automatically adjusting difficulty */
	async getChallenge({ ip }: { ip: string }): Promise<string> {
		const { difficulty, rounds } = await this.getChallengeParams({ ip });
		await this.difficulty.putEntry({ ip });
		return this.generateChallenge({ ip, difficulty, rounds });
	}

	/** Verify provided solutions for given challenge and request info */
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
	): Promise<boolean> {
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
