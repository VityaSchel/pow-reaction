import { countLeadingZeroBits } from './utils.js';
import type { PowReactionChallenge } from './pow-reaction-challenge.js';

function decodeJWT(token: string): object | null {
	let output = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
	switch (output.length % 4) {
		case 0:
			break;
		case 2:
			output += '==';
			break;
		case 3:
			output += '=';
			break;
		default:
			throw new Error('Illegal base64url string');
	}
	const result = window.atob(output);
	return JSON.parse(decodeURIComponent(escape(result)));
}

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

export async function spawnPowSolveWorker({
	challenge: payload,
	onprogress
}: {
	challenge: string;
	onprogress?: (progress: number) => void;
}) {
	const { difficulty, rounds, exp } = decodeJWT(payload) as PowReactionChallenge;
	const solutions: number[] = [];
	const batchSize = navigator.hardwareConcurrency || 1;

	for (let i = 0; i < rounds.length; i += batchSize) {
		const batch = rounds.slice(i, i + batchSize);

		const batchPromises = batch.map((round) => {
			return new Promise<number>((resolve, reject) => {
				const worker = new Worker(new URL('./pow-solve-worker.ts', import.meta.url).href, {
					type: 'module'
					// preload: ['$lib/pow-solve.js']
				});

				worker.onerror = (error) => {
					reject(error);
				};

				const timeout = setTimeout(
					() => {
						worker.terminate();
						reject(new Error('Challenge expired'));
					},
					exp * 1000 - Date.now()
				);

				worker.onmessage = (event) => {
					const solution = event.data;
					if (typeof solution === 'number' && Number.isSafeInteger(solution) && solution >= 0) {
						clearTimeout(timeout);
						worker.terminate();
						resolve(solution);
					} else {
						reject(new Error('Invalid message from worker'));
					}
				};

				worker.postMessage({ id: round, difficulty });
			});
		});

		const batchSolutions = await Promise.all(batchPromises);
		solutions.push(...batchSolutions);
		onprogress?.(solutions.length / rounds.length);
	}
	return solutions;
}
