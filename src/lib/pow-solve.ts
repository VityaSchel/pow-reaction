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
				const worker = new Worker(new URL('./pow-solve-worker', import.meta.url), {
					type: 'module'
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
