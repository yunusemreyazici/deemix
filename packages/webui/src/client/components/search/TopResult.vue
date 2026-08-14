<script setup lang="ts">
import { upperCaseFirstLowerCaseRest } from "@/utils/texts";
import CoverContainer from "@/components/globals/CoverContainer.vue";
import { useI18n } from "vue-i18n";
import { computed } from "vue";

const { t, n } = useI18n();

interface Props {
	info: {
		type: string;
		id: string;
		title: string;
		picture: string;
		link: string;
		artist: string;
		nb_fan: number;
		nb_song: string;
	};
}

const { info } = defineProps<Props>();

const fansNumber = computed(() => {
	let number: string;

	if (info.nb_fan) {
		try {
			number = n(info.nb_fan);
		} catch {
			number = n(info.nb_fan, { locale: "en" });
		}
	}

	return info.type === "artist"
		? t("search.fans", { n: number })
		: t("globals.by", { artist: info.artist }) +
				" - " +
				t("globals.listTabs.trackN", info.nb_song);
});
</script>

<template>
	<div class="top-result">
		<router-link
			v-slot="{ navigate }"
			custom
			:to="{
				name: upperCaseFirstLowerCaseRest(info.type),
				params: { id: info.id },
			}"
		>
			<div role="link" class="top-result-main cursor-pointer" @click="navigate">
				<CoverContainer
					class="top-result-cover"
					:is-rounded="info.type !== 'artist'"
					:is-circle="info.type === 'artist'"
					:cover="info.picture"
					:link="info.link"
					@click.stop="$emit('add-to-queue', $event)"
				/>

				<div class="top-result-copy">
					<span class="top-result-kind">{{
						t(`globals.listTabs.${info.type}`, 1)
					}}</span>
					<p>{{ info.title }}</p>
					<span class="secondary-text">{{ fansNumber }}</span>
				</div>
			</div>
		</router-link>
	</div>
</template>

<style scoped>
.top-result {
	display: flex;
	min-height: 184px;
	align-items: center;
	padding: 1.15rem;
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	background: var(--secondary-background);
}

.top-result-main {
	display: flex;
	align-items: center;
	gap: 1.4rem;
}

.top-result-cover {
	width: 150px;
	flex: 0 0 150px;
}

.top-result-copy {
	min-width: 0;
}

.top-result-kind {
	color: var(--primary-color);
	font-size: 0.72rem;
	font-weight: 750;
	letter-spacing: 0.08em;
	text-transform: uppercase;
}

.top-result-copy p {
	margin: 0.35rem 0 0.55rem;
	font-size: clamp(1.6rem, 4vw, 2.65rem);
	font-weight: 760;
	letter-spacing: -0.04em;
	line-height: 1.05;
}

@media (max-width: 560px) {
	.top-result {
		min-height: auto;
	}

	.top-result-cover {
		width: 104px;
		flex-basis: 104px;
	}

	.top-result-main {
		gap: 1rem;
	}
}
</style>
