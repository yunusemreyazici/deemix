import { defineStore } from "pinia";

interface AuthState {
	ready: boolean;
	enabled: boolean;
	authenticated: boolean;
	error: string;
}

function authUrl(endpoint: string) {
	return new URL(
		`${window.location.origin}${location.base || "/"}api/auth/${endpoint}`
	);
}

export const useAuthStore = defineStore("auth", {
	state: (): AuthState => ({
		ready: false,
		enabled: false,
		authenticated: false,
		error: "",
	}),
	actions: {
		async initialize() {
			try {
				const response = await fetch(authUrl("status"));
				if (!response.ok) throw new Error("Authentication status unavailable");
				const data = await response.json();
				this.enabled = data.enabled;
				this.authenticated = data.authenticated;
			} catch {
				this.error = "Could not connect to the deemix server.";
			} finally {
				this.ready = true;
			}
		},
		async login(username: string, password: string) {
			this.error = "";
			const response = await fetch(authUrl("login"), {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username, password }),
			});

			if (response.status === 429) {
				const data = await response.json();
				this.error = `Too many attempts. Try again in ${data.retryAfter} seconds.`;
				return false;
			}

			if (!response.ok) {
				this.error = "Incorrect username or password.";
				return false;
			}

			this.authenticated = true;
			return true;
		},
		async logout() {
			await fetch(authUrl("logout"), { method: "POST" });
			window.location.reload();
		},
	},
});
