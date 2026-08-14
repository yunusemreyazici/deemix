<script setup lang="ts">
import ThemePicker from "@/components/ThemePicker.vue";

import { mainNavItems } from "@/data/sidebar";
import { pinia } from "@/stores";
import { useAppInfoStore } from "@/stores/appInfo";
import { useAuthStore } from "@/stores/auth";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";

const { t } = useI18n();
const route = useRoute();
const appInfoStore = useAppInfoStore(pinia);
const authStore = useAuthStore(pinia);

const updateAvailable = computed(() => appInfoStore.updateAvailable);
const hasSlimSidebar = computed(() => appInfoStore.hasSlimSidebar);
const mobileNavItems = computed(() =>
	mainNavItems.filter((item) => item.name !== "about")
);
</script>

<template>
	<aside
		class="desktop-sidebar"
		:class="{
			'slim-sidebar': hasSlimSidebar,
		}"
		aria-label="sidebar"
		role="navigation"
	>
		<router-link
			:to="{ name: 'Home' }"
			class="sidebar-brand"
			:class="{ 'sidebar-brand--slim': hasSlimSidebar }"
		>
			<img src="@/assets/deemix-icon.svg?url" alt="" />
			<span v-if="!hasSlimSidebar">dee<span>mix</span></span>
		</router-link>

		<nav class="sidebar-nav">
			<router-link
				v-for="link in mainNavItems"
				:key="link.name"
				:aria-label="link.name"
				class="sidebar-nav-link"
				:class="{
					active: route.name === link.routerName,
					'sidebar-nav-link--slim': hasSlimSidebar,
				}"
				:to="{ name: link.routerName }"
			>
				<i class="material-icons side_icon">
					{{ link.icon }}
				</i>
				<span v-if="!hasSlimSidebar" class="sidebar-nav-label">
					{{ t(link.label) }}
				</span>
				<span
					v-if="link.name === 'about' && updateAvailable"
					class="absolute left-10 top-3 h-3 w-3 rounded-full bg-red-600"
				></span>
			</router-link>
		</nav>

		<ThemePicker />

		<button
			v-if="authStore.enabled"
			type="button"
			class="sidebar-signout"
			:class="{ 'sidebar-signout--slim': hasSlimSidebar }"
			aria-label="Sign out"
			@click="authStore.logout"
		>
			<i class="material-icons">logout</i>
			<span v-if="!hasSlimSidebar">Sign out</span>
		</button>
	</aside>

	<nav class="mobile-bottom-nav" aria-label="Primary navigation">
		<router-link
			v-for="link in mobileNavItems"
			:key="link.name"
			:to="{ name: link.routerName }"
			:aria-label="t(link.label)"
			:class="{ active: route.name === link.routerName }"
		>
			<i class="material-icons">{{ link.icon }}</i>
			<span>{{ t(link.label) }}</span>
		</router-link>
	</nav>
</template>

<style scoped>
.desktop-sidebar {
	position: relative;
	z-index: 20;
	display: flex;
	flex: 0 0 284px;
	width: 284px;
	height: 100vh;
	height: 100dvh;
	flex-direction: column;
	border-right: 1px solid var(--border-subtle);
	background: var(--panels-background);
	color: var(--foreground);
	transition:
		width 220ms ease,
		flex-basis 220ms ease;
}

.desktop-sidebar.slim-sidebar {
	flex-basis: 84px;
	width: 84px;
}

.sidebar-brand {
	display: flex;
	align-items: center;
	gap: 13px;
	min-height: 102px;
	padding: 20px 24px;
	color: var(--foreground);
	font-size: 1.75rem;
	font-weight: 800;
	letter-spacing: -0.055em;
	text-decoration: none;
}

.sidebar-brand img {
	width: 48px;
	height: 48px;
	flex: 0 0 auto;
}

.sidebar-brand > span > span {
	color: var(--primary-color);
}

.sidebar-brand--slim {
	justify-content: center;
	padding-inline: 0;
}

.sidebar-nav {
	display: flex;
	flex: 1;
	flex-direction: column;
	gap: 6px;
	padding: 8px 16px;
}

.sidebar-nav-link,
.sidebar-signout {
	display: flex;
	align-items: center;
	gap: 14px;
	min-height: 52px;
	border: 1px solid transparent;
	border-radius: var(--radius-md);
	background: transparent;
	padding: 0 16px;
	color: var(--text-muted);
	font-size: 0.95rem;
	font-weight: 560;
	text-decoration: none;
	cursor: pointer;
	transition:
		color 160ms ease,
		background-color 160ms ease,
		border-color 160ms ease;
}

.sidebar-nav-link:hover,
.sidebar-signout:hover {
	background: var(--surface-hover);
	color: var(--foreground);
}

.sidebar-nav-link.active {
	border-color: color-mix(in srgb, var(--primary-color) 24%, transparent);
	background: color-mix(in srgb, var(--primary-color) 14%, transparent);
	color: var(--foreground);
}

.sidebar-nav-link.active .material-icons {
	color: var(--primary-color);
}

.sidebar-nav-link .material-icons,
.sidebar-signout .material-icons {
	width: 24px;
	font-size: 24px;
	text-align: center;
}

.sidebar-nav-link--slim,
.sidebar-signout--slim {
	justify-content: center;
	padding-inline: 0;
}

.sidebar-signout {
	margin: 8px 16px 18px;
	width: calc(100% - 32px);
}

.mobile-bottom-nav {
	display: none;
}

@media (max-width: 767px) {
	.desktop-sidebar {
		display: none;
	}

	.mobile-bottom-nav {
		position: fixed;
		z-index: 45;
		bottom: 0;
		left: 0;
		right: 0;
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		border-top: 1px solid var(--border-subtle);
		background: color-mix(in srgb, var(--panels-background) 94%, transparent);
		box-shadow: 0 -12px 36px hsla(220, 35%, 2%, 0.28);
		padding: 7px 4px calc(7px + env(safe-area-inset-bottom, 0px));
		backdrop-filter: blur(18px);
	}

	.mobile-bottom-nav a {
		display: flex;
		min-width: 0;
		min-height: 56px;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2px;
		border-radius: var(--radius-sm);
		color: var(--text-muted);
		font-size: 0.68rem;
		font-weight: 600;
		text-decoration: none;
	}

	.mobile-bottom-nav a.active {
		color: var(--primary-color);
	}

	.mobile-bottom-nav .material-icons {
		font-size: 24px;
	}
}
</style>
