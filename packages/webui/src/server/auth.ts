import { createHash, scryptSync, timingSafeEqual } from "node:crypto";
import type { Application, RequestHandler } from "express";

const HASH_PREFIX = "scrypt";
const MAX_LOGIN_FAILURES = 5;
const LOGIN_BLOCK_MS = 60_000;

export interface AuthConfig {
	enabled: boolean;
	username: string;
	passwordHash: string;
}

interface LoginAttempt {
	failures: number;
	blockedUntil: number;
}

const loginAttempts = new Map<string, LoginAttempt>();

function parsePasswordHash(value: string) {
	const [algorithm, saltHex, digestHex, ...extra] = value.split(":");
	if (
		algorithm !== HASH_PREFIX ||
		extra.length > 0 ||
		!/^[a-f0-9]{32}$/i.test(saltHex || "") ||
		!/^[a-f0-9]{128}$/i.test(digestHex || "")
	) {
		throw new Error(
			"DEEMIX_AUTH_PASSWORD_HASH must use the scrypt:<salt>:<digest> format"
		);
	}

	return {
		salt: Buffer.from(saltHex, "hex"),
		digest: Buffer.from(digestHex, "hex"),
	};
}

export function loadAuthConfig(
	env: NodeJS.ProcessEnv = process.env
): AuthConfig {
	const username = String(env.DEEMIX_AUTH_USERNAME || "").trim();
	const passwordHash = String(env.DEEMIX_AUTH_PASSWORD_HASH || "").trim();

	if (!username && !passwordHash) {
		return { enabled: false, username: "", passwordHash: "" };
	}

	if (!username || !passwordHash) {
		throw new Error(
			"DEEMIX_AUTH_USERNAME and DEEMIX_AUTH_PASSWORD_HASH must be configured together"
		);
	}

	parsePasswordHash(passwordHash);
	return { enabled: true, username, passwordHash };
}

export const authConfig = loadAuthConfig();

function constantTimeStringEqual(left: string, right: string) {
	const leftDigest = createHash("sha256").update(left).digest();
	const rightDigest = createHash("sha256").update(right).digest();
	return timingSafeEqual(leftDigest, rightDigest);
}

export function verifyCredentials(
	username: string,
	password: string,
	config: AuthConfig = authConfig
) {
	if (!config.enabled || password.length > 1024) return false;

	const { salt, digest } = parsePasswordHash(config.passwordHash);
	const candidate = scryptSync(password, salt, digest.length);

	return (
		constantTimeStringEqual(username, config.username) &&
		timingSafeEqual(candidate, digest)
	);
}

function getLoginKey(req: Parameters<RequestHandler>[0]) {
	return req.ip || req.socket.remoteAddress || "unknown";
}

function getRetryAfter(key: string) {
	const attempt = loginAttempts.get(key);
	if (!attempt) return 0;

	const remainingMs = attempt.blockedUntil - Date.now();
	if (remainingMs <= 0) {
		if (attempt.blockedUntil > 0) loginAttempts.delete(key);
		return 0;
	}

	return Math.ceil(remainingMs / 1000);
}

function recordFailedLogin(key: string) {
	const current = loginAttempts.get(key) || { failures: 0, blockedUntil: 0 };
	current.failures += 1;
	if (current.failures >= MAX_LOGIN_FAILURES) {
		current.blockedUntil = Date.now() + LOGIN_BLOCK_MS;
	}
	loginAttempts.set(key, current);
}

export function isAuthenticated(session?: { authenticated?: boolean }) {
	return !authConfig.enabled || session?.authenticated === true;
}

export function registerAuthRoutes(app: Application) {
	app.get("*/api/auth/status", (req, res) => {
		res.send({
			enabled: authConfig.enabled,
			authenticated: isAuthenticated(req.session as any),
		});
	});

	app.post("*/api/auth/login", (req, res) => {
		if (!authConfig.enabled) {
			res.send({ authenticated: true });
			return;
		}

		const key = getLoginKey(req);
		const retryAfter = getRetryAfter(key);
		if (retryAfter > 0) {
			res.set("Retry-After", String(retryAfter));
			res.status(429).send({ error: "tooManyAttempts", retryAfter });
			return;
		}

		const username = String(req.body?.username || "");
		const password = String(req.body?.password || "");
		if (!verifyCredentials(username, password)) {
			recordFailedLogin(key);
			res.status(401).send({ error: "invalidCredentials" });
			return;
		}

		loginAttempts.delete(key);
		req.session.regenerate((error) => {
			if (error) {
				res.status(500).send({ error: "sessionError" });
				return;
			}

			const authSession = req.session as typeof req.session & {
				authenticated?: boolean;
				authUsername?: string;
			};
			authSession.authenticated = true;
			authSession.authUsername = authConfig.username;
			req.session.save((saveError) => {
				if (saveError) {
					res.status(500).send({ error: "sessionError" });
					return;
				}
				res.send({ authenticated: true });
			});
		});
	});

	app.post("*/api/auth/logout", (req, res) => {
		req.session.destroy((error) => {
			if (error) {
				res.status(500).send({ error: "sessionError" });
				return;
			}
			res.clearCookie("deemix.sid");
			res.send({ authenticated: false });
		});
	});
}

export const requireApiAuth: RequestHandler = (req, res, next) => {
	if (isAuthenticated(req.session as any)) {
		next();
		return;
	}

	res.status(401).send({ error: "authenticationRequired" });
};
