import { type Emoji } from './reactions';

export class CloudflareKvDb {
	db: KVNamespace<string>;

	constructor(db: KVNamespace<string>) {
		this.db = db;
	}

	async getReactions(emoji: Emoji) {
		return await this.db.get(`reactions:demo_page:${emoji}`).then((v) => (v ? parseInt(v, 10) : 0));
	}

	async increaseReactions(emoji: Emoji) {
		const value = await this.getReactions(emoji);
		await this.db.put(`reactions:demo_page:${emoji}`, (value + 1).toString());
	}

	async getIpEntries({ emoji, ip }: { emoji: Emoji; ip: string }) {
		const entriesJSON = await this.db.get(`entries:demo_page:${emoji}:${ip}`);
		const timestamps = entriesJSON ? (JSON.parse(entriesJSON) as number[]) : [];
		return timestamps;
	}

	async putIpEntry({ emoji, ip }: { emoji: Emoji; ip: string }) {
		const timestamps = await this.getIpEntries({ emoji, ip });
		timestamps.push(Date.now());
		await this.db.put(`entries:demo_page:${emoji}:${ip}`, JSON.stringify(timestamps), {
			expirationTtl: 60 * 60 * 24
		});
	}

	async isRedeemed(id: string) {
		const value = await this.db.get(`redeemed:demo_page:${id}`);
		return value !== null;
	}

	async setRedeemed(id: string) {
		await this.db.put(`redeemed:demo_page:${id}`, '', { expirationTtl: 60 * 60 * 24 });
	}
}
