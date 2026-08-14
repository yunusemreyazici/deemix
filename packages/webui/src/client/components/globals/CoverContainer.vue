<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { t } = useI18n();

interface Props {
	cover: string;
	isRounded?: boolean;
	isCircle?: boolean;
	link: string;
}

defineProps<Props>();
</script>

<template>
	<div class="cover-container group relative">
		<img
			aria-hidden="true"
			class="coverart block w-full opacity-100"
			:class="{ 'coverart--rounded': isRounded, 'rounded-full': isCircle }"
			:src="cover"
		/>

		<button
			role="button"
			aria-label="download"
			:data-link="link"
			class="download_overlay hover:bg-primary absolute rounded-full border-0 bg-black p-0 text-center opacity-0"
			tabindex="0"
			v-bind="$attrs"
		>
			<i
				class="material-icons cursor-pointer text-white"
				:title="t('globals.download_hint')"
				>get_app</i
			>
		</button>
	</div>
</template>

<style scoped>
.cover-container {
	position: relative;
	width: 100%;
	aspect-ratio: 1;
	overflow: hidden;
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-md);
	background: var(--secondary-background);
	box-shadow: 0 14px 36px hsla(220, 35%, 2%, 0.2);
}
.cover-container .coverart {
	backface-visibility: hidden;
	width: 100%;
	height: 100%;
	object-fit: cover;
	transition:
		opacity 180ms ease,
		transform 240ms ease;
}
.cover-container .coverart--rounded {
	border-radius: inherit;
}
.cover-container .download_overlay {
	right: 12px;
	bottom: 12px;
	transition:
		opacity 160ms ease,
		transform 160ms ease,
		background-color 160ms ease;
	opacity: 0;
	min-width: 44px;
	height: 44px;
	transform: translateY(6px);
	text-align: center;
	box-shadow: 0 10px 28px hsla(220, 45%, 2%, 0.45);
}
.cover-container .download_overlay i {
	display: grid;
	width: 44px;
	height: 44px;
	place-items: center;
	padding: 0;
}
.cover-container .download_overlay:focus {
	opacity: 1;
	transform: translateY(0);
}
.cover-container:hover .coverart {
	opacity: 0.82;
	transform: scale(1.025);
}
.cover-container:hover .download_overlay {
	opacity: 1;
	transform: translateY(0);
	border: 0;
}

@media (hover: none) {
	.cover-container .download_overlay {
		opacity: 0.92;
		transform: none;
	}
}
</style>
