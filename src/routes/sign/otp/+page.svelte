<script lang="ts">
	import ChunkyButton from '#lib/client/ui/ChunkyButton.svelte';
	import Logo from '#lib/client/ui/Logo.svelte';
	import OtpField from '#lib/client/ui/OtpField.svelte';
	import Star from '#lib/client/ui/Star.svelte';
	import { otpSchema } from '#lib/client/validation/auth';
	import { cancelSignIn, resendOtp, verifyOtp } from '#lib/remote/auth.remote';

	let { data } = $props();

	const form = verifyOtp.preflight(otpSchema);

	let digits = $state(['', '', '', '', '', '']);
	let notice = $state('');

	const code = $derived(digits.join(''));

	async function resend() {
		const result = await resendOtp();
		notice = result.message;
		digits = ['', '', '', '', '', ''];
	}
</script>

<svelte:head>
	<title>Ton code — BYLIKKI</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="grid grid-cols-1 lg:min-h-[820px] lg:grid-cols-2">
	<section
		class="relative flex flex-col justify-between gap-8 overflow-hidden px-5 py-10 lg:px-[70px] lg:py-[70px]"
		style="background:repeating-linear-gradient(90deg,#FFE9F2 0 22px,#FFF9F2 22px 44px)"
	>
		<div class="hidden self-start lg:block"><Logo size="md" /></div>

		<div class="relative z-[3] flex flex-col gap-4">
			<span class="font-hand text-[24px] text-pink lg:text-[28px]">presque là ✦</span>
			<h1 class="m-0 max-w-[11ch] text-[36px] leading-[1.04] font-semibold lg:text-[52px]">
				Six chiffres, et c’est bon.
			</h1>
			<p class="m-0 max-w-[38ch] text-[15px] leading-[1.6] text-ink/80 lg:text-[16px]">
				Le code expire dans {data.ttlMinutes} minutes et ne fonctionne qu’une seule fois.
			</p>
		</div>

		<Star
			color="#A98BF5"
			size={130}
			class="absolute top-[160px] -right-[20px] hidden animate-float lg:block"
		/>
	</section>

	<section
		class="flex items-center justify-center border-t-2 border-ink bg-paper px-5 py-10 lg:border-t-0 lg:border-l-2 lg:px-[70px] lg:py-[70px]"
	>
		<div class="flex w-full max-w-[420px] flex-col gap-[22px]">
			<div class="flex flex-col gap-2">
				<span class="text-[12px] font-semibold tracking-[0.16em] text-pink uppercase">
					Étape 2 / 2
				</span>
				<h2 class="m-0 text-[28px] font-semibold lg:text-[34px]">Ton code à 6 chiffres</h2>
				<p class="m-0 text-[15px] leading-[1.55] text-ink/70">
					Envoyé à <strong>{data.email}</strong>.
				</p>
			</div>

			<form {...form} class="flex flex-col gap-[22px]">
				<input {...form.fields.code.as('hidden', code)} />
				<OtpField bind:value={digits} />

				{#each form.fields.code.issues() ?? [] as issue (issue.message)}
					<span class="text-[13px] font-semibold text-pink-deep">{issue.message}</span>
				{/each}

				{#if notice}
					<span class="text-[13px] font-semibold text-ink/70">{notice}</span>
				{/if}

				<ChunkyButton type="submit" full disabled={form.pending > 0}>
					{form.pending > 0 ? 'Vérification…' : 'Vérifier et se connecter'}
				</ChunkyButton>
			</form>

			<div class="flex justify-between text-[13.5px]">
				<button
					onclick={() => cancelSignIn()}
					class="cursor-pointer border-b-[1.5px] border-ink pb-px"
				>
					← Changer d’e-mail
				</button>
				<button onclick={resend} class="cursor-pointer font-semibold text-pink">
					Renvoyer le code
				</button>
			</div>

			<span class="font-hand text-[21px] text-ink/60">pense à vérifier les spams ♡</span>
		</div>
	</section>
</div>
