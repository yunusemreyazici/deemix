<script setup lang="ts">
import QueueItem from "@/components/downloads/QueueItem.vue";
import { pinia } from "@/stores";
import { useAppInfoStore } from "@/stores/appInfo";
import { useErrorStore } from "@/stores/errors";
import { useLoginStore } from "@/stores/login";
import { fetchData, postToServer } from "@/utils/api-utils";
import { socket } from "@/utils/socket";
import { toast } from "@/utils/toasts";
import { computed, onMounted, onUnmounted, ref, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

const { t } = useI18n();
const router = useRouter();

const tabMinWidth = 280;
const tabMaxWidth = 500;

const loginStore = useLoginStore(pinia);
const appInfoStore = useAppInfoStore(pinia);
const errorStore = useErrorStore(pinia);

const container = useTemplateRef("container");
const toggler = ref<HTMLElement | null>(null);
const list = ref<HTMLElement | null>(null);

const storedTabWidth = parseInt(localStorage.getItem("downloadTabWidth"));
const cachedTabWidth = ref(
	Math.min(
		Math.max(
			Number.isFinite(storedTabWidth) ? storedTabWidth : 330,
			tabMinWidth
		),
		tabMaxWidth
	)
);
const queue = ref([]);
const queueList = ref<any>({});
const queueComplete = ref([]);
const isExpanded = ref(localStorage.getItem("downloadTabOpen") === "true");

const clientMode = computed(() => loginStore.clientMode);
const isSlim = computed(() => appInfoStore.hasSlimDownloads);
const showTags = computed(() => appInfoStore.showBitrateTags);
const isMobileDownloadsOpen = computed(
	() => appInfoStore.isMobileDownloadsOpen
);

const queueCount = computed(
	() => queue.value.length + queueComplete.value.length
);

function toggleMobileDownloads() {
	appInfoStore.toggleMobileDownloads();
}

const finishedWithoutErrors = computed(() => {
	const isCompletedWithoutErrors = (el) =>
		(el.status || "") === "download finished" && el.errors.length === 0;

	return Object.values(queueList.value).filter(isCompletedWithoutErrors);
});

function checkIfToggleBar(keyEvent) {
	if (!(keyEvent.ctrlKey && keyEvent.key === "b")) return;

	toggleDownloadTab();
}

const setErrors = (errors) => errorStore.setErrors(errors);

function onRemoveItem(uuid: string) {
	socket.emit("removeFromQueue", uuid);
}

function onRetryDownload(uuid: string) {
	postToServer("retryDownload", { uuid });
}

function setTabWidth(newWidth?: number) {
	if (newWidth === undefined) {
		container.value.style.width = "";
		list.value.style.width = "";
	} else {
		container.value.style.width = newWidth + "px";
		list.value.style.width = "";
	}
}

function initQueue(data) {
	const {
		queueOrder: initQueue,
		//		queueComplete: initQueueComplete,
		current: currentItem,
		queue: initQueueList,
		restored,
	} = data;

	const initQueueComplete = Object.values(initQueueList)
		.filter((el: any) =>
			["completed", "withErrors", "failed"].includes(el.status)
		)
		.map((el: any) => el.uuid);

	if (initQueueComplete && initQueueComplete.length) {
		initQueueComplete.forEach((item) => {
			initQueueList[item].silent = true;
			addToQueue(initQueueList[item]);
		});
	}

	if (currentItem) {
		currentItem.silent = true;
		addToQueue(currentItem, true);
	}

	initQueue.forEach((item) => {
		if (!initQueueList[item]) return;
		initQueueList[item].silent = true;
		addToQueue(initQueueList[item]);
	});

	if (restored) {
		toast(t("toasts.queueRestored"), "done", true, "restoring_queue");
		socket.emit("queueRestored");
	}
}

function addToQueue(queueItem, current = false) {
	if (Array.isArray(queueItem)) {
		if (queueItem.length > 1) {
			queueItem.forEach((item) => {
				item.silent = true;
				addToQueue(item);
			});
			toast(
				t("toasts.addedMoreToQueue", { n: queueItem.length }),
				"playlist_add_check"
			);
			return;
		} else {
			queueItem = queueItem[0];
		}
	}

	// Add implicit values back
	queueItem.downloaded = queueItem.downloaded || 0;
	queueItem.failed = queueItem.failed || 0;
	queueItem.progress = queueItem.progress || 0;
	queueItem.conversion = queueItem.conversion || 0;
	queueItem.errors = queueItem.errors || [];

	// * Here we have only queueItem objects
	queueItem.current = current;
	queueList.value[queueItem.uuid] = queueItem;

	// * Used when opening the app in another tab
	const itemIsAlreadyDownloaded =
		queueItem.downloaded + queueItem.failed == queueItem.size;

	if (itemIsAlreadyDownloaded) {
		const itemIsNotInCompletedQueue = !queueComplete.value.includes(
			queueItem.uuid
		);

		queueList.value[queueItem.uuid].status = "download finished";

		if (itemIsNotInCompletedQueue) {
			// * Add it
			queueComplete.value.push(queueItem.uuid);
		}
	} else {
		const itemIsNotInQueue = !queue.value.includes(queueItem.uuid);

		if (itemIsNotInQueue) {
			queue.value.push(queueItem.uuid);
		}
	}

	const needToStartDownload =
		!itemIsAlreadyDownloaded &&
		((queueItem.progress > 0 && queueItem.progress < 100) || current);

	if (needToStartDownload) {
		startDownload(queueItem.uuid);
	}

	if (!queueItem.silent) {
		toast(
			t("toasts.addedToQueue", { item: queueItem.title }),
			"playlist_add_check"
		);
	}
}

function updateQueue(update) {
	// downloaded and failed default to false?
	const {
		uuid,
		downloaded,
		alreadyDownloaded,
		failed,
		progress,
		conversion,
		error,
		data,
		errid,
		stack,
		postFailed,
	} = update;

	if (uuid && queue.value.includes(uuid)) {
		if (downloaded || alreadyDownloaded) {
			queueList.value[uuid].downloaded++;
		}

		if (failed) {
			queueList.value[uuid].failed++;
			queueList.value[uuid].errors.push({
				message: error,
				data,
				errid,
				stack,
			});
		}

		if (progress) {
			queueList.value[uuid].progress = progress;
		}

		if (conversion) {
			queueList.value[uuid].conversion = conversion;
		}

		if (postFailed) {
			queueList.value[uuid].errors.push({ message: error, data, stack });
		}
	}
}

function removeFromQueue({ uuid }: { uuid: string }) {
	const index = queue.value.indexOf(uuid);

	if (index > -1) {
		delete queue.value[index];
		delete queueList.value[uuid];
	}
}

function removeAllDownloads(currentItem) {
	queueComplete.value = [];

	if (!currentItem) {
		queue.value = [];
		queueList.value = {};
	} else {
		queue.value = [currentItem];

		const tempQueueItem = queueList.value[currentItem];

		queueList.value = {};
		queueList.value[currentItem] = tempQueueItem;
	}
}

function removedFinishedDownloads() {
	// TODO: Make this a computed property
	queueComplete.value = finishedWithoutErrors.value.map((el: any) => el.uuid);

	queueComplete.value.forEach((uuid) => {
		delete queueList.value[uuid];
	});

	queueComplete.value = [];
}

function toggleDownloadTab() {
	setTabWidth();

	container.value.style.transition = "all 250ms ease-in-out";

	// Toggle returns a Boolean based on the action it performed
	isExpanded.value = !isExpanded.value;

	if (isExpanded.value) {
		setTabWidth(cachedTabWidth.value);
	}

	localStorage.setItem("downloadTabOpen", isExpanded.value.toString());
}

function cleanQueue() {
	socket.emit("removeFinishedDownloads");
}

function cancelQueue() {
	socket.emit("cancelAllDownloads");
}

function openDownloadsFolder() {
	window.api.send("openDownloadsFolder");
}

function handleDrag(event) {
	let newWidth = window.innerWidth - event.pageX + 2;

	if (newWidth < tabMinWidth) {
		newWidth = tabMinWidth;
	} else if (newWidth > tabMaxWidth) {
		newWidth = tabMaxWidth;
	}

	cachedTabWidth.value = newWidth;
	setTabWidth(newWidth);
}

function startDrag() {
	document.addEventListener("mousemove", handleDrag);
}

function startDownload(uuid) {
	queueList.value[uuid].status = "downloading";
}

function finishDownload({ uuid }: { uuid: string }) {
	const isInQueue =
		queue.value.includes(uuid) || queueComplete.value.includes(uuid);

	if (!isInQueue) return;

	queueList.value[uuid].status = "download finished";
	toast(
		t("toasts.finishDownload", { item: queueList.value[uuid].title }),
		"done"
	);

	const index = queue.value.indexOf(uuid);

	if (index > -1) {
		queue.value.splice(index, 1);
		queueComplete.value.push(uuid);
	}

	if (queue.value.length <= 0) {
		toast(t("toasts.allDownloaded"), "done_all");
	}
}
function startConversion({ uuid }: { uuid: string; title: string }) {
	queueList.value[uuid].status = "converting";
	queueList.value[uuid].conversion = 0;
}
function finishConversion(downloadObject) {
	queueList.value[downloadObject.uuid].size = downloadObject.size;
}
async function showErrorsTab(item) {
	setErrors(item);

	router.push({ name: "Errors" });
}

onMounted(() => {
	socket.on("startDownload", startDownload);
	socket.on("startConversion", startConversion);
	socket.on("finishConversion", finishConversion);
	socket.on("addedToQueue", addToQueue);
	socket.on("updateQueue", updateQueue);
	socket.on("removedFromQueue", removeFromQueue);
	socket.on("finishDownload", finishDownload);
	socket.on("removedAllDownloads", removeAllDownloads);
	socket.on("removedFinishedDownloads", removedFinishedDownloads);

	fetchData("getQueue")
		.then((res) => {
			initQueue(res);
		})
		.catch(console.error);

	// Check if download tab has slim entries
	if (localStorage.getItem("slimDownloads") === "true") {
		list.value.classList.add("slim");
	}

	if (isExpanded.value) {
		setTabWidth(cachedTabWidth.value);
	}

	document.addEventListener("mouseup", () => {
		document.removeEventListener("mousemove", handleDrag);
	});
	document.addEventListener("keyup", checkIfToggleBar);

	window.addEventListener("beforeunload", () => {
		localStorage.setItem("downloadTabWidth", cachedTabWidth.value.toString());
	});
});

onUnmounted(() => {
	document.removeEventListener("keyup", checkIfToggleBar);
});
</script>

<template>
	<div
		v-if="isMobileDownloadsOpen"
		class="download-backdrop md:hidden"
		@click="toggleMobileDownloads"
	></div>

	<section
		class="mobile-download-sheet"
		:class="{
			'translate-y-full': !isMobileDownloadsOpen,
			'translate-y-0': isMobileDownloadsOpen,
		}"
		:aria-label="t('downloads')"
	>
		<div class="sheet-handle" @click="toggleMobileDownloads">
			<span></span>
		</div>

		<header class="download-panel-header mobile-panel-header">
			<div class="download-title-group">
				<strong>{{ t("downloads") }}</strong>
				<span class="download-count">{{ queueCount }}</span>
			</div>
			<div class="download-panel-actions">
				<button
					v-if="clientMode"
					type="button"
					:title="t('globals.open_downloads_folder')"
					@click="openDownloadsFolder"
				>
					<i class="material-icons">folder_open</i>
				</button>
				<button
					type="button"
					:title="t('globals.clean_queue_hint')"
					@click="cleanQueue"
				>
					<i class="material-icons">clear_all</i>
				</button>
				<button
					type="button"
					:title="t('globals.cancel_queue_hint')"
					@click="cancelQueue"
				>
					<i class="material-icons">delete_sweep</i>
				</button>
				<button
					type="button"
					:title="t('globals.toggle_download_tab_hint')"
					@click="toggleMobileDownloads"
				>
					<i class="material-icons">close</i>
				</button>
			</div>
		</header>

		<div class="mobile-queue-list">
			<QueueItem
				v-for="item in queueList"
				:key="item.uuid"
				:queue-item="item"
				:show-tags="showTags"
				@show-errors="showErrorsTab"
				@remove-item="onRemoveItem"
				@retry-download="onRetryDownload"
			/>
			<div v-if="queueCount === 0" class="download-empty">
				<i class="material-icons">download_done</i>
				<span>{{ t("downloads") }}</span>
			</div>
		</div>
	</section>

	<section
		id="download_tab_container"
		ref="container"
		class="text-foreground hidden h-screen md:flex"
		:class="{ 'tab-hidden': !isExpanded, 'w-8': !isExpanded }"
		:data-label="t('downloads')"
		:aria-label="t('downloads')"
		@transitionend="container.style.transition = ''"
	>
		<div
			v-show="isExpanded"
			class="download-resize-handle"
			@mousedown.prevent="startDrag"
		></div>

		<button
			id="toggle_download_tab"
			ref="toggler"
			type="button"
			:title="t('globals.toggle_download_tab_hint')"
			@click.prevent="toggleDownloadTab"
		>
			<i class="material-icons"></i>
		</button>

		<div v-show="isExpanded" class="desktop-download-content">
			<header class="download-panel-header">
				<div class="download-title-group">
					<strong>{{ t("downloads") }}</strong>
					<span class="download-count">{{ queueCount }}</span>
				</div>
				<div class="download-panel-actions">
					<button
						v-if="clientMode"
						type="button"
						:title="t('globals.open_downloads_folder')"
						@click="openDownloadsFolder"
					>
						<i class="material-icons">folder_open</i>
					</button>
					<button
						type="button"
						:title="t('globals.clean_queue_hint')"
						@click="cleanQueue"
					>
						<i class="material-icons">clear_all</i>
					</button>
					<button
						type="button"
						:title="t('globals.cancel_queue_hint')"
						@click="cancelQueue"
					>
						<i class="material-icons">delete_sweep</i>
					</button>
				</div>
			</header>

			<div id="download_list" ref="list" :class="{ slim: isSlim }">
				<QueueItem
					v-for="item in queueList"
					:key="item.uuid"
					:queue-item="item"
					:show-tags="showTags"
					@show-errors="showErrorsTab"
					@remove-item="onRemoveItem"
					@retry-download="onRetryDownload"
				/>
				<div v-if="queueCount === 0" class="download-empty">
					<i class="material-icons">download_done</i>
					<span>{{ t("downloads") }}</span>
				</div>
			</div>
		</div>
	</section>
