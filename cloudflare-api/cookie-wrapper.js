import worker from "./src/index.js";

const SESSION_COOKIE = "__Host-ikai_session";
const COOKIE_ATTRIBUTES = "Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800";

function readCookie(request, name) {
  const cookieHeader = request.headers.get("Cookie") || "";
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() === name) {
      return part.slice(separator + 1).trim();
    }
  }
  return "";
}

function withHeaders(response, request, setCookie) {
  const headers = new Headers(response.headers);
  const origin = request.headers.get("Origin");
  if (origin === "https://ikai.one" || origin === "https://www.ikai.one" ||
      origin === "http://localhost:5173" || origin === "http://127.0.0.1:5173") {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
    const vary = headers.get("Vary");
    if (!vary || !vary.split(",").some((value) => value.trim().toLowerCase() === "origin")) {
      headers.set("Vary", vary ? `${vary}, Origin` : "Origin");
    }
  }
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (setCookie) headers.append("Set-Cookie", setCookie);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function cookieValue(token) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; ${COOKIE_ATTRIBUTES}`;
}

function clearCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const cookieToken = readCookie(request, SESSION_COOKIE);
    const isSessionRoute =
      (url.pathname === "/api/auth/me" && request.method === "GET") ||
      (url.pathname === "/api/auth/logout" && request.method === "POST") ||
      (url.pathname === "/api/shipments" && request.method === "GET") ||
      url.pathname === "/api/cod-reconciliations" ||
      url.pathname.startsWith("/api/cod-reconciliations/");

    let upstreamRequest = request;
    if (isSessionRoute && cookieToken) {
      const headers = new Headers(request.headers);
      try {
        headers.set("Authorization", `Bearer ${decodeURIComponent(cookieToken)}`);
        upstreamRequest = new Request(request, { headers });
      } catch {
        // Ignore malformed client cookies; the API will treat the request as unauthenticated.
      }
    }

    const response = await worker.fetch(upstreamRequest, env, ctx);
    let setCookie = "";
    let output = response;

    if ((url.pathname === "/api/auth/login" || url.pathname === "/api/auth/verify-email") &&
        request.method === "POST" && response.ok) {
      const payload = await response.clone().json().catch(() => null);
      if (payload?.token && payload?.user) {
        setCookie = cookieValue(payload.token);
        delete payload.token;
        output = new Response(JSON.stringify(payload), {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
      }
    }

    if (url.pathname === "/api/auth/logout" && request.method === "POST") {
      setCookie = clearCookie();
    }

    return withHeaders(output, request, setCookie);
  },
};
