<script lang="ts">
	import { BROWSER } from 'esm-env';
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

	const valueFormatted = $derived.by(() => {
		const toFixedFloor = (num: number, digits: number) => {
			const factor = Math.pow(10, digits);
			return (Math.floor(num * factor) / factor).toFixed(digits);
		};

		const units = [
			'K',
			'M',
			'B',
			'T',
			'Q',
			'Qi',
			'Sx',
			'Sp',
			'Oc',
			'N',
			'Dc',
			'Ud',
			'Dd',
			'Td',
			'Qd',
			'Qid',
			'Sxd',
			'Spd',
			'Od',
			'Nd',
			'Vg',
			'Uvg',
			'Dvg',
			'Tvg',
			'Qvg',
			'Qivg',
			'Sxvg',
			'Spvg',
			'Ovg',
			'Nvg',
			'Tg',
			'Utg',
			'Dtg',
			'Ttg',
			'Qtg',
			'Qitg',
			'Sxtg',
			'Sptg',
			'Otg',
			'Ntg',
			'Qag',
			'UQag',
			'DQag',
			'TQag',
			'QQag',
			'QiQag',
			'SxQag',
			'SpQag',
			'OQag',
			'NQag',
			'Qig',
			'UQig',
			'DQig',
			'TQig',
			'QQig',
			'QiQig',
			'SxQig',
			'SpQig',
			'OQig',
			'NQig',
			'Sxg',
			'USxg',
			'DSxg',
			'TSxg',
			'QSxg',
			'QiSxg',
			'SxSxg',
			'SpSxg',
			'OSxg',
			'NSxg',
			'Spg',
			'USpg',
			'DSpg',
			'TSpg',
			'QSpg',
			'QiSpg',
			'SxSpg',
			'SpSpg',
			'OSpg',
			'NSpg',
			'Og',
			'UOg',
			'DOg',
			'TOg',
			'QOg',
			'QiOg',
			'SxOg',
			'SpOg',
			'OOg',
			'NOg',
			'Ng',
			'UNg',
			'DNg',
			'TNg',
			'QNg',
			'QiNg',
			'SxNg',
			'SpNg',
			'ONg',
			'NNg',
			'C',
			'UC'
		];

		if (value < 1000) {
			return value.toString();
		} else if (value === Infinity || Number.isNaN(value) || value < 0 || value % 1 !== 0) {
			return '∞';
		}

		const e = Math.floor(Math.log10(value));
		let idx = Math.floor(e / 3) - 1;
		if (idx < 0) idx = 0;
		if (idx >= units.length) idx = units.length - 1;

		const divisor = 10 ** ((idx + 1) * 3);
		const unit = units[idx];

		if (value < 10 * divisor) {
			return toFixedFloor(value / divisor, 1) + unit;
		} else {
			return Math.floor(value / divisor) + unit;
		}
	});
</script>

<div class="flex items-center flex-col gap-1 px-0.5">
	<div class="relative">
		<button
			class={[
				'rounded-full transition-colors focus:outline-0 inline-block text-2xl w-10 h-10 relative z-[1]',
				{
					'cursor-pointer hover:bg-black/10 focus-visible:bg-black/10 dark:hover:bg-neutral-400/30 dark:focus-visible:bg-neutral-400/30':
						!clicked && BROWSER,
					'cursor-progress': clicked && BROWSER,
					'cursor-default': !BROWSER
				}
			]}
			title={BROWSER
				? clicked
					? `${i18n.reactButton.loading} (${Math.floor(progress.current * 100)}%)`
					: i18n.reactButton.reactWith + ' ' + reaction
				: i18n.reactButton.jsRequired}
			disabled={!BROWSER || clicked}
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
					'opacity-100': clicked,
					'opacity-0': !clicked
				}
			]}
			style="--progress: {Math.round(progress.current * 100)}%"
		></div>
	</div>
	<span
		class="text-black/60 text-sm font-medium dark:text-neutral-300/60"
		title={value >= 1000 ? value.toString() : undefined}
	>
		{valueFormatted}
	</span>
</div>

<style>
	.progress {
		background: conic-gradient(var(--tw-gradient-from) var(--progress), transparent 0deg);
	}
</style>
