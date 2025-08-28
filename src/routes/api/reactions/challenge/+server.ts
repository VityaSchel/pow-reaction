import z from 'zod';
import { json } from '@sveltejs/kit';
import { powReactions } from '../../../reactions.server.js';
import { reactions } from '../../../reactions.js';

export async function POST({ request }) {
	const body = await z
		.object({
			reaction: z.enum(reactions)
		})
		.safeParseAsync(await request.json());

	if (!body.success) {
		return json({ success: false }, { status: 400 });
	}

	const challenge = powReactions[body.data.reaction].getChallenge({ ip: '1.2.3.4' });
	return json({ challenge });
}
