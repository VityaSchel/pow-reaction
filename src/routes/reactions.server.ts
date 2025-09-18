import { PowReaction } from '$lib/pow-reaction.server';
import { CloudflareKvDb } from './demo-db.server';
import { reactions } from './reactions';

export const powReactions = ({ platform }: { platform: App.Platform }) => {
	const db = new CloudflareKvDb(platform.env.pow_reaction_demo);
	return Object.fromEntries(
		reactions.map((emoji) => [
			emoji,
			new PowReaction<{ ip: string; pageId: string }>({
				secret: new TextEncoder().encode(platform.env.JWT_SECRET),
				reaction: emoji,
				difficulty: {
					windowMs: 1000 * 60 * 60 * 24,
					multiplier: 1,
					async getEntries({ clientId, since }) {
						const minTime = since.getTime();
						const entries = await db.getClientEntries({ clientId });
						return entries.filter((t) => t > minTime).length;
					},
					async putEntry({ clientId }) {
						await db.putClientEntry({ clientId });
					}
				},
				ttl: 1000 * 60,
				isRedeemed: async ({ challengeId }) => {
					return db.isRedeemed({ challengeId });
				},
				setRedeemed: async ({ challengeId }) => {
					await db.setRedeemed({ challengeId });
				}
			})
		])
	);
};
