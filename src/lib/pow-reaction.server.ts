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
	/** Function to get number of previous entries from given clientId since given time */
	getEntries: ({ clientId, since }: { clientId: string; since: Date }) => Promise<number>;
	/** Function to log a new entry from given clientId */
	putEntry: ({ clientId }: { clientId: string }) => void;
};

/**
 * Server-side logic handling challenge generation and verification. \
 * Client params is used to bind challenge to specific context, such as user or page. \
 * Do not pass dynamic values to client params, as it must be exactly
 * the same when verifying the solution. \
 * It's recommended to pass at least IP address in client params. \
 * Optionally, add page URL to tie challenge to the page context.
 * */
export class PowReaction<ClientParams extends object = never> {
	/** Secret used to sign JWTs, should be at least 32 bytes long */
	secret: Uint8Array;
	/** Reaction can be any string, such as emoji or enum value */
	reaction: string;
	/** Difficulty settings for PoW challenge */
	difficulty: Difficulty;
	/** Maximum solving time (Default: 60s) */
	ttl: number;
	/** Optional hash for clientId generation, should be set to your app's name */
	clientParamsSalt: string = 'pow-reaction';
	/** Function to check whether a challenge solution was already submitted */
	isRedeemed: ({ challengeId }: { challengeId: string }) => Promise<boolean>;
	/** Function to mark a challenge as redeemed */
	setRedeemed: ({ challengeId }: { challengeId: string }) => Promise<void>;

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
		isRedeemed: ({ challengeId }: { challengeId: string }) => Promise<boolean>;
		setRedeemed: ({ challengeId }: { challengeId: string }) => Promise<void>;
	}) {
		this.secret = secret;
		this.reaction = reaction;
		this.ttl = ttl ?? 1000 * 60;
		this.difficulty = difficulty;
		this.isRedeemed = isRedeemed;
		this.setRedeemed = setRedeemed;
	}

	private hashClientId(client: ClientParams): string {
		const json = JSON.stringify({
			...client,
			reaction: this.reaction,
			salt: this.clientParamsSalt
		});
		const hash = sha256(utf8ToBytes(json));
		return bytesToHex(hash);
	}

	/**
	 * Get challenge parameters based on number of previous requests using passed client parameters.
	 *
	 * It's recommended to pass an object containing at least the client IP address. Optionally,
	 * you can also include other parameters such as page URL to tie challenge to the page context.
	 */
	async getChallengeParams(client: ClientParams): Promise<{
		difficulty: number;
		rounds: number;
	}> {
		const clientId = this.hashClientId(client);
		const entries = await this.difficulty.getEntries({
			clientId,
			since: new Date(Date.now() - this.difficulty.windowMs)
		});
		const difficulty =
			(this.difficulty.minDifficulty ?? 4) + Math.floor(entries * this.difficulty.multiplier);
		return { difficulty, rounds: 50 };
	}

	/** Generate a new challenge for given client params and difficulty */
	generateChallenge({
		clientId,
		difficulty,
		rounds: roundsNumber
	}: {
		clientId: string;
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
			clientId,
			rounds
		};

		return jwt.sign(challenge, this.secret);
	}

	/** Get a new challenge for given client params, automatically adjusting difficulty */
	async getChallenge(client: ClientParams): Promise<string> {
		const { difficulty, rounds } = await this.getChallengeParams(client);
		const clientId = this.hashClientId(client);
		await this.difficulty.putEntry({ clientId });
		return this.generateChallenge({ clientId, difficulty, rounds });
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
		client: ClientParams
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

		const clientId = this.hashClientId(client);
		if (challenge.clientId !== clientId) {
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

		const challengeId = challenge.id;

		if (await this.isRedeemed({ challengeId })) {
			return false;
		}

		await this.setRedeemed({ challengeId });

		return true;
	}
}
