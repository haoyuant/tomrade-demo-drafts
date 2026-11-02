import { test } from "node:test";
import assert from "node:assert/strict";
import { DRAFT_KEY, SEND_ERROR, debounce, saveDraft, countLabel, hasUnsentText, isSendShortcut, send, submit, validate } from "../src/feedback.js";

test("counts characters", () => {
  assert.equal(countLabel(""), "0 characters");
  assert.equal(countLabel("a"), "1 character");
  assert.equal(countLabel("hello"), "5 characters");
});

test("shows characters left from 1800 on", () => {
  assert.equal(countLabel("a".repeat(1799)), "1799 characters");
  assert.equal(countLabel("a".repeat(1800)), "200 left");
  assert.equal(countLabel("a".repeat(1999)), "1 left");
  assert.equal(countLabel("a".repeat(2000)), "0 left");
  assert.equal(countLabel("a".repeat(2001)), "0 left");
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

function fakeStorage() {
  const data = new Map();
  return {
    data,
    setItem: (k, v) => data.set(k, v),
    removeItem: (k) => data.delete(k),
  };
}

test("saveDraft stores the text", () => {
  const storage = fakeStorage();
  assert.equal(saveDraft("hello", storage), true);
  assert.equal(storage.data.get(DRAFT_KEY), "hello");
});

test("saveDraft removes the draft when the box is empty", () => {
  const storage = fakeStorage();
  saveDraft("hello", storage);
  saveDraft("", storage);
  assert.equal(storage.data.has(DRAFT_KEY), false);
});

test("saveDraft survives a failing storage", () => {
  const storage = { setItem() { throw new Error("full"); }, removeItem() {} };
  assert.equal(saveDraft("hello", storage), false);
});

test("debounce runs only the last call after the wait", () => {
  const timers = [];
  const setTimer = (fn, ms) => (timers.push({ fn, ms, cleared: false }), timers.length - 1);
  const clearTimer = (i) => { if (timers[i]) timers[i].cleared = true; };
  const calls = [];
  const d = debounce((x) => calls.push(x), 500, { setTimer, clearTimer });
  d("a");
  d("ab");
  assert.equal(timers[0].cleared, true);
  assert.equal(timers[1].ms, 500);
  timers.filter((t) => !t.cleared).forEach((t) => t.fn());
  assert.deepEqual(calls, ["ab"]);
});

test("loadDraft returns the saved text", () => {
  assert.equal(loadDraft({ getItem: (k) => (k === DRAFT_KEY ? "hello" : null) }), "hello");
});

test("loadDraft ignores a missing or corrupt draft", () => {
  assert.equal(loadDraft({ getItem: () => null }), "");
  assert.equal(loadDraft({ getItem: () => 42 }), "");
  assert.equal(loadDraft({ getItem: () => { throw new Error("blocked"); } }), "");
});
