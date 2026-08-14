<script setup lang="ts">
import { computed, ref } from "vue";

const possibleStates = [
	"converting",
	"downloading",
	"download finished",
	"completed",
];

interface Props {
	queueItem: {
		id: string;
		type: string;
		downloaded: number;
		failed: number;
		errors: any[];
		status: string;
		size: number;
		uuid: string;
		progress: number;
		conversion: number;
		bitrate: string;
		artist: string;
		title: string;
		cover: string;
		album: {
			id: string;
			title: string;
		};
		artists: string[];
		explicit: boolean;
	};
	showTags: boolean;
}
const { queueItem } = defineProps<Props>();
const emit = defineEmits(["retry-download", "remove-item", "show-errors"]);

const isLoading = ref(false);
const hovered = ref(false);

const hasFails = computed(() => queueItem.failed >= 1);
const hasErrors = computed(() => queueItem.errors?.length >= 1);
const allFailed = computed(() => {
	let allFailed = false;

	if (queueItem.status === "download finished") {
		allFailed = queueItem.size !== 0 && queueItem.failed === queueItem.size;
	}

	return allFailed;
});
const finishedWithFails = computed(() => {
	return (
		queueItem.status === "download finished" &&
		(hasFails.value || hasErrors.value)
	);
});
const isDeterminateStatus = computed(() =>
	possibleStates.includes(queueItem.status)
);
const isComplete = computed(() => queueItem.status === "download finished");
const progressText = computed(() => {
	if (isComplete.value) return "100%";
	if (queueItem.status === "converting") {
		return `${Math.max(0, Math.round(100 - queueItem.conversion))}%`;
	}
	return `${Math.max(0, Math.round(queueItem.progress || 0))}%`;
});
const barClass = computed(() => ({
	converting: queueItem.status === "converting",
	indeterminate: !isDeterminateStatus.value,
	determinate: isDeterminateStatus.value,
}));
const barStyle = computed(() => {
	let width = 0;
	let backgroundColor = "var(--primary-color)";

	if (hasFails.value || hasErrors.value) {
		// Orange
		backgroundColor = "hsl(33, 100%, 47%)";
	}

	if (allFailed.value) {
		// Red
		backgroundColor = "hsl(360, 100%, 35%)";
	}

	if (queueItem.status === "download finished") {
		width = 100;
	}

	if (queueItem.status === "downloading") {
		width = queueItem.progress;
	}

	if (queueItem.status === "converting") {
		width = 100 - queueItem.conversion;
		backgroundColor = "hsl(46, 100%, 50%)";
	}

	return {
		width: `${width}%`,
		backgroundColor,
	};
});

const resultIconText = computed(() => {
	let text = "delete_forever";

	if (queueItem.status === "download finished") {
		if (!(hasFails.value || hasErrors.value)) {
			text = "done";
		} else if (queueItem.failed >= queueItem.size) {
			text = "error";
		} else {
			text = "warning";
		}
	}

	return text;
});
const canInteract = computed(
	() => finishedWithFails.value || resultIconText.value === "delete_forever"
);

const generateLink = computed(() => {
	switch (queueItem.type) {
		case "track":
			return `https://deezer.com/track/${queueItem.id}`;
		case "album":
			return `https://deezer.com/album/${queueItem.id}`;
		case "playlist":
			if (queueItem.id.endsWith("_top_track"))
				return `https://www.deezer.com/artist/${queueItem.id.slice(
					0,
					-10
				)}/top_track`;
			return `https://deezer.com/playlist/${queueItem.id}`;
		case "spotify_playlist":
			return `https://open.spotify.com/playlist/${queueItem.id}`;
		default:
			return "";
	}
});

const bitrateText = computed(() => {
	switch (parseInt(queueItem.bitrate)) {
		case 9:
			return "FLAC";
		case 3:
			return "320";
		case 1:
			return "128";
		case 15:
			return "360HQ";
		case 14:
			return "360MQ";
		case 13:
			return "360LQ";
		default:
			return "MISC";
	}
});

function onResultIconClick() {
	if (isDeterminateStatus.value) {
		if (finishedWithFails.value) {
			emit("retry-download", queueItem.uuid);
		}

		if (queueItem.status === "downloading") {
			isLoading.value = true;
			emit("remove-item", queueItem.uuid);
		}
	} else {
		isLoading.value = true;
		emit("remove-item", queueItem.uuid);
	}
}
</script>

