import { reactions } from './reactions.js';
import { CfKvDb } from './demo-db.server.js';

export async function load({ depends, platform }) {
	if (!platform) {
		throw new Error('Cloudflare KV is not available');
	}
	const db = new CfKvDb(platform.env.pow_reaction_demo);
	depends('post:reactions');
	const postReactions = Object.fromEntries(
		await Promise.all(reactions.map(async (emoji) => [emoji, await db.getReactions(emoji)]))
	);
	return { postReactions };
}
