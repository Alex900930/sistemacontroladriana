// Authentication disabled: export safe no-op stubs so the app can run without auth
import type { Express, RequestHandler } from "express";

export async function setupAuth(_app: Express) {
	// intentionally no-op (auth disabled for production simple deployment)
}

export const isAuthenticated: RequestHandler = (_req, _res, next) => {
	// allow all requests through
	next();
};

export function getSession() {
	return null;
}

export const authStorage = {
	async getUser(_id: string) { return null; },
	async upsertUser(_data: any) { return null; },
};

export function registerAuthRoutes(_app: Express) {
	// no auth routes registered
}

export type IAuthStorage = typeof authStorage;
