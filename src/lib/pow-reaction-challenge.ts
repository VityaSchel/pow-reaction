import { z } from 'zod';

/** PoW reaction challenge */
export type PowReactionChallenge = {
	/** Unique challenge ID */
	id: string;
	/** Reaction, provided in PowReaction class constructor */
	reaction: string;
	/** Number of leading zero bits required */
	difficulty: number;
	/** Expiration timestamp in seconds since epoch for JWT */
	exp: number;
	/** Array of hex-encoded SHA-256 salts for each round */
	rounds: string[];
	/** Client params binding challenge to a context */
	clientId: string;
};

export const powReactionChallengeSchema = z.object({
	id: z.uuid(),
	reaction: z.string().min(1),
	difficulty: z
		.number()
		.min(0)
		.max(32 * 8)
		.int(),
	exp: z.number().int().nonnegative(),
	clientId: z.string().length(64),
	rounds: z.array(z.hex().length(32)).min(1)
});

export type powReactionChallengeSchema = z.infer<typeof powReactionChallengeSchema>;

function _schema1(x: PowReactionChallenge): powReactionChallengeSchema {
	return x;
}
function _schema2(x: powReactionChallengeSchema): PowReactionChallenge {
	return x;
}
