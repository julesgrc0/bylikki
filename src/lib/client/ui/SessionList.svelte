<script lang="ts">
	import { revokeMySession, type listMySessions } from '#lib/remote/user.remote';

	type ActiveSession = Awaited<ReturnType<typeof listMySessions>>[number];

	let { sessions }: { sessions: ActiveSession[] } = $props();

	const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
		dateStyle: 'short',
		timeStyle: 'short'
	});
</script>

<section class="rounded-[20px] bg-blue-soft p-6 lg:rounded-[26px] lg:p-[30px]">
	<h2 class="mt-0 mb-1.5 text-[22px] font-semibold lg:text-[24px]">Appareils connectés</h2>
	<p class="mt-0 mb-[18px] text-[14px] text-ink/72">
		Aucune adresse IP n’est conservée en clair : seul un libellé d’appareil est enregistré.
	</p>

	<div class="flex flex-col gap-3">
		{#each sessions as session (session.id)}
			<div
				class="flex flex-col gap-3 rounded-[18px] border-[1.5px] border-ink/20 bg-paper px-[18px] py-[15px] sm:flex-row sm:items-center sm:justify-between"
			>
				<div class="flex min-w-0 flex-col gap-[3px]">
					<span class="text-[15px] font-semibold">
						{session.userAgentLabel ?? 'Appareil inconnu'}
						{#if session.isCurrent}
							<span class="ml-2 rounded-[20px] bg-green-soft px-2.5 py-[2px] text-[11.5px]">
								Cet appareil
							</span>
						{/if}
					</span>
					<span class="text-[12.5px] text-ink/60">
						Dernière activité : {dateFormatter.format(session.lastSeenAt)}
					</span>
				</div>
				{#if !session.isCurrent}
					<button
						onclick={() => revokeMySession(session.id)}
						class="cursor-pointer self-start rounded-[40px] border-[1.5px] border-ink bg-paper px-[18px] py-2.5 text-[13px] font-semibold sm:self-auto"
					>
						Déconnecter
					</button>
				{/if}
			</div>
		{/each}
	</div>
</section>
