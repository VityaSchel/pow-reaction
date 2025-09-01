import { z } from 'zod';

export type PowReactionChallenge = {
	id: string;
	reaction: string;
	difficulty: number;
	exp: number;
	rounds: string[];
	ip?: string | undefined;
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
	ip: z.union([z.ipv4(), z.ipv6()]).optional(),
	rounds: z.array(z.hex().length(32)).min(1)
});

export type powReactionChallengeSchema = z.infer<typeof powReactionChallengeSchema>;

function _schema1(x: PowReactionChallenge): powReactionChallengeSchema {
	return x;
}
function _schema2(x: powReactionChallengeSchema): PowReactionChallenge {
	return x;
}
