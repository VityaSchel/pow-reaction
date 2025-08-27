/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import z from 'zod';
import { Grinder } from '$lib/pow-solve.js';

declare const self: DedicatedWorkerGlobalScope;

const onSuccess = (solution: number) => {
	self.postMessage(solution);
	self.close();
};

self.onmessage = (event) => {
  console.log('Worker received message:', event.data);
	const { id, difficulty } = z
		.object({
			id: z.string().min(1),
			difficulty: z.number().int().nonnegative()
		})
		.parse(event.data);
	new Grinder({ id, difficulty, onSuccess }).start();
};