<template>
	<article
		class="download-object"
		:class="{ 'is-complete': isComplete, 'has-errors': hasFails || hasErrors }"
		:data-link-only="generateLink"
	>
		<div class="download-info">
			<div class="download-cover">
				<img :src="queueItem.cover" :alt="`Cover ${queueItem.title}`" />
				<span v-if="showTags" class="tag">{{ bitrateText }}</span>
			</div>

			<div class="download-info-data">
				<div class="download-title-row">
					<i v-if="queueItem.explicit" class="material-icons explicit-icon"
						>explicit</i
					>
					<strong>{{ queueItem.title }}</strong>
				</div>
				<span class="download-artist">{{ queueItem.artist }}</span>
				<div class="download-meta">
					<span
						>{{ queueItem.downloaded + queueItem.failed }}/{{
							queueItem.size
						}}</span
					>
					<button
						v-if="hasFails"
						type="button"
						class="download-error-button"
						@click="emit('show-errors', queueItem)"
					>
						<i class="material-icons">error_outline</i>{{ queueItem.failed }}
					</button>
				</div>
			</div>
		</div>

		<div class="download-bar">
			<div class="progress">
				<div :class="barClass" :style="barStyle"></div>
			</div>
			<span class="progress-label">{{ progressText }}</span>
			<button
				v-if="!isLoading"
				type="button"
				class="queue-action"
				:class="{ interactive: canInteract }"
				:disabled="!canInteract"
				@mouseover="hovered = true"
				@mouseleave="hovered = false"
				@click="onResultIconClick"
			>
				<i class="material-icons">{{
					hovered && finishedWithFails ? "refresh" : resultIconText
				}}</i>
			</button>
			<div v-else class="circle-loader"></div>
		</div>
	</article>
</template>

<style>
.download-object {
	padding: 12px 0 14px;
	border-bottom: 1px solid var(--border-subtle);
}

.download-info {
	display: flex;
	align-items: center;
	gap: 11px;
}

.download-cover {
	position: relative;
	width: 64px;
	height: 64px;
	flex: 0 0 64px;
	border: 1px solid var(--border-subtle);
	border-radius: 9px;
	overflow: hidden;
	background: var(--secondary-background);
}

.download-cover img {
	display: block;
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.download-cover .tag {
	position: absolute;
	right: 4px;
	bottom: 4px;
	padding: 2px 5px;
	border-radius: 4px;
	color: white;
	font-size: 0.58rem;
	font-weight: 750;
}

.download-info-data {
	min-width: 0;
	flex: 1;
}

.download-title-row {
	display: flex;
	min-width: 0;
	align-items: center;
	gap: 0.3rem;
}

.download-title-row strong {
	overflow: hidden;
	font-size: 0.88rem;
	font-weight: 680;
	line-height: 1.3;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.explicit-icon {
	flex: 0 0 auto;
	font-size: 1rem !important;
	color: var(--text-muted);
}

.download-artist {
	display: block;
	margin-top: 0.16rem;
	overflow: hidden;
	color: var(--text-muted);
	font-size: 0.76rem;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.download-meta {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin-top: 0.34rem;
	color: var(--text-muted);
	font-size: 0.69rem;
}

.download-error-button {
	display: flex;
	align-items: center;
	gap: 0.18rem;
	padding: 0;
	border: 0;
	background: transparent;
	color: hsl(33, 100%, 58%);
	cursor: pointer;
}

.download-error-button i {
	font-size: 0.9rem;
}

.download-object > .download-bar {
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto 32px;
	align-items: center;
	gap: 0.55rem;
	margin-top: 0.72rem;
}

.progress-label {
	min-width: 32px;
	color: var(--text-muted);
	font-size: 0.67rem;
	font-variant-numeric: tabular-nums;
	text-align: right;
}

.queue-action {
	display: grid;
	width: 32px;
	height: 32px;
	place-items: center;
	padding: 0;
	border: 0;
	border-radius: 7px;
	background: transparent;
	color: var(--text-muted);
}

.queue-action.interactive {
	cursor: pointer;
}

.queue-action.interactive:hover {
	background: var(--surface-hover);
	color: var(--foreground);
}

.queue-action i {
	font-size: 1.15rem;
}

#download_list.slim .download-cover {
	display: none;
}

#download_list.slim .download-object {
	padding: 10px 0;
}

.progress {
	position: relative;
	height: 3px;
	display: block;
	width: 100%;
	background-color: var(--border-subtle);
	border-radius: 999px;
	margin: 0;
	overflow: hidden;
}

@media (max-width: 767px) {
	.download-object {
		padding: 11px 0 13px;
	}

	.download-cover {
		width: 58px;
		height: 58px;
		flex-basis: 58px;
	}
}
.progress .determinate {
	position: absolute;
	top: 0;
	left: 0;
	bottom: 0;
	background-color: var(--primary-color);
	transition: width 0.3s linear;
}
.progress .converting {
	background-color: var(--secondary-color);
	transition: none !important;
}
.progress .indeterminate {
	background-color: var(--primary-color);
}
.progress .indeterminate::before {
	content: "";
	position: absolute;
	background-color: inherit;
	top: 0;
	left: 0;
	bottom: 0;
	will-change: left, right;
	animation: indeterminate 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite;
}
.progress .indeterminate::after {
	content: "";
	position: absolute;
	background-color: inherit;
	top: 0;
	left: 0;
	bottom: 0;
	will-change: left, right;
	animation: indeterminate-short 2.1s cubic-bezier(0.165, 0.84, 0.44, 1)
		infinite;
	animation-delay: 1.15s;
}

@keyframes indeterminate {
	0% {
		left: -35%;
		right: 100%;
	}
	60% {
		left: 100%;
		right: -90%;
	}
	100% {
		left: 100%;
		right: -90%;
	}
}

@keyframes indeterminate-short {
	0% {
		left: -200%;
		right: 100%;
	}
	60% {
		left: 107%;
		right: -8%;
	}
	100% {
		left: 107%;
		right: -8%;
	}
}
</style>
