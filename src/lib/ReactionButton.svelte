<script lang="ts">
	import { spawnPowSolveWorker } from '$lib/pow-solve.js';
	import { Spring } from 'svelte/motion';

	let {
		reaction,
		onclick,
		onreact
	}: {
		reaction: string;
		onclick: () => Promise<{ challenge: string }>;
		onreact: ({
			challenge,
			solutions
		}: {
			challenge: string;
			solutions: number[];
		}) => Promise<void>;
	} = $props();

	let clicked = $state(false);
	let progress = new Spring(0, {
		stiffness: 0.05,
		damping: 0.3
	});
</script>

<div class="relative">
	<button
		class={[
			'rounded-full transition-colors focus:outline-0 inline-block text-2xl w-10 h-10 cursor-pointer relative z-[1] disabled:cursor-progress',
			{
				'hover:bg-black/10 focus-visible:bg-black/10': !clicked
			}
		]}
		disabled={clicked}
		onclick={async () => {
			if (clicked) return;
			progress.set(0, {
				instant: true
			});
			clicked = true;
			try {
				const { challenge } = await onclick();
				const solutions = await spawnPowSolveWorker({
					challenge,
					onprogress: (p) => progress.set(p)
				});
				await Promise.all([
					onreact({ challenge, solutions }),
					new Promise((r) => setTimeout(r, 200))
				]);
			} finally {
				clicked = false;
			}
		}}
	>
		{reaction}
	</button>
	<div
		class={[
			'progress absolute top-0 left-0 w-full h-full rounded-full transition-opacity duration-200',
			{
				'opacity-100 ': clicked,
				'opacity-0': !clicked
			}
		]}
		style="--progress: {Math.round(progress.current * 100)}%"
	></div>
</div>

<style>
	.progress {
		background: conic-gradient(rgba(0, 0, 0, 0.1) var(--progress), transparent 0deg);
	}
</style>
