import z from 'zod';
import { json } from '@sveltejs/kit';
import { powReactions } from '../../reactions.server.js';
import { reactions } from '../../reactions.js';
import { postReactions } from '../../post.svelte.server.js';

export async function POST({ request }) {
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

	const success = powReactions[body.data.reaction].verifySolution(
		{ challenge, solutions },
		{ ip: '1.2.3.4' }
	);
	if (success) postReactions[body.data.reaction] += 1;
	return json({ success });
}
