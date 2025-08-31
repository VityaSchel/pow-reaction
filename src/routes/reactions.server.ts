import { PowReaction } from '$lib/pow-reaction.server';
import { CloudflareKvDb } from './demo-db.server';
import { reactions } from './reactions';

export const powReactions = ({ platform }: { platform: App.Platform }) => {
	const db = new CloudflareKvDb(platform.env.pow_reaction_demo);
	return Object.fromEntries(
		reactions.map((emoji) => [
			emoji,
			new PowReaction({
				secret: new TextEncoder().encode(platform.env.JWT_SECRET),
				reaction: emoji,
				difficulty: {
					windowMs: 1000 * 60 * 60 * 24,
					multiplier: 1,
					async getEntries({ ip, since }) {
						const minTime = since.getTime();
						const entries = await db.getIpEntries({ emoji, ip });
						return entries.filter((t) => t > minTime).length;
					},
					async putEntry({ ip }) {
						await db.putIpEntry({ emoji, ip });
					}
				},
				ttl: 1000 * 60,
				isRedeemed: async (id: string) => {
					return db.isRedeemed(id);
				},
				setRedeemed: async (id: string) => {
					await db.setRedeemed(id);
				}
			})
		])
	);
};
