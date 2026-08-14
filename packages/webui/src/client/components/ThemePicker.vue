<script setup lang="ts">
import { pinia } from "@/stores";
import { useAppInfoStore } from "@/stores/appInfo";
import { useTheme } from "@/use/theme";
import { computed } from "vue";

const { THEMES, currentTheme } = useTheme();
const appInfoStore = useAppInfoStore(pinia);

const hasSlimSidebar = computed(() => appInfoStore.hasSlimSidebar);
</script>

<template>
	<div
		class="theme-picker"
		:class="{ 'theme-picker--slim': hasSlimSidebar }"
		aria-label="theme selector"
	>
		<button
			v-for="theme of THEMES"
			:key="theme"
			type="button"
			class="theme-swatch"
			:class="{
				active: currentTheme === theme,
				'theme-swatch--light': theme === 'light',
				'theme-swatch--dark': theme === 'dark',
				'theme-swatch--purple': theme === 'purple',
			}"
			:aria-label="`Use ${theme} theme`"
			:aria-pressed="currentTheme === theme"
			@click="currentTheme = theme"
		></button>
	</div>
</template>

<style scoped>
.theme-picker {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 10px;
	margin: 0 24px;
	border-top: 1px solid var(--border-subtle);
	padding: 24px 0;
}

.theme-picker--slim {
	flex-direction: column;
	margin-inline: 18px;
}

.theme-swatch {
	width: 22px;
	height: 22px;
	border: 2px solid transparent;
	border-radius: 999px;
	padding: 0;
	box-shadow: 0 0 0 1px var(--border-strong);
	cursor: pointer;
	transition:
		transform 160ms ease,
		box-shadow 160ms ease;
}

.theme-swatch:hover {
	transform: scale(1.1);
}

.theme-swatch.active {
	box-shadow:
		0 0 0 2px var(--panels-background),
		0 0 0 4px var(--primary-color);
}

.theme-swatch--light {
	background: white;
}

.theme-swatch--dark {
	background: #11151c;
}

.theme-swatch--purple {
	background: #5d35d5;
}
</style>
