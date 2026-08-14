<script setup lang="ts">
import CoverContainer from "@/components/globals/CoverContainer.vue";
import { getHomeData } from "@/data/home";
import { pinia } from "@/stores";
import { useLoginStore } from "@/stores/login";
import { sendAddToQueue } from "@/utils/downloads";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

const loginStore = useLoginStore(pinia);

const { t } = useI18n();

const playlists = ref([]);
const albums = ref([]);

const isLoggedIn = computed(() => loginStore.isLoggedIn);

function addToQueue(e) {
	sendAddToQueue(e.currentTarget.dataset.link);
}
function initHome(data) {
	const {
		playlists: { data: playlistData },
		albums: { data: albumData },
	} = data;

	playlists.value = playlistData;
	albums.value = albumData;
}

onMounted(async () => {
	const homeData = await getHomeData();

	initHome(homeData);
});
</script>

<template>
	<div id="home_tab">
		<header class="home-heading">
			<h1>{{ t("globals.welcome") }}</h1>
		</header>

		<section v-if="!isLoggedIn" ref="notLogged" class="home-intro">
			<p id="home_not_logged_text">{{ t("home.needTologin") }}</p>
			<router-link
				v-slot="{ navigate }"
				custom
				name="button"
				:to="{ name: 'Settings' }"
			>
				<button
					role="link"
					class="btn btn-primary"
					@click="navigate"
					@keypress.enter="() => navigate()"
				>
					{{ t("home.openSettings") }}
				</button>
			</router-link>
		</section>

		<section v-if="playlists.length" class="home-section">
			<h2>{{ t("home.sections.popularPlaylists") }}</h2>
			<div class="home-media-rail">
				<router-link
					v-for="release in playlists"
					:key="release.id"
					v-slot="{ navigate }"
					custom
					:to="{ name: 'Playlist', params: { id: release.id } }"
					tabindex="0"
					@keyup.enter="
						$router.push({ name: 'Playlist', params: { id: release.id } })
					"
				>
					<div
						role="link"
						class="release home-release cursor-pointer"
						@click="navigate"
						@keypress.enter="() => navigate()"
					>
						<CoverContainer
							is-rounded
							:cover="release.picture_medium"
							:link="release.link"
							@click.stop="addToQueue"
						/>
						<p class="primary-text">{{ release.title }}</p>
						<p class="secondary-text">
							{{
								`${t("globals.by", { artist: release.user.name })} - ${t(
									"globals.listTabs.trackN",
									release.nb_tracks
								)}`
							}}
						</p>
					</div>
				</router-link>
			</div>
		</section>

		<section v-if="albums.length" class="home-section">
			<h2>{{ t("home.sections.popularAlbums") }}</h2>
			<div class="home-media-rail">
				<router-link
					v-for="release in albums"
					:key="release.id"
					v-slot="{ navigate }"
					custom
					:to="{ name: 'Album', params: { id: release.id } }"
					:data-id="release.id"
					tabindex="0"
					@keyup.enter="
						$router.push({ name: 'Album', params: { id: release.id } })
					"
				>
					<div
						role="link"
						class="release home-release cursor-pointer"
						@click="navigate"
						@keypress.enter="() => navigate()"
					>
						<CoverContainer
							is-rounded
							:cover="release.cover_medium"
							:link="release.link"
							@click.stop="addToQueue"
						/>
						<p class="primary-text">{{ release.title }}</p>
						<p class="secondary-text">
							{{ `${t("globals.by", { artist: release.artist.name })}` }}
						</p>
					</div>
				</router-link>
			</div>
		</section>
	</div>
</template>

<style scoped>
#home_tab {
	width: 100%;
}

.home-heading h1 {
	margin: 0;
	font-size: clamp(2.5rem, 5vw, 4rem);
	font-weight: 760;
	letter-spacing: -0.055em;
	line-height: 1.04;
}

.home-intro,
.home-section {
	border-top: 1px solid var(--border-subtle);
}

.home-intro {
	margin-top: 26px;
	padding: 22px 0 28px;
}

.home-intro p {
	max-width: 640px;
	margin: 0 0 18px;
	color: var(--text-muted);
	font-size: 1.02rem;
	line-height: 1.65;
}

.home-section {
	padding: 28px 0 24px;
}

.home-section h2 {
	margin: 0 0 20px;
	font-size: clamp(1.45rem, 2vw, 1.9rem);
	font-weight: 720;
	letter-spacing: -0.035em;
	line-height: 1.2;
}

.home-media-rail {
	display: grid;
	grid-auto-columns: clamp(190px, 22vw, 260px);
	grid-auto-flow: column;
	gap: clamp(18px, 2.2vw, 30px);
	overflow-x: auto;
	padding: 2px 2px 16px;
	scroll-snap-type: x proximity;
	scrollbar-color: var(--main-scroll) transparent;
}

.home-release {
	min-width: 0;
	scroll-snap-align: start;
}

.home-release .primary-text {
	margin: 12px 0 3px;
	overflow: hidden;
	color: var(--foreground);
	font-size: 0.98rem;
	font-weight: 600;
	letter-spacing: -0.018em;
	line-height: 1.4;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.home-release .secondary-text {
	margin: 0;
	color: var(--text-muted);
	font-size: 0.84rem;
	line-height: 1.5;
	opacity: 1;
}

@media (max-width: 767px) {
	.home-heading h1 {
		font-size: 2rem;
		letter-spacing: -0.045em;
	}

	.home-intro {
		margin-top: 22px;
		padding-block: 20px 24px;
	}

	.home-section {
		padding-block: 24px 20px;
	}

	.home-media-rail {
		grid-auto-columns: minmax(148px, 44vw);
		gap: 16px;
		margin-right: -16px;
		padding-right: 16px;
	}

	.home-release .primary-text {
		font-size: 0.92rem;
		white-space: normal;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
	}
}
</style>
