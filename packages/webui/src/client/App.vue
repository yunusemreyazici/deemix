<script setup lang="ts">
import AuthLogin from "@/components/AuthLogin.vue";
import TheDownloadBar from "@/components/downloads/TheDownloadBar.vue";
import BaseLoadingPlaceholder from "@/components/globals/BaseLoadingPlaceholder.vue";
import DeezerWarning from "@/components/globals/DeezerWarning.vue";
import TheContextMenu from "@/components/globals/TheContextMenu.vue";
import TheQualityModal from "@/components/globals/TheQualityModal.vue";
import TheTrackPreview from "@/components/globals/TheTrackPreview.vue";
import TheContent from "@/components/TheContent.vue";
import TheSearchBar from "@/components/TheSearchBar.vue";
import TheSidebar from "@/components/TheSidebar.vue";
import { pinia } from "@/stores";
import { useAppInfoStore } from "@/stores/appInfo";
import { useAuthStore } from "@/stores/auth";
import { socket } from "@/utils/socket";
import { onMounted, ref } from "vue";

const appInfoStore = useAppInfoStore(pinia);
const authStore = useAuthStore(pinia);

const isSocketConnected = ref(false);
const loadingText = ref("Connecting to local server...");
const isMobileUtilityMenuOpen = ref(false);

function toggleMobileDownloads() {
	appInfoStore.toggleMobileDownloads();
}

function toggleMobileUtilityMenu() {
	isMobileUtilityMenuOpen.value = !isMobileUtilityMenuOpen.value;
}

onMounted(() => {
	isSocketConnected.value = socket.readyState === WebSocket.OPEN;

	socket.addEventListener("open", () => {
		isSocketConnected.value = true;
	});

	socket.addEventListener("error", (event) => {
		console.error(event);
		loadingText.value = "Couldn't connect to local server.";
	});
});
</script>

<template>
	<div id="app">
		<AuthLogin
			v-if="authStore.ready && authStore.enabled && !authStore.authenticated"
		/>

		<BaseLoadingPlaceholder
			v-else-if="!authStore.ready"
			text="Checking authentication..."
			additional-classes="absolute top-0 left-0 w-screen h-screen bg-background-main z-50"
		/>

		<div v-else class="app-container">
			<TheSidebar />

			<div class="content-container">
				<header class="mobile-topbar">
					<router-link :to="{ name: 'Home' }" class="mobile-brand">
						<img src="@/assets/deemix-icon.svg?url" alt="" />
						<span>dee<span>mix</span></span>
					</router-link>

					<div class="mobile-topbar-actions">
						<button
							type="button"
							class="mobile-downloads-button"
							aria-label="Open downloads"
							@click="toggleMobileDownloads"
						>
							<i class="material-icons">download</i>
							<span>Downloads</span>
						</button>
						<button
							type="button"
							class="mobile-overflow-button"
							aria-label="Open account menu"
							:aria-expanded="isMobileUtilityMenuOpen"
							@click="toggleMobileUtilityMenu"
						>
							<i class="material-icons">more_vert</i>
						</button>
					</div>

					<div v-if="isMobileUtilityMenuOpen" class="mobile-utility-menu">
						<router-link
							:to="{ name: 'About' }"
							@click="isMobileUtilityMenuOpen = false"
						>
							<i class="material-icons">info</i>
							<span>About</span>
						</router-link>
						<button
							v-if="authStore.enabled"
							type="button"
							@click="authStore.logout"
						>
							<i class="material-icons">logout</i>
							<span>Sign out</span>
						</button>
					</div>
				</header>

				<div class="search-shell">
					<TheSearchBar />
				</div>
				<DeezerWarning />
				<TheContent />
			</div>

			<TheDownloadBar />
		</div>

		<BaseLoadingPlaceholder
			v-if="authStore.authenticated"
			:text="loadingText"
			:hidden="isSocketConnected"
			additional-classes="absolute top-0 left-0 w-screen h-screen bg-black bg-opacity-50 z-50"
		/>

		<TheTrackPreview />
		<TheQualityModal />

		<TheContextMenu />
	</div>
</template>

<style>
.app-container {
	display: flex;
	width: 100%;
	min-height: 100vh;
	min-height: 100dvh;
	background: var(--main-background);
}

.content-container {
	min-width: 0;
	width: 100%;
	display: flex;
	flex-direction: column;
	overflow-x: clip;
}

.search-shell {
	display: flex;
	align-items: center;
	padding: 20px clamp(20px, 3vw, 48px) 0;
}

.search-shell #search {
	flex: 1;
	margin: 0;
}

.mobile-topbar {
	display: none;
}

.mobile-brand {
	display: inline-flex;
	align-items: center;
	gap: 10px;
	color: var(--foreground);
	font-size: 1.35rem;
	font-weight: 800;
	letter-spacing: -0.045em;
	text-decoration: none;
}

.mobile-brand img {
	width: 38px;
	height: 38px;
}

.mobile-brand > span > span {
	color: var(--primary-color);
}

.mobile-topbar-actions,
.mobile-downloads-button,
.mobile-overflow-button {
	display: flex;
	align-items: center;
}

.mobile-topbar-actions {
	gap: 4px;
}

.mobile-downloads-button,
.mobile-overflow-button {
	min-height: 44px;
	border: 0;
	background: transparent;
	color: var(--foreground);
	cursor: pointer;
}

.mobile-downloads-button {
	gap: 7px;
	padding: 0 8px;
	font-size: 0.875rem;
	font-weight: 650;
}

.mobile-overflow-button {
	width: 40px;
	justify-content: center;
	padding: 0;
}

.mobile-utility-menu {
	position: absolute;
	top: 64px;
	right: 16px;
	z-index: 60;
	width: 170px;
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-md);
	background: var(--secondary-background);
	box-shadow: var(--panel-shadow);
	padding: 6px;
}

.mobile-utility-menu a,
.mobile-utility-menu button {
	display: flex;
	align-items: center;
	gap: 10px;
	width: 100%;
	min-height: 44px;
	border: 0;
	border-radius: var(--radius-sm);
	background: transparent;
	padding: 0 10px;
	color: var(--foreground);
	text-decoration: none;
}

.mobile-utility-menu a:hover,
.mobile-utility-menu button:hover {
	background: var(--surface-hover);
}

@media (max-width: 767px) {
	.mobile-topbar {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: space-between;
		min-height: 68px;
		padding: 10px 16px 6px;
	}

	.content-container {
		height: 100vh;
		height: 100dvh;
		min-height: 0;
		padding-bottom: 0;
	}

	.search-shell {
		padding: 8px 16px 12px;
	}
}

@media (max-width: 339px) {
	.mobile-downloads-button span {
		display: none;
	}
}
</style>
