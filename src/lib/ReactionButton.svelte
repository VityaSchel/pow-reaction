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

<div class="reaction-button">
	<div class="reaction-button_icon">
		<button
			class={[
				{
					'cursor-pointer active': !clicked && BROWSER,
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
				'reaction-button_progress',
				{
					'opacity-100': clicked,
					'opacity-0': !clicked
				}
			]}
			style="--progress: {Math.round(progress.current * 100)}%"
		></div>
	</div>
	<span class="reaction-button_text" title={value >= 1000 ? value.toString() : undefined}>
		{valueFormatted}
	</span>
</div>

<style>
	.reaction-button {
		display: flex;
		align-items: center;
		flex-direction: column;
		gap: 0.25rem;
		padding-left: 0.125rem;
		padding-right: 0.125rem;
	}

	.reaction-button_icon {
		position: relative;
	}

	.reaction-button_text {
		font-size: 14px;
		font-weight: 500;
	}
	.reaction-button_text {
		color: var(--reaction-button-text-color, rgba(0, 0, 0, 0.6));
	}
	@media (prefers-color-scheme: dark) {
		.reaction-button_text {
			color: var(--reaction-button-text-color, rgba(212, 212, 212, 0.6));
		}
	}

	.reaction-button button {
		border-radius: calc(infinity * 1px);
		display: inline-block;
		font-size: 1.5rem;
		width: 2.5rem;
		height: 2.5rem;
		position: relative;
		z-index: 1;
		transition: background-color 150ms ease;

		&:focus {
			outline: 0;
		}

		&.active {
			@media (hover: hover) and (pointer: fine) {
				&:hover {
					background-color: var(--reaction-button-highlight-color, rgba(0, 0, 0, 0.1));
				}
			}
			&:focus-visible {
				background-color: var(--reaction-button-highlight-color, rgba(0, 0, 0, 0.1));
			}
		}
		&.cursor-pointer {
			cursor: pointer;
		}
		&.cursor-progress {
			cursor: progress;
		}
		&.cursor-default {
			cursor: default;
		}
	}
	@media (prefers-color-scheme: dark) {
		.reaction-button button.active {
			&:focus-visible {
				background-color: var(--reaction-button-highlight-color, rgba(161, 161, 161, 0.3));
			}
		}
	}
	@media (prefers-color-scheme: dark) and (hover: hover) and (pointer: fine) {
		.reaction-button button.active:hover {
			background-color: var(--reaction-button-highlight-color, rgba(161, 161, 161, 0.3));
		}
	}

	.reaction-button_progress {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		border-radius: calc(infinity * 1px);
		transition: opacity 200ms ease;
		background: conic-gradient(
			var(--reaction-button-highlight-color, rgba(0, 0, 0, 0.1)) var(--progress),
			transparent 0deg
		);

		&.opacity-0 {
			opacity: 0;
		}
		&.opacity-100 {
			opacity: 1;
		}
	}
	@media (prefers-color-scheme: dark) {
		.reaction-button_progress {
			background: conic-gradient(
				var(--reaction-button-highlight-color, rgba(161, 161, 161, 0.3)) var(--progress),
				transparent 0deg
			);
		}
	}
</style>
