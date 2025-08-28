import { PowReaction } from '$lib/pow-reaction.server.js';
import { mockDb } from './mockdb.svelte.server.js';
import { reactions } from './reactions.js';

export const powReactions = Object.fromEntries(
	reactions.map((emoji) => [
		emoji,
		new PowReaction({
			secret: crypto.getRandomValues(new Uint8Array(32)),
			reaction: emoji,
			difficulty: {
				windowMs: 1000 * 60,
				multiplier: 5,
				async getEntries({ ip, since }) {
					const ipDb = mockDb[emoji];
					if (!ipDb[ip]) return 0;
					return ipDb[ip].filter((entry) => entry.timestamp >= since.getTime()).length;
				},
				putEntry({ ip }) {
					const ipDb = mockDb[emoji];
					if (!ipDb[ip]) ipDb[ip] = [];
					ipDb[ip].push({ reaction: emoji, ip, timestamp: Date.now() });
				}
			},
			ttl: 1000 * 60
		})
	])
);
