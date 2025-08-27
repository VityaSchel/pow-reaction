import { PowReaction } from '$lib/pow-reaction.server.js';

export const captcha = new PowReaction({
	secret: crypto.getRandomValues(new Uint8Array(32)),
	reaction: '✅',
	difficultyMultiplier: 1,
	ttl: 1000 * 60
});
