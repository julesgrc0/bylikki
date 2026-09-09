<script lang="ts">
	/** Six cases pour le code à usage unique, avec avance et retour automatiques. */
	let { value = $bindable(['', '', '', '', '', '']) }: { value?: string[] } = $props();

	let inputs = $state<HTMLInputElement[]>([]);

	function onInput(i: number, e: Event) {
		const el = e.currentTarget as HTMLInputElement;
		const digit = el.value.replace(/[^0-9]/g, '').slice(-1);
		value[i] = digit;
		el.value = digit;
		if (digit && i < value.length - 1) inputs[i + 1]?.focus();
	}

	function onKey(i: number, e: KeyboardEvent) {
		if (e.key === 'Backspace' && !value[i] && i > 0) inputs[i - 1]?.focus();
		if (e.key === 'ArrowLeft' && i > 0) inputs[i - 1]?.focus();
		if (e.key === 'ArrowRight' && i < value.length - 1) inputs[i + 1]?.focus();
	}

	function onPaste(e: ClipboardEvent) {
		const digits = (e.clipboardData?.getData('text') ?? '').replace(/[^0-9]/g, '').slice(0, 6);
		if (!digits) return;
		e.preventDefault();
		value = Array.from({ length: 6 }, (_, i) => digits[i] ?? '');
		inputs[Math.min(digits.length, 5)]?.focus();
	}
</script>

<div class="flex gap-2 lg:gap-2.5">
	{#each value as digit, i (i)}
		<input
			bind:this={inputs[i]}
			value={digit}
			oninput={(e) => onInput(i, e)}
			onkeydown={(e) => onKey(i, e)}
			onpaste={onPaste}
			maxlength="1"
			inputmode="numeric"
			autocomplete={i === 0 ? 'one-time-code' : 'off'}
			aria-label={`Chiffre ${i + 1}`}
			class="h-[64px] w-[46px] rounded-[16px] border-2 border-ink bg-cream text-center text-[24px] font-semibold text-ink outline-none focus:border-pink sm:w-[60px] sm:text-[26px] lg:h-[72px]"
		/>
	{/each}
</div>
