<script lang="ts">
	import ReactionButton from '$lib/ReactionButton.svelte';
	import z from 'zod';

	let { data } = $props();
</script>

<div class="flex items-center justify-center h-screen">
	<ReactionButton
		reaction="👍"
		onclick={async () => {
			console.time('challenge');
			const req = await fetch('/api/reactions/challenge', { method: 'POST' });
			if (!req.ok) throw new Error('Failed to get challenge');
			const res = await req.json();
			z.object({ challenge: z.string() }).parse(res);
			return { challenge: res.challenge };
		}}
		onreact={async ({ challenge, solutions }) => {
			console.timeEnd("challenge")
			const req = await fetch('/api/reactions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ challenge, solutions })
			});
			if (!req.ok) throw new Error('Failed to add reaction');
			const res = await req.json();
			z.object({ success: z.literal(true) }).parse(res);
		}}
	/>
</div>
