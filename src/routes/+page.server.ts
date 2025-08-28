import { postReactions } from './post.svelte.server.js';

export function load({ depends }) {
	depends('post:reactions');
	return { postReactions };
}