</template>

<style scoped>
#toggle_download_tab {
	z-index: 3;
	display: grid;
	width: 32px;
	height: 48px;
	flex: 0 0 32px;
	place-items: center;
	margin-top: 8px;
	padding: 0;
	border: 0;
	background: transparent;
	color: var(--text-muted);
	cursor: pointer;
}

#toggle_download_tab i::before {
	content: "chevron_right";
}

#download_tab_container.tab-hidden #toggle_download_tab i::before {
	content: "chevron_left";
}
#download_tab_container.tab-hidden::after {
	content: attr(data-label);
	display: flex;
	align-items: center;
	text-transform: capitalize;
	writing-mode: vertical-rl;
	line-height: 32px;
	color: var(--text-muted);
	font-size: 0.78rem;
	letter-spacing: 0.04em;
}

#download_tab_container {
	position: relative;
	min-width: 32px;
	flex: 0 0 auto;
	flex-direction: column;
	border-left: 1px solid var(--border-subtle);
	background: var(--panels-background);
	box-shadow: -16px 0 42px hsla(220, 45%, 2%, 0.08);
	overflow: hidden;
}

.download-resize-handle {
	position: absolute;
	z-index: 4;
	top: 0;
	bottom: 0;
	left: -3px;
	width: 7px;
	cursor: ew-resize;
}

