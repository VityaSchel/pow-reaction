import z from 'zod';
import { env } from 'cloudflare:workers';
import { powReactions } from '../../reactions.server.js';
import { reactions } from '../../reactions.js';
import { CloudflareKvDb } from '../../demo-db.server.js';

export async function POST({ request, getClientAddress, params }) {
	const body = await z
		.object({
			challenge: z.string().min(1),
			solutions: z.array(z.number().int().nonnegative()),
			reaction: z.enum(reactions)
		})
		.safeParseAsync(await request.json());

	if (!body.success) {
		return Response.json({ success: false }, { status: 400 });
	}
	const { challenge, solutions } = body.data;

	const ip = getClientAddress();
	if (!ip) {
		return Response.json({ success: false }, { status: 403 });
	}

	const powReaction = powReactions()[body.data.reaction];
	const success = await powReaction.verifySolution(
		{ challenge, solutions },
		{ ip, pageId: params.id }
	);
	if (success) {
		const db = new CloudflareKvDb(env.pow_reaction_demo);
		await db.increaseReactions({ pageId: params.id, emoji: body.data.reaction });
	}
	return Response.json({ success });
}
