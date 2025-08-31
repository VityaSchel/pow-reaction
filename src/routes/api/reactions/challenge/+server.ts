import z from 'zod';
import { json } from '@sveltejs/kit';
import { powReactions } from '../../../reactions.server.js';
import { reactions } from '../../../reactions.js';

export async function POST({ request, platform, getClientAddress }) {
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
	const challenge = await powReactions({ platform })[body.data.reaction].getChallenge({ ip });
	return json({ challenge });
}