.desktop-download-content {
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	left: 32px;
	display: flex;
	min-width: 0;
	flex-direction: column;
}

.download-panel-header {
	display: flex;
	min-height: 64px;
	align-items: center;
	justify-content: space-between;
	gap: 0.75rem;
	padding: 0 14px;
	border-bottom: 1px solid var(--border-subtle);
}

.download-title-group {
	display: flex;
	min-width: 0;
	align-items: center;
	gap: 0.55rem;
}

.download-title-group strong {
	font-size: 1rem;
	font-weight: 720;
	text-transform: capitalize;
}

.download-count {
	display: grid;
	min-width: 22px;
	height: 22px;
	place-items: center;
	padding: 0 6px;
	border: 1px solid var(--border-subtle);
	border-radius: 999px;
	color: var(--text-muted);
	font-size: 0.72rem;
}

.download-panel-actions {
	display: flex;
	gap: 0.15rem;
	color: var(--text-muted);
}

.download-panel-actions button {
	display: grid;
	width: 36px;
	height: 36px;
	place-items: center;
	padding: 0;
	border: 0;
	border-radius: var(--radius-sm);
	background: transparent;
	color: inherit;
	cursor: pointer;
	transition:
		color 160ms ease,
		background-color 160ms ease;
}

.download-panel-actions button:hover {
	background: var(--surface-hover);
	color: var(--foreground);
}

