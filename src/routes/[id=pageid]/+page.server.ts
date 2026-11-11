import { env } from 'cloudflare:workers';
import { reactions } from '../reactions.js';
import { CloudflareKvDb } from '../demo-db.server.js';

export async function load({ depends, params }) {
	const db = new CloudflareKvDb(env.pow_reaction_demo);
	depends('post:reactions');
	const postReactions = Object.fromEntries(
		await Promise.all(
			reactions.map(async (emoji) => [emoji, await db.getReactions({ pageId: params.id, emoji })])
		)
	);
	return { postReactions };
}
