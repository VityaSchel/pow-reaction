<script lang="ts">
	import { Grinder, spawnPowSolveWorker } from '$lib/pow-solve.js';
	import { onMount } from 'svelte';

	let { data } = $props();

	const challenge = $derived(data.challenge);

	let uiUpdates: boolean | null = $state(null);
	let status: 'pending' | 'solved' = $state('pending');
	let progress: number = $state(0);
	let solvedIn: number | null = $state(null);

	$effect(() => {
		status = 'pending';
		solvedIn = null;
		const start = Date.now();
		spawnPowSolveWorker({
			challenge,
			onProgress: (p) => {
				progress = Math.round(p * 100);
			}
		}).then((solutions) => {
			status = 'solved';
			solvedIn = Date.now() - start;
			fetch('/api/verify', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ solutions, challenge })
			})
				.then((res) => res.json())
				.then((data) => {
					console.log('Verification result:', data);
				});
		});
	});

	onMount(() => {
		const interval = setInterval(() => {
			uiUpdates = !uiUpdates;
		}, 10);
		return () => clearInterval(interval);
	});
</script>

<div class="p-8">
	<p class="break-all">
		Progress: {progress}%
	</p>
	<p>
		{status}
	</p>
	<p>
		{#if solvedIn !== null}
			Solved in {solvedIn}ms
		{/if}
	</p>
	{#if uiUpdates !== null}
		{#if uiUpdates}
			<span>O</span>
		{:else}
			<span>X</span>
		{/if}
	{:else}
		<span>Loading...</span>
	{/if}
</div>
