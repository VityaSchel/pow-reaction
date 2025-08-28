import { postReactions } from './mockdb.svelte.server.js';

export function load({ depends }) {
	depends('post:reactions');
	return { postReactions };
}
