import { reactions } from './reactions.js';

export const postReactions = $state(Object.fromEntries(reactions.map((emoji) => [emoji, 0])));
export const mockDb: Record<
	string,
	Record<string, { reaction: string; ip: string; timestamp: number }[]>
> = Object.fromEntries(reactions.map((emoji) => [emoji, {}]));
