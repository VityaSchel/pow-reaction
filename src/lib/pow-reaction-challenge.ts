import { z } from 'zod';

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

export type PowReactionChallenge = z.infer<typeof powReactionChallengeSchema>;
