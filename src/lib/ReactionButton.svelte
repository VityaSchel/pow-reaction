<script lang="ts">
	import { browser } from '$app/environment';
	import { Spring } from 'svelte/motion';
	import { spawnPowSolveWorker } from './pow-solve.js';

	let {
		reaction,
		value,
		onclick,
		onreact,
		i18n = {
			reactButton: {
				loading: 'Loading...',
				reactWith: 'React with',
				jsRequired: 'JavaScript is required in order to add reactions'
			}
		}
	}: {
		reaction: string;
		value: number;
		onclick: () => Promise<{ challenge: string }>;
		onreact: ({
			challenge,
			solutions
		}: {
			challenge: string;
			solutions: number[];
		}) => Promise<void>;
		i18n?: {
			reactButton: {
				loading: string;
				reactWith: string;
				jsRequired: string;
			};
		};
	} = $props();

	let clicked = $state(false);
	let progress = new Spring(0, {
		stiffness: 0.05,
		damping: 0.3
	});
</script>

<div class="flex items-center flex-col gap-1">
	<div class="relative">
		<button
			class={[
				'rounded-full transition-colors focus:outline-0 inline-block text-2xl w-10 h-10 relative z-[1]',
				{
					'cursor-pointer hover:bg-black/10 focus-visible:bg-black/10 dark:hover:bg-neutral-400/30 dark:focus-visible:bg-neutral-400/30':
						!clicked && browser,
					'cursor-progress': clicked && browser,
					'cursor-default': !browser
				}
			]}
			title={browser
				? clicked
					? `${i18n.reactButton.loading} (${Math.floor(progress.current * 100)}%)`
					: i18n.reactButton.reactWith + ' ' + reaction
				: i18n.reactButton.jsRequired}
			disabled={!browser || clicked}
			onclick={async () => {
				if (clicked) return;
				progress.set(0.1, {
					instant: true
				});
				clicked = true;
				try {
					const { challenge } = await onclick();
					const solutions = await spawnPowSolveWorker({
						challenge,
						onprogress: (p) => progress.set(0.1 + p * 0.9)
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
				'progress absolute top-0 left-0 w-full h-full rounded-full transition-opacity duration-200 from-black/10 dark:from-neutral-400/30',
				{
					'opacity-100 ': clicked,
					'opacity-0': !clicked
				}
			]}
			style="--progress: {Math.round(progress.current * 100)}%"
		></div>
	</div>
	<span class="text-black/60 text-sm font-medium dark:text-neutral-300/60">
		{value}
	</span>
</div>

<style>
	.progress {
		background: conic-gradient(var(--tw-gradient-from) var(--progress), transparent 0deg);
	}
</style>
