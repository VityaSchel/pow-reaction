import z from 'zod';
import { json } from '@sveltejs/kit';
import { powReactions } from '../../../reactions.server.js';
import { reactions } from '../../../reactions.js';

export async function POST({ request, platform, getClientAddress, params }) {
	const body = await z
		.object({
			reaction: z.enum(reactions)
		})
		.safeParseAsync(await request.json());

	if (!body.success) {
		return json({ success: false }, { status: 400 });
	}

	const ip = getClientAddress();
	if (!ip) {
		return json({ success: false }, { status: 403 });
	}

	if (!platform) {
		throw new Error('Cloudflare KV is not available');
	}
	const powReaction = powReactions({ platform })[body.data.reaction];
	const challenge = await powReaction.getChallenge({ ip, pageId: params.id });
	return json({ challenge });
}