.download-panel-actions i {
	font-size: 1.18rem;
}

.download-backdrop {
	position: fixed;
	z-index: 40;
	inset: 0;
	background: hsla(220, 35%, 2%, 0.72);
}

.mobile-download-sheet {
	position: fixed;
	z-index: 50;
	right: 0;
	bottom: 0;
	left: 0;
	display: none;
	height: min(64vh, 620px);
	border: 1px solid var(--border-subtle);
	border-bottom: 0;
	border-radius: 20px 20px 0 0;
	background: var(--panels-background);
	box-shadow: 0 -28px 72px hsla(220, 45%, 2%, 0.5);
	color: var(--foreground);
	transition: transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.sheet-handle {
	display: grid;
	height: 25px;
	place-items: center;
	cursor: pointer;
}

.sheet-handle span {
	width: 46px;
	height: 4px;
	border-radius: 999px;
	background: var(--border-strong);
}

.mobile-panel-header {
	min-height: 56px;
	padding: 0 16px 8px;
}

.mobile-queue-list {
	height: calc(100% - 81px);
	padding: 10px 16px calc(18px + env(safe-area-inset-bottom, 0px));
	overflow-y: auto;
	-webkit-overflow-scrolling: touch;
}

@media (max-width: 767px) {
	.mobile-download-sheet {
		display: block;
	}
}

#download_list {
	flex: 1;
	min-height: 0;
	padding: 12px 14px 22px;
	overflow-y: auto;
}
#download_list::-webkit-scrollbar {
	width: 10px;
}
#download_list::-webkit-scrollbar-track {
	background: var(--panels-background);
}
#download_list::-webkit-scrollbar-thumb {
	background: var(--panels-scroll);
	border-radius: 4px;
	width: 6px;
	padding: 0px 2px;
}

.download-empty {
	display: flex;
	min-height: 190px;
	align-items: center;
	justify-content: center;
	flex-direction: column;
	gap: 0.55rem;
	color: var(--text-muted);
	font-size: 0.84rem;
	text-transform: capitalize;
}

.download-empty i {
	font-size: 2rem;
	color: var(--primary-color);
}
</style>
