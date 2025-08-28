<script lang="ts">
	import { spawnPowSolveWorker } from '$lib/pow-solve.js';

	let {
		reaction,
		onclick,
		onreact
	}: {
		reaction: string;
		onclick: () => Promise<{ challenge: string }>;
		onreact: ({ challenge, solutions }: { challenge: string; solutions: number[] }) => void;
	} = $props();

	let clicked = $state(false);
</script>

<button
	class="rounded-full transition-colors hover:bg-black/10 focus-visible:bg-black/10 focus:outline-0 inline-block text-2xl w-10 h-10 cursor-pointer"
	disabled={clicked}
	onclick={async () => {
		if (clicked) return;
		clicked = true;
		try {
			const { challenge } = await onclick();
			const solutions = await spawnPowSolveWorker({ challenge });
			onreact({ challenge, solutions });
		} finally {
			clicked = false;
		}
	}}
>
	{reaction}
</button>
