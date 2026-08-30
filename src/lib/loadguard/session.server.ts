// Server-side session identity. The browser never chooses its own session key:
// it lives in an HttpOnly cookie so ownership is enforced server-side.
import { getCookie, setCookie } from "@tanstack/react-start/server";

const COOKIE = "lg_session";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function resolveSessionKey(): string {
    const existing = getCookie(COOKIE);
    if (existing && UUID.test(existing)) return existing;

    const key = crypto.randomUUID();
    setCookie(COOKIE, key, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
        maxAge: 60 * 60 * 24 * 7,
    });
    return key;
}
