import { Grinder } from './grinder.js';

interface DedicatedWorkerScope {
	postMessage(message: unknown): void;
	close(): void;
	onmessage: ((event: MessageEvent) => void) | null;
}

declare const self: DedicatedWorkerScope;

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
