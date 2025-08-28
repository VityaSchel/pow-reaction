import { json } from '@sveltejs/kit';
import { likeReaction } from '../../pow-reactions.js';
import z from 'zod';

export async function POST({ request }) {
	const body = await z
		.object({
			challenge: z.string().min(1),
			solutions: z.array(z.number().int().nonnegative())
		})
		.safeParseAsync(await request.json());

	if (!body.success) {
		return json({ success: false }, { status: 400 });
	}
	const { challenge, solutions } = body.data;

	const success = likeReaction.verifySolution({ challenge, solutions }, { ip: '1.2.3.4' });
	return json({ success });
}
