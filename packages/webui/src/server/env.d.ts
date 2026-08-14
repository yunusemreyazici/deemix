import type { Deezer } from "deezer-sdk";
import "express-session";

declare module "express-session" {
	export interface SessionData {
		dz: Deezer;
		authenticated?: boolean;
		authUsername?: string;
	}
}

export {};
