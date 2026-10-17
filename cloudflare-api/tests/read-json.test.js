import test from "node:test";
import assert from "node:assert/strict";
import { readJson } from "../src/index.js";

test("readJson parses valid JSON", async () => {
  const request = new Request("https://example.test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "test@example.com" }),
  });
  assert.deepEqual(await readJson(request), { email: "test@example.com" });
});

test("readJson rejects malformed JSON", async () => {
  const request = new Request("https://example.test", {
    method: "POST",
    body: "{bad json",
  });
  await assert.rejects(readJson(request), { message: "Request body must be valid JSON." });
});

test("readJson rejects a declared body larger than 20,000 bytes", async () => {
  const request = new Request("https://example.test", {
    method: "POST",
    headers: { "Content-Length": "20001" },
    body: "{}",
  });
  await assert.rejects(readJson(request), { message: "Request body is too large." });
});

test("readJson rejects an oversized streamed body without Content-Length", async () => {
  const bytes = new Uint8Array(20001).fill(97);
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
  const request = new Request("https://example.test", {
    method: "POST",
    body: stream,
    // A streaming request avoids automatically setting Content-Length.
    duplex: "half",
  });
  assert.equal(request.headers.has("Content-Length"), false);
  await assert.rejects(readJson(request), { message: "Request body is too large." });
});
