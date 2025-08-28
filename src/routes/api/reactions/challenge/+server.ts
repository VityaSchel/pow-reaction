import { json } from '@sveltejs/kit';
import { likeReaction } from '../../../pow-reactions.js';

export function POST() {
	const challenge = likeReaction.getChallenge({ ip: '1.2.3.4' });
	return json({ challenge });
}
