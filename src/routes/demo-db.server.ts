// Cloudflare KV does work well with emojis in keys
// specifically, the list() with prefix command breaks

import { type Emoji } from './reactions';

export const kvReactions: Record<Emoji, string> = {
	'👍': 'like',
	'❤️': 'heart',
	'👀': 'eyes',
	'😮': 'wow',
	'🤔': 'think',
	'🚀': 'rocket'
};

export class CloudflareKvDb {
	db: KVNamespace<string>;

	constructor(db: KVNamespace<string>) {
		this.db = db;
	}

	async getReactions(emoji: Emoji) {
		return await this.db
			.get(`reactions:demo_page:${kvReactions[emoji]}`)
			.then((v) => (v ? parseInt(v, 10) : 0));
	}

	async increaseReactions(emoji: Emoji) {
		const value = await this.getReactions(emoji);
		await this.db.put(`reactions:demo_page:${kvReactions[emoji]}`, (value + 1).toString());
	}

	async getIpEntries({ emoji, ip }: { emoji: Emoji; ip: string }) {
		const prefix = `entries:demo_page:${kvReactions[emoji]}:${ip}:`;
		const entries = await this.db.list({ prefix });
		const timestamps = entries.keys.map((k) => k.name.substring(prefix.length));
		return timestamps.map((t) => parseInt(t, 10));
	}

	async putIpEntry({ emoji, ip }: { emoji: Emoji; ip: string }) {
		const key = `entries:demo_page:${kvReactions[emoji]}:${ip}:${Date.now()}`;
		await this.db.put(key, '', { expirationTtl: 60 * 60 * 24 * 7 });
	}

	async isRedeemed(id: string) {
		const value = await this.db.get(`redeemed:demo_page:${id}`);
		return value !== null;
	}

	async setRedeemed(id: string) {
		await this.db.put(`redeemed:demo_page:${id}`, '', { expirationTtl: 60 * 60 * 24 });
	}
}
