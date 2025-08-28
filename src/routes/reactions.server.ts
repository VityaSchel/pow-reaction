import { PowReaction } from '$lib/pow-reaction.server.js';
import { reactions } from './reactions.js';

export const powReactions = Object.fromEntries(
	reactions.map((emoji) => [
		emoji,
		new PowReaction({
			secret: crypto.getRandomValues(new Uint8Array(32)),
			reaction: emoji,
			difficultyMultiplier: 1,
			ttl: 1000 * 60
		})
	])
);
