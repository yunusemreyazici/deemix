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
			<img src="@/assets/deemix-icon.svg?url" alt="deemix" class="auth-logo" />
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
	background:
		radial-gradient(circle at top, hsla(210, 100%, 52%, 0.14), transparent 38%),
		var(--main-background);
	padding: 24px;
}

.auth-card {
	width: min(100%, 400px);
	border: 1px solid hsla(0, 0%, 100%, 0.08);
	border-radius: 16px;
	background: var(--panels-background);
	box-shadow: 0 24px 70px hsla(0, 0%, 0%, 0.32);
	padding: 32px;
}

.auth-logo {
	display: block;
	width: 72px;
	margin: 0 auto 24px;
}

h1 {
	margin: 0;
	text-align: center;
	font-size: 1.5rem;
}

.auth-card > p {
	margin: 10px 0 28px;
	opacity: 0.7;
	text-align: center;
	line-height: 1.5;
}

label {
	display: block;
	margin: 16px 0 7px;
	font-size: 0.875rem;
	font-weight: 600;
}

button {
	width: 100%;
	margin-top: 24px;
	border: 0;
	border-radius: 8px;
	background: var(--primary-color);
	padding: 13px 18px;
	color: white;
	font-weight: 700;
	cursor: pointer;
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
