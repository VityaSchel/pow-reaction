<script lang="ts">
	import z from 'zod';
	import { reactions } from '../reactions.js';
	import { invalidate } from '$app/navigation';
	import ReactionButton from '$lib/ReactionButton.svelte';
	import { page } from '$app/state';

	let { data } = $props();
</script>

<div
	class="h-screen flex items-center justify-center flex-col gap-4 bg-white dark:bg-neutral-900 text-black dark:text-white"
>
	<div class="flex items-center justify-center">
		{#snippet Reaction(emoji: string)}
			<ReactionButton
				reaction={emoji}
				value={data.postReactions[emoji] ?? 0}
				onclick={async () => {
					const req = await fetch(`/${page.params.id}/reactions/challenge`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ reaction: emoji })
					});
					if (!req.ok) throw new Error('Failed to get challenge');
					return z.object({ challenge: z.string() }).parse(await req.json());
				}}
				onreact={async ({ challenge, solutions }) => {
					const req = await fetch(`/${page.params.id}/reactions`, {
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
	<span class="text-sm text-neutral-700 dark:text-neutral-300">
		try clicking on any 10-15 times
	</span>
	<span class="text-xs text-neutral-400 dark:text-neutral-700">
		<a href="https://git.hloth.dev/hloth/pow-reaction" target="_blank" rel="noopener noreferrer">
			source
		</a>
		by
		<a href="https://hloth.dev" target="_blank" rel="noopener noreferrer">hloth</a>
	</span>
</div>
