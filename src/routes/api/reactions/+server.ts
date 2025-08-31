import z from 'zod';
import { json } from '@sveltejs/kit';
import { powReactions } from '../../reactions.server.js';
import { reactions } from '../../reactions.js';
import { CloudflareKvDb } from '../../demo-db.server.js';

export async function POST({ request, platform, getClientAddress }) {
	const body = await z
		.object({
			challenge: z.string().min(1),
			solutions: z.array(z.number().int().nonnegative()),
			reaction: z.enum(reactions)
		})
		.safeParseAsync(await request.json());

	if (!body.success) {
		return json({ success: false }, { status: 400 });
	}
	const { challenge, solutions } = body.data;

	const ip = getClientAddress();
	if (!ip) {
		return json({ success: false }, { status: 403 });
	}

	if (!platform) {
		throw new Error('Cloudflare KV is not available');
	}
	const powReaction = powReactions({ platform })[body.data.reaction];
	const success = powReaction.verifySolution({ challenge, solutions }, { ip });
	if (success) {
		const db = new CloudflareKvDb(platform.env.pow_reaction_demo);
		await db.increaseReactions(body.data.reaction);
	}
	return json({ success });
}
