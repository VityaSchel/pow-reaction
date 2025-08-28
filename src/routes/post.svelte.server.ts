import { reactions } from './reactions.js';

export const postReactions = $state(Object.fromEntries(reactions.map((emoji) => [emoji, 0])));
