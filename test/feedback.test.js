import { test } from "node:test";
import assert from "node:assert/strict";
import { SEND_ERROR, countLabel, hasUnsentText, isSendShortcut, send, submit, validate } from "../src/feedback.js";

test("counts characters", () => {
  assert.equal(countLabel(""), "0 characters");
  assert.equal(countLabel("a"), "1 character");
  assert.equal(countLabel("hello"), "5 characters");
});

test("counts emoji as one character", () => {
  assert.equal(countLabel("👍"), "1 character");
  assert.equal(countLabel("👍🏽"), "1 character");
  assert.equal(countLabel("👨‍👩‍👧"), "1 character");
  assert.equal(countLabel("hi 👍"), "4 characters");
});

test("counts accented letters as one character", () => {
  assert.equal(countLabel("é"), "1 character");
  assert.equal(countLabel("é"), "1 character"); // decomposed e + combining acute
  assert.equal(countLabel("café"), "4 characters");
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

test("⌘+Enter sends on macOS, not Ctrl+Enter", () => {
  assert.equal(isSendShortcut({ key: "Enter", metaKey: true }, { isMac: true }), true);
  assert.equal(isSendShortcut({ key: "Enter", ctrlKey: true }, { isMac: true }), false);
});

test("Ctrl+Enter sends elsewhere, not ⌘+Enter", () => {
  assert.equal(isSendShortcut({ key: "Enter", ctrlKey: true }), true);
  assert.equal(isSendShortcut({ key: "Enter", metaKey: true }), false);
});

test("plain Enter and other keys are not the shortcut", () => {
  assert.equal(isSendShortcut({ key: "Enter" }), false);
  assert.equal(isSendShortcut({ key: "Enter", shiftKey: true }, { isMac: true }), false);
  assert.equal(isSendShortcut({ key: "a", ctrlKey: true }), false);
});

test("hasUnsentText is true only when there is non-blank text", () => {
  assert.equal(hasUnsentText(""), false);
  assert.equal(hasUnsentText("  \n "), false);
  assert.equal(hasUnsentText("hello"), true);
});
