import z from 'zod';
import { sha256 } from '@noble/hashes/sha2';
import { utf8ToBytes } from '@noble/hashes/utils';
import { decodeJWT } from '@oslojs/jwt';
import { countLeadingZeroBits } from '$lib/utils.js';
import { powReactionChallengeSchema } from '$lib/pow-reaction-challenge.js';

export class Grinder {
	id: string;
	difficulty: number;
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

	start() {
		let nonce = 0;
		while (true) {
			const candidate = `${this.id}.${nonce}`;
			const h = sha256(utf8ToBytes(candidate));
			const lz = countLeadingZeroBits(h);
			if (lz >= this.difficulty) {
				this.onSuccess(nonce);
				break;
			}
			nonce++;
		}
	}
}

export async function spawnPowSolveWorker({
	challenge: payload,
	onProgress
}: {
	challenge: string;
	onProgress?: (progress: number) => void;
}) {
	const { difficulty, rounds, expiresAt } = powReactionChallengeSchema.parse(decodeJWT(payload));
	const solutions: number[] = [];
	const batchSize = navigator.hardwareConcurrency || 1;

	for (let i = 0; i < rounds.length; i += batchSize) {
		const batch = rounds.slice(i, i + batchSize);

		const batchPromises = batch.map((round) => {
			return new Promise<number>((resolve, reject) => {
				const worker = new Worker(new URL('./pow-solve-worker.ts', import.meta.url).href, {
					type: 'module',
					preload: ['zod']
				});

				worker.onerror = (error) => {
					reject(error);
				};

				const timeout = setTimeout(() => {
					worker.terminate();
					reject(new Error('Challenge expired'));
				}, expiresAt - Date.now());

				worker.onmessage = (event) => {
					const payload = z.number().safeParse(event.data);
					if (payload.success) {
						clearTimeout(timeout);
						worker.terminate();
						resolve(payload.data);
					} else {
						reject(new Error('Invalid message from worker'));
					}
				};

				worker.postMessage({ id: round, difficulty });
			});
		});

		const batchSolutions = await Promise.all(batchPromises);
		solutions.push(...batchSolutions);
		onProgress?.(solutions.length / rounds.length);
	}
	return solutions;
}
