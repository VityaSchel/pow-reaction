<script lang="ts">
	import z from 'zod';
	import { reactions } from './reactions.js';
	import { invalidate } from '$app/navigation';
	import ReactionButton from '$lib/ReactionButton.svelte';

	let { data } = $props();
</script>

<div class="flex items-center justify-center h-screen gap-1">
	{#snippet Reaction(emoji: string)}
		<ReactionButton
			reaction={emoji}
			value={data.postReactions[emoji] ?? 0}
			onclick={async () => {
				const req = await fetch('/api/reactions/challenge', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ reaction: emoji })
				});
				if (!req.ok) throw new Error('Failed to get challenge');
				return z.object({ challenge: z.string() }).parse(await req.json());
			}}
			onreact={async ({ challenge, solutions }) => {
				const req = await fetch('/api/reactions', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ challenge, solutions, reaction: emoji })
				});
				if (!req.ok) throw new Error('Failed to add reaction');
				z.object({ success: z.literal(true) }).parse(await req.json());
				invalidate('post:reactions');
			}}
		/>
	{/snippet}
	{#each reactions as emoji}
		{@render Reaction(emoji)}
	{/each}
</div>
