<script lang="ts">
	import { avatarSchema, imageAccept } from '#lib/client/validation/media';
	import { removeAvatar, updateAvatar } from '#lib/remote/user.remote';

	let { avatarUrl, displayName }: { avatarUrl: string | null; displayName: string | null } =
		$props();

	const form = updateAvatar.preflight(avatarSchema);
	const initial = $derived((displayName ?? '♡').slice(0, 1).toUpperCase());
</script>

<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
	{#if avatarUrl}
		<img
			src={avatarUrl}
			alt="Toi, en portrait"
			class="h-[84px] w-[84px] flex-none rounded-full border-2 border-ink object-cover"
		/>
	{:else}
		<div
			class="flex h-[84px] w-[84px] flex-none items-center justify-center rounded-full border-2 border-dashed border-ink/40 bg-pink-pale text-[28px] font-semibold text-ink/50"
			aria-hidden="true"
		>
			{initial}
		</div>
	{/if}

	<form {...form} enctype="multipart/form-data" class="flex flex-col gap-2">
		<label for="avatar" class="text-[12.5px] font-semibold text-ink/70">Photo de profil</label>
		<div class="flex flex-wrap items-center gap-2.5">
			<input
				id="avatar"
				{...form.fields.photo.as('file')}
				accept={imageAccept}
				class="text-[14px] file:mr-3 file:cursor-pointer file:rounded-[40px] file:border-[1.5px] file:border-ink file:bg-yellow-soft file:px-4 file:py-2 file:text-[13px] file:font-semibold"
			/>
			<button
				type="submit"
				disabled={form.pending > 0}
				class="cursor-pointer rounded-[40px] bg-ink px-5 py-2.5 text-[13px] font-semibold text-cream disabled:opacity-50"
			>
				{form.pending > 0 ? 'Envoi…' : 'Envoyer'}
			</button>
			{#if avatarUrl}
				<button
					type="button"
					onclick={() => removeAvatar()}
					class="cursor-pointer border-b-[1.5px] border-ink/40 pb-px text-[13px] text-ink/70"
				>
					Retirer
				</button>
			{/if}
		</div>
		<span class="text-[12px] text-ink/55">
			Convertie en WebP, réduite à 320 px et débarrassée de ses métadonnées.
		</span>
		{#each form.fields.photo.issues() ?? [] as issue (issue.message)}
			<span class="text-[13px] font-semibold text-pink-deep">{issue.message}</span>
		{/each}
	</form>
</div>
