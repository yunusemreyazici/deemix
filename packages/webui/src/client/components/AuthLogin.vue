<script setup lang="ts">
import { pinia } from "@/stores";
import { useAuthStore } from "@/stores/auth";
import { ref } from "vue";

const authStore = useAuthStore(pinia);
const username = ref("");
const password = ref("");
const isSubmitting = ref(false);

async function submit() {
	if (!username.value || !password.value || isSubmitting.value) return;

	isSubmitting.value = true;
	try {
		if (await authStore.login(username.value, password.value)) {
			window.location.reload();
		}
	} finally {
		isSubmitting.value = false;
	}
}
</script>

<template>
	<main class="auth-page">
		<section class="auth-card" aria-labelledby="auth-title">
			<div class="auth-brand">
				<img src="@/assets/deemix-icon.svg?url" alt="" class="auth-logo" />
				<span>dee<span>mix</span></span>
			</div>
			<h1 id="auth-title">Sign in to deemix</h1>
			<p>Enter the credentials configured by the server administrator.</p>

			<form @submit.prevent="submit">
				<label for="auth-username">Username</label>
				<input
					id="auth-username"
					v-model="username"
					type="text"
					autocomplete="username"
					autofocus
					required
				/>

				<label for="auth-password">Password</label>
				<input
					id="auth-password"
					v-model="password"
					type="password"
					autocomplete="current-password"
					required
				/>

				<p v-if="authStore.error" class="auth-error" role="alert">
					{{ authStore.error }}
				</p>

				<button type="submit" :disabled="isSubmitting">
					{{ isSubmitting ? "Signing in…" : "Sign in" }}
				</button>
			</form>
		</section>
	</main>
</template>

<style scoped>
.auth-page {
	display: grid;
	min-height: 100vh;
	min-height: 100dvh;
	place-items: center;
	background: var(--main-background);
	padding: 24px;
}

.auth-card {
	width: min(100%, 420px);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	background: var(--panels-background);
	box-shadow: var(--panel-shadow);
	padding: clamp(28px, 5vw, 42px);
}

.auth-brand {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 10px;
	margin-bottom: 28px;
	font-size: 1.55rem;
	font-weight: 800;
	letter-spacing: -0.05em;
}

.auth-brand > span > span {
	color: var(--primary-color);
}

.auth-logo {
	width: 44px;
	height: 44px;
}

h1 {
	margin: 0;
	text-align: center;
	font-size: 1.8rem;
	font-weight: 740;
	letter-spacing: -0.035em;
}

.auth-card > p {
	margin: 10px 0 28px;
	color: var(--text-muted);
	text-align: center;
	line-height: 1.5;
}

label {
	display: block;
	margin: 16px 0 7px;
	font-size: 0.875rem;
	font-weight: 650;
}

input {
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-sm) !important;
	transition:
		border-color 160ms ease,
		box-shadow 160ms ease;
}

input:focus {
	border-color: var(--primary-color);
	outline: none;
	box-shadow: 0 0 0 3px
		color-mix(in srgb, var(--primary-color) 14%, transparent);
}

button {
	width: 100%;
	margin-top: 24px;
	border: 0;
	min-height: 46px;
	border-radius: var(--radius-sm);
	background: var(--primary-color);
	padding: 13px 18px;
	color: white;
	font-weight: 700;
	cursor: pointer;
	transition:
		filter 160ms ease,
		transform 120ms ease;
}

button:hover {
	filter: brightness(1.08);
}

button:active {
	transform: translateY(1px);
}

button:disabled {
	opacity: 0.6;
	cursor: wait;
}

.auth-error {
	margin: 16px 0 0;
	border-radius: 8px;
	background: hsla(0, 75%, 48%, 0.16);
	padding: 10px 12px;
	color: hsl(0, 90%, 74%);
	font-size: 0.875rem;
}
</style>
