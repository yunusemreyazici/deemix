import { scryptSync } from "node:crypto";
import express from "express";
import session from "express-session";
import request from "supertest";
import {
	authConfig,
	loadAuthConfig,
	registerAuthRoutes,
	requireApiAuth,
	verifyCredentials,
} from "./auth.js";

function passwordHash(password: string) {
	const salt = Buffer.from("00112233445566778899aabbccddeeff", "hex");
	const digest = scryptSync(password, salt, 64);
	return `scrypt:${salt.toString("hex")}:${digest.toString("hex")}`;
}

describe("auth configuration", () => {
	it("keeps authentication disabled when credentials are absent", () => {
		expect(loadAuthConfig({})).toEqual({
			enabled: false,
			username: "",
			passwordHash: "",
		});
	});

	it("rejects partial or malformed credentials", () => {
		expect(() => loadAuthConfig({ DEEMIX_AUTH_USERNAME: "admin" })).toThrow();
		expect(() =>
			loadAuthConfig({
				DEEMIX_AUTH_USERNAME: "admin",
				DEEMIX_AUTH_PASSWORD_HASH: "not-a-hash",
			})
		).toThrow();
	});
});

describe("credential verification", () => {
	const config = {
		enabled: true,
		username: "admin",
		passwordHash: passwordHash("correct horse battery staple"),
	};

	it("accepts the configured credentials", () => {
		expect(
			verifyCredentials("admin", "correct horse battery staple", config)
		).toBe(true);
	});

	it("rejects an incorrect username or password", () => {
		expect(
			verifyCredentials("someone", "correct horse battery staple", config)
		).toBe(false);
		expect(verifyCredentials("admin", "incorrect", config)).toBe(false);
	});
});

describe("authentication routes", () => {
	const originalConfig = { ...authConfig };

	afterEach(() => Object.assign(authConfig, originalConfig));

	it("protects APIs until login and destroys the session on logout", async () => {
		Object.assign(authConfig, {
			enabled: true,
			username: "admin",
			passwordHash: passwordHash("test-password"),
		});

		const app = express();
		app.use(express.json());
		app.use(
			session({
				secret: "test-session-secret-that-is-long-enough",
				resave: false,
				saveUninitialized: true,
			})
		);
		registerAuthRoutes(app);
		app.use("/api", requireApiAuth);
		app.get("/api/protected", (_, res) => res.send({ ok: true }));

		const agent = request.agent(app);
		await agent.get("/api/protected").expect(401);
		await agent
			.post("/api/auth/login")
			.send({ username: "admin", password: "wrong" })
			.expect(401);
		await agent
			.post("/api/auth/login")
			.send({ username: "admin", password: "test-password" })
			.expect(200, { authenticated: true });
		await agent.get("/api/protected").expect(200, { ok: true });
		await agent.post("/api/auth/logout").expect(200, { authenticated: false });
		await agent.get("/api/protected").expect(401);
	});
});
