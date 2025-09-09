/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { countLeadingZeroBits } from './utils.js';

/** Client-side logic handling challenge solving */
export class Grinder {
	/** Challenge ID */
	id: string;
	/** Difficulty settings provided in challenge */
	difficulty: number;
	/** Callback on successful solution */
	onSuccess: (solution: number) => void;

	constructor({
		id,
		difficulty,
		onSuccess
	}: {
		id: string;
		difficulty: number;
		onSuccess: (solution: number) => void;
	}) {
		this.id = id;
		this.difficulty = difficulty;
		this.onSuccess = onSuccess;
	}

	async start() {
		const encoder = new TextEncoder();
		let nonce = 0;
		while (true) {
			const candidate = `${this.id}.${nonce}`;
			const h = await self.crypto.subtle.digest('SHA-256', encoder.encode(candidate));
			const lz = countLeadingZeroBits(new Uint8Array(h));
			if (lz >= this.difficulty) {
				this.onSuccess(nonce);
				break;
			}
			nonce++;
		}
	}
}

declare const self: DedicatedWorkerGlobalScope;

const onSuccess = (solution: number) => {
	self.postMessage(solution);
	self.close();
};

self.onmessage = async (event) => {
	const { id, difficulty } = event.data as { id: string; difficulty: number };
	try {
		await new Grinder({ id, difficulty, onSuccess }).start();
	} catch (error) {
		setTimeout(() => {
			throw error;
		});
	}
};
