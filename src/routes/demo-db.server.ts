export class CfKvDb {
	db: KVNamespace<string>;

	constructor(db: KVNamespace<string>) {
		this.db = db;
	}

	async getReactions(emoji: string) {
		return await this.db.get(`reactions:demo_page:${emoji}`).then((v) => (v ? parseInt(v, 10) : 0));
	}

	async increaseReactions(emoji: string) {
		const value = await this.getReactions(emoji);
		await this.db.put(`reactions:demo_page:${emoji}`, (value + 1).toString());
	}

	async getIpEntries({ emoji, ip }: { emoji: string; ip: string }) {
		const prefix = `entries:demo_page:${emoji}:${ip}:`;
		const entries = await this.db.list({ prefix });
		const timestamps = entries.keys.map((k) => k.name.substring(prefix.length));
		return timestamps.map((t) => parseInt(t, 10));
	}

	async putIpEntry({ emoji, ip }: { emoji: string; ip: string }) {
		const key = `entries:demo_page:${emoji}:${ip}:${Date.now()}`;
		await this.db.put(key, '', { expirationTtl: 60 * 60 * 24 * 7 });
	}
}
