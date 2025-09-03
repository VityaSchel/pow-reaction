/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { Grinder } from './pow-solve.js';

declare const self: DedicatedWorkerGlobalScope;

const onSuccess = (solution: number) => {
	self.postMessage(solution);
	self.close();
};

self.onmessage = (event) => {
	const { id, difficulty } = event.data as { id: string; difficulty: number };
	new Grinder({ id, difficulty, onSuccess }).start();
};
