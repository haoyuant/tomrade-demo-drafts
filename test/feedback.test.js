import { test } from "node:test";
import assert from "node:assert/strict";
import { SEND_ERROR, countLabel, draftSavedLabel, send, submit, validate } from "../src/feedback.js";

test("formats a draft's saved time or leaves the label empty", () => {
  assert.equal(draftSavedLabel(new Date(2026, 0, 1, 9, 5).getTime()), "Draft saved at 09:05");
  assert.equal(draftSavedLabel(null), "");
  assert.equal(draftSavedLabel("invalid"), "");
});

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
