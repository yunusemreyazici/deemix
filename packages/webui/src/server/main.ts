import { DeemixApp } from "@/deemixApp.js";
import {
	authConfig,
	isAuthenticated,
	registerAuthRoutes,
	requireApiAuth,
} from "@/auth.js";
import { logger, removeOldLogs } from "@/helpers/logger.js";
import { loadLoginCredentials } from "@/helpers/loginStorage.js";
import cookieParser from "cookie-parser";
import { utils, type Listener } from "deemix";
import express, { type Express } from "express";
import session from "express-session";
import memorystore from "memorystore";
import morgan from "morgan";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import ViteExpress from "vite-express";
import { WebSocket, WebSocketServer } from "ws";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { normalizePort } from "./helpers/port.js";
import { getErrorCb, getListeningCb } from "./helpers/server-callbacks.js";
import { registerApis } from "./routes/api/register.js";
import indexRouter from "./routes/index.js";
import type { Arguments } from "./types.js";
import { registerWebsocket } from "./websocket/index.js";

const MemoryStore = memorystore(session);

// TODO: Remove type assertion while keeping correct types
const argv = yargs(hideBin(process.argv)).options({
	port: { type: "string", default: "6595" },
	host: { type: "string", default: "0.0.0.0" },
	locationbase: { type: "string", default: "/" },
	singleuser: { type: "boolean", default: false },
}).argv as Arguments;

const serverPort = process.env.DEEMIX_SERVER_PORT ?? argv.port;
const deemixHost = process.env.DEEMIX_HOST ?? argv.host;
const isSingleUser =
	process.env.DEEMIX_SINGLE_USER === undefined
		? !!argv.singleuser
		: process.env.DEEMIX_SINGLE_USER === "true";

const app: Express = express();

const configuredSessionSecret = process.env.DEEMIX_SESSION_SECRET;
if (
	authConfig.enabled &&
	(!configuredSessionSecret || configuredSessionSecret.length < 32)
) {
	throw new Error(
		"DEEMIX_SESSION_SECRET must contain at least 32 characters when authentication is enabled"
	);
}
const sessionSecret = configuredSessionSecret || "U2hoLCBpdHMgYSBzZWNyZXQh";

if (isSingleUser) loadLoginCredentials();

app.set("isSingleUser", isSingleUser);

/* === Deemix App === */
const listener: Listener = {
	send: (key: string, data?: any) => {
		const logLine = utils.formatListener(key, data);
		if (logLine) logger.info(logLine);
		if (["downloadInfo", "downloadWarn"].includes(key)) return;
		wss.clients.forEach((client) => {
			if (client.readyState === WebSocket.OPEN) {
				client.send(JSON.stringify({ key, data }));
			}
		});
	},
};
const deemixApp = new DeemixApp(listener);

/* === Middlewares === */
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
const sessionParser = session({
	store: new MemoryStore({
		checkPeriod: 86400000, // prune expired entries every 24h
	}),
	name: "deemix.sid",
	secret: sessionSecret,
	resave: false,
	saveUninitialized: true,
	cookie: {
		httpOnly: true,
		sameSite: "lax",
		secure: "auto",
	},
});

app.set("trust proxy", 1);
app.use(sessionParser);

registerAuthRoutes(app);
app.use((req, res, next) => {
	if (/\/api(?:\/|$)/.test(req.path)) {
		requireApiAuth(req, res, next);
		return;
	}
	next();
});

if (process.env.NODE_ENV === "development") {
	app.use(morgan("dev"));
}

/* === Routes === */
app.use("/", indexRouter);

/* === APIs === */
registerApis(app);

/* === Config === */
app.set("port", serverPort);
app.set("deemix", deemixApp);

/* === Server port === */
const server = app.listen({
	port: normalizePort(serverPort),
	host: deemixHost,
});
const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (request, socket, head) => {
	// express-session supports parsing the upgrade request with a response stub.
	sessionParser(request as any, {} as any, () => {
		if (!isAuthenticated((request as any).session)) {
			socket.write("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n");
			socket.destroy();
			return;
		}

		wss.handleUpgrade(request, socket, head, (ws) => {
			wss.emit("connection", ws, request);
		});
	});
});

if (process.env.NODE_ENV === "production") {
	const publicPath = join(dirname(fileURLToPath(import.meta.url)), "public");
	app.use(express.static(publicPath));
	app.get("*", (_, res) => {
		res.sendFile(join(publicPath, "index.html"));
	});
} else {
	ViteExpress.bind(app, server);
}

/* === Server callbacks === */
server.on("error", getErrorCb(serverPort));
server.on("listening", getListeningCb(server));
registerWebsocket(wss, deemixApp);

/* === Remove Old logs files === */
removeOldLogs(5);

export { app, deemixApp, server };
