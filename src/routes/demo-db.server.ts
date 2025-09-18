import { type Emoji } from './reactions';

export class CloudflareKvDb {
	db: KVNamespace<string>;

	constructor(db: KVNamespace<string>) {
		this.db = db;
	}

	async getReactions({ pageId, emoji }: { pageId: string; emoji: Emoji }) {
		return await this.db.get(`reactions:${pageId}:${emoji}`).then((v) => (v ? parseInt(v, 10) : 0));
	}

	async increaseReactions({ pageId, emoji }: { pageId: string; emoji: Emoji }) {
		const value = await this.getReactions({ pageId, emoji });
		await this.db.put(`reactions:${pageId}:${emoji}`, (value + 1).toString());
	}

	async getClientEntries({ clientId }: { clientId: string }) {
		const entriesJSON = await this.db.get(`entries:${clientId}`);
		const timestamps = entriesJSON ? (JSON.parse(entriesJSON) as number[]) : [];
		return timestamps;
	}

	async putClientEntry({ clientId }: { clientId: string }) {
		const timestamps = await this.getClientEntries({ clientId });
		timestamps.push(Date.now());
		await this.db.put(`entries:${clientId}`, JSON.stringify(timestamps), {
			expirationTtl: 60 * 60 * 24
		});
	}

	async isRedeemed({ challengeId }: { challengeId: string }) {
		const value = await this.db.get(`redeemed:${challengeId}`);
		return value !== null;
	}

	async setRedeemed({ challengeId }: { challengeId: string }) {
		await this.db.put(`redeemed:${challengeId}`, '', { expirationTtl: 60 * 60 * 24 });
	}
}
