export const reactions = ['👍', '❤️', '👀', '😮', '🤔', '🚀'] as const;

export type Emoji = (typeof reactions)[number];
