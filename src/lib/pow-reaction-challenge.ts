import { z } from 'zod';

export const powReactionChallengeSchema = z.object({
	reaction: z.string().min(1).max(6),
	difficulty: z
		.number()
		.min(0)
		.max(32 * 8)
		.int(),
	expiresAt: z.number().int().nonnegative(),
	ip: z.union([z.ipv4(), z.ipv6()]).optional(),
	rounds: z.array(z.hex().length(32)).min(1)
});

export type PowReactionChallenge = z.infer<typeof powReactionChallengeSchema>;
