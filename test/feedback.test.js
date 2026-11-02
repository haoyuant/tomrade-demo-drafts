import { test } from "node:test";
import assert from "node:assert/strict";
import { SEND_ERROR, countLabel, isSendShortcut, send, submit, validate } from "../src/feedback.js";

test("counts characters", () => {
  assert.equal(countLabel(""), "0 characters");
  assert.equal(countLabel("a"), "1 character");
  assert.equal(countLabel("hello"), "5 characters");
});

test("rejects empty feedback", () => {
  assert.equal(validate("   ").ok, false);
});

test("trims feedback", () => {
  assert.deepEqual(validate("  hi  "), { ok: true, value: "hi" });
});

test("submit reports a successful send", async () => {
  const sent = [];
  const result = await submit("  hi  ", {
    send: async (text) => {
      sent.push(text);
    },
  });

  assert.deepEqual(result, { ok: true, value: "hi" });
  assert.deepEqual(sent, ["hi"]);
});

test("a failed send reports the error instead of throwing", async () => {
  const result = await submit("hi", {
    send: async () => {
      throw new Error("network down");
    },
  });

  assert.deepEqual(result, { ok: false, error: SEND_ERROR });
});

test("invalid feedback is never sent", async () => {
  let calls = 0;
  const result = await submit("   ", {
    send: async () => {
      calls += 1;
    },
  });

  assert.deepEqual(result, { ok: false, error: "Please write something first." });
  assert.equal(calls, 0);
});

test("send fails through an injectable transport", async () => {
  await assert.rejects(
    send("hi", {
      transport: async () => {
        throw new Error("network down");
      },
    }),
    /network down/,
  );
});

const key = (overrides) => ({
  key: "Enter",
  metaKey: false,
  ctrlKey: false,
  altKey: false,
  shiftKey: false,
  isComposing: false,
  ...overrides,
});

test("⌘+Enter sends on macOS, Ctrl+Enter elsewhere", () => {
  assert.equal(isSendShortcut(key({ metaKey: true }), { mac: true }), true);
  assert.equal(isSendShortcut(key({ ctrlKey: true }), { mac: false }), true);
  assert.equal(isSendShortcut(key({ ctrlKey: true }), { mac: true }), false);
  assert.equal(isSendShortcut(key({ metaKey: true }), { mac: false }), false);
});

test("plain Enter and other combinations are not a send shortcut", () => {
  assert.equal(isSendShortcut(key({}), { mac: true }), false);
  assert.equal(isSendShortcut(key({}), { mac: false }), false);
  assert.equal(isSendShortcut(key({ shiftKey: true }), { mac: false }), false);
  assert.equal(isSendShortcut(key({ ctrlKey: true, shiftKey: true }), { mac: false }), false);
  assert.equal(isSendShortcut(key({ metaKey: true, altKey: true }), { mac: true }), false);
  assert.equal(isSendShortcut(key({ key: "a", ctrlKey: true }), { mac: false }), false);
  assert.equal(isSendShortcut(key({ metaKey: true, isComposing: true }), { mac: true }), false);
});
