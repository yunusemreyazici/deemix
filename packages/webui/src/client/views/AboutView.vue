<script setup lang="ts">
import { pinia } from "@/stores";
import { useAppInfoStore } from "@/stores/appInfo";
import { useOnline } from "@/use/online";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const appInfo = useAppInfoStore(pinia);
const { isOnline } = useOnline();
const { t } = useI18n();

const updateUrl = computed(() => {
	if (appInfo.guiVersion) {
		return `https://github.com/bambanah/deemix/releases/tag/deemix-gui%40${appInfo.latestVersion}`;
	} else {
		return `https://github.com/bambanah/deemix/pkgs/container/deemix`;
	}
});
</script>

<template>
	<div class="about-page page-shell">
		<header class="page-heading">
			<h1 class="capitalize">{{ t("sidebar.about") }}</h1>
		</header>

		<div class="status-chip" :class="{ online: isOnline, offline: !isOnline }">
			<i class="material-icons">{{ isOnline ? "cloud_done" : "cloud_off" }}</i>
			<span class="uppercase-first-letter text-sm">
				{{ t(`about.appStatus.${isOnline ? "online" : "offline"}`) }}
			</span>
		</div>

		<section class="about-card version-list">
			<div class="about-card-icon"><i class="material-icons">info</i></div>
			<div>
				<p>
					{{ t("about.updates.currentWebuiVersion") }}:
					{{ appInfo.webuiVersion || t("about.updates.versionNotAvailable") }}
				</p>
				<p v-if="appInfo.guiVersion">
					{{ t("about.updates.currentGuiVersion") }}:
					{{ appInfo.guiVersion || t("about.updates.versionNotAvailable") }}
				</p>
				<p>
					{{ t("about.updates.deemixVersion") }}: {{ appInfo.deemixVersion }}
				</p>
				<i18n-t
					v-if="appInfo.updateAvailable && appInfo.latestVersion"
					keypath="about.updates.updateAvailable"
					tag="p"
				>
					<template #version>
						<a :href="updateUrl" target="_blank">{{ appInfo.latestVersion }}</a>
					</template>
				</i18n-t>
			</div>
		</section>

		<a href="https://ko-fi.com/L3L71IQN1F" target="_blank">
			<img
				height="36"
				style="border: 0px; height: 36px"
				src="https://storage.ko-fi.com/cdn/kofi6.png?v=6"
				border="0"
				alt="Buy Me a Coffee at ko-fi.com"
			/>
		</a>

		<section class="about-card about-copy">
			<h2 class="text-3xl">
				{{ t("about.titles.bugReportsContributing") }}
			</h2>
			<a
				href="https://github.com/bambanah/deemix"
				class="mt-4 flex items-center gap-2"
				target="_blank"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					height="20"
					viewBox="0 0 16 16"
					width="20"
					aria-hidden="true"
					class="d-block"
				>
					<path
						fill="currentColor"
						d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
					></path>
				</svg>
				{{ t("about.officialRepo") }}
			</a>
		</section>

		<ul class="about-notes">
			<li>
				{{ t("about.beforeReporting") }}
			</li>
			<li v-html="t('about.beSure')"></li>
			<li>
				{{ t("about.duplicateReports") }}
			</li>
		</ul>

		<h2 class="text-3xl leading-10">{{ t("about.titles.license") }}</h2>
		<p>
			<a
				rel="license"
				href="https://www.gnu.org/licenses/gpl-3.0.en.html"
				target="_blank"
			>
				<img
					alt="GNU General Public License"
					style="border-width: 0"
					src="https://www.gnu.org/graphics/gplv3-127x51.png"
				/>
			</a>
		</p>
		<i18n-t keypath="about.licencedUnder.text" tag="p">
			<template #gpl3>
				<a
					rel="license"
					href="https://www.gnu.org/licenses/gpl-3.0.en.html"
					target="_blank"
					>{{ t("about.licencedUnder.gpl3") }}</a
				>
			</template>
		</i18n-t>
	</div>
</template>

<style scoped>
.about-page {
	max-width: 860px;
}

.status-chip {
	display: inline-flex;
	width: fit-content;
	align-items: center;
	gap: 0.45rem;
	padding: 0.45rem 0.75rem;
	border: 1px solid var(--border-subtle);
	border-radius: 999px;
	font-weight: 650;
}

.status-chip i {
	font-size: 1rem;
}

.status-chip.online {
	color: hsl(151, 67%, 55%);
}

.status-chip.offline {
	color: hsl(3, 82%, 66%);
}

.about-card {
	display: flex;
	align-items: flex-start;
	gap: 1rem;
	padding: 1.35rem;
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	background: var(--secondary-background);
}

.about-card-icon {
	display: grid;
	width: 42px;
	height: 42px;
	flex: 0 0 42px;
	place-items: center;
	border-radius: var(--radius-md);
	background: var(--surface-hover);
	color: var(--primary-color);
}

.version-list p {
	margin: 0.22rem 0;
	color: var(--text-muted);
}

.about-copy {
	display: block;
}

.about-copy h2 {
	margin: 0 0 0.8rem;
	font-size: 1.45rem;
}

.about-notes {
	margin: 0;
	padding: 1.2rem 1.2rem 1.2rem 2.4rem;
	border-left: 2px solid var(--primary-color);
	background: var(--surface-hover);
	border-radius: 0 var(--radius-md) var(--radius-md) 0;
}

ul {
	@apply pl-4;
}

ul li {
	@apply leading-6;
}

:link {
	text-decoration: none;
}

@media (max-width: 560px) {
	.about-card {
		padding: 1rem;
	}

	.about-card-icon {
		display: none;
	}
}
</style>
