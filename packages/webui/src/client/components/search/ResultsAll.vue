<script setup lang="ts">
import TopResult from "@/components/search/TopResult.vue";
import ResultsTracks from "@/components/search/ResultsTracks.vue";
import ResultsAlbums from "@/components/search/ResultsAlbums.vue";
import ResultsArtists from "@/components/search/ResultsArtists.vue";
import ResultsPlaylists from "@/components/search/ResultsPlaylists.vue";
import ResultsError from "@/components/search/ResultsError.vue";

import {
	formatSingleTrack,
	formatAlbums,
	formatArtist,
	formatPlaylist,
} from "@/data/search";
import { standardizeData } from "@/data/standardize";
import { useI18n } from "vue-i18n";
import { computed } from "vue";

const { t } = useI18n();

interface Props {
	viewInfo: any;
}

const { viewInfo } = defineProps<Props>();

const thereAreResults = computed(() => {
	const areInfosLoaded = !!viewInfo;

	if (!areInfosLoaded) {
		return false;
	}

	const noResultsPresent = viewInfo.ORDER.every((section) =>
		section === "TOP_RESULT"
			? viewInfo[section].length === 0
			: viewInfo[section].data.length === 0
	);

	return !noResultsPresent;
});

function checkSectionResults(section) {
	if (section === "TOP_RESULT") {
		return !!viewInfo.TOP_RESULT[0];
	} else {
		return !!viewInfo[section].data[0];
	}
}
</script>

<template>
	<section class="results-overview">
		<ResultsError v-if="viewInfo.ERROR" :error="viewInfo.ERROR"></ResultsError>
		<div v-else-if="!thereAreResults" class="empty-state">
			<h2>{{ t("search.noResults") }}</h2>
		</div>

		<template v-else>
			<section
				v-for="section in viewInfo.ORDER"
				:key="section"
				class="result-section"
			>
				<template v-if="checkSectionResults(section)">
					<div class="result-section-heading">
						<h2
							class="capitalize"
							:class="{
								'result-heading-static': section === 'TOP_RESULT',
								'result-heading-link': section !== 'TOP_RESULT',
							}"
							@click="$emit('change-search-tab', section)"
						>
							{{ t(`globals.listTabs.${section.toLowerCase()}`, 2) }}
						</h2>
						<i v-if="section !== 'TOP_RESULT'" class="material-icons"
							>arrow_forward</i
						>
					</div>

					<TopResult
						v-if="section === 'TOP_RESULT'"
						:info="viewInfo.TOP_RESULT[0]"
						@add-to-queue="$emit('add-to-queue', $event)"
					/>

					<ResultsTracks
						v-else-if="section === 'TRACK'"
						:view-info="standardizeData(viewInfo.TRACK, formatSingleTrack)"
						@add-to-queue="$emit('add-to-queue', $event)"
					/>

					<ResultsAlbums
						v-else-if="section === 'ALBUM'"
						:view-info="standardizeData(viewInfo.ALBUM, formatAlbums)"
						@add-to-queue="$emit('add-to-queue', $event)"
					/>

					<ResultsPlaylists
						v-else-if="section === 'PLAYLIST'"
						:view-info="standardizeData(viewInfo.PLAYLIST, formatPlaylist)"
						@add-to-queue="$emit('add-to-queue', $event)"
					/>

					<ResultsArtists
						v-else-if="section === 'ARTIST'"
						:view-info="standardizeData(viewInfo.ARTIST, formatArtist)"
						@add-to-queue="$emit('add-to-queue', $event)"
					/>
				</template>
			</section>
		</template>
	</section>
</template>

<style scoped>
.results-overview {
	display: flex;
	min-width: 0;
	flex-direction: column;
	gap: 2.5rem;
}

.result-section {
	min-width: 0;
}

.result-section + .result-section {
	padding-top: 2.25rem;
	border-top: 1px solid var(--border-subtle);
}

.result-section-heading {
	display: inline-flex;
	align-items: center;
	gap: 0.4rem;
	margin-bottom: 1.2rem;
}

.result-section-heading h2 {
	margin: 0;
	font-size: 1.35rem;
	font-weight: 720;
	letter-spacing: -0.02em;
}

.result-heading-link,
.result-section-heading:has(.result-heading-link) {
	cursor: pointer;
}

.result-section-heading:has(.result-heading-link):hover {
	color: var(--primary-color);
}

.result-section-heading i {
	font-size: 1.1rem;
}

.result-section :deep(.release-grid) {
	display: grid;
	grid-auto-columns: clamp(144px, 18vw, 178px);
	grid-auto-flow: column;
	grid-template-columns: none;
	gap: 1.15rem;
	overflow-x: auto;
	padding: 2px 2px 14px;
	scroll-snap-type: x proximity;
	-webkit-overflow-scrolling: touch;
}

.result-section :deep(.release) {
	scroll-snap-align: start;
}
</style>
