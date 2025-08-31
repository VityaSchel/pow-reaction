import { PowReaction } from '$lib/pow-reaction.server';
import { CfKvDb } from './demo-db.server';
import { reactions } from './reactions';

export const powReactions = ({ platform }: { platform: App.Platform }) => {
	const db = new CfKvDb(platform.env.pow_reaction_demo);
	return Object.fromEntries(
		reactions.map((emoji) => [
			emoji,
			new PowReaction({
				secret: crypto.getRandomValues(new Uint8Array(32)),
				reaction: emoji,
				difficulty: {
					windowMs: 1000 * 60,
					multiplier: 5,
					async getEntries({ ip, since }) {
						const minTime = since.getTime();
						const entries = await db.getIpEntries({ emoji, ip });
						return entries.filter((t) => t > minTime).length;
					},
					async putEntry({ ip }) {
						await db.putIpEntry({ emoji, ip });
					}
				},
				ttl: 1000 * 60
			})
		])
	);
};
