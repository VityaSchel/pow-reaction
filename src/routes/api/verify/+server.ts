import { json } from '@sveltejs/kit';
import { captcha } from '../../server.js';
import z from 'zod';

export async function POST({ request }) {
	const { challenge, solutions } = z
		.object({
			challenge: z.string().min(1),
			solutions: z.array(z.number().int().nonnegative())
		})
		.parse(await request.json());

	const start = Date.now();
	const success = captcha.verifySolution({ challenge, solutions }, { ip: '1.2.3.4' });
	const end = Date.now();
	console.log('verification took', end - start, 'ms');
	return json({ success });
}
