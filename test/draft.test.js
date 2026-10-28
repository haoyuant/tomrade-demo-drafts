import { test } from "node:test";
import assert from "node:assert/strict";
import { DRAFT_KEY, saveDraft, loadDraft, clearDraft } from "../src/draft.js";

// A minimal in-memory stand-in for window.localStorage.
class FakeStorage {
  constructor() {
    this.data = new Map();
  }
  getItem(key) {
    return this.data.has(key) ? this.data.get(key) : null;
  }
  setItem(key, value) {
    this.data.set(key, String(value));
  }
  removeItem(key) {
    this.data.delete(key);
  }
}

// Storage that is present but full: writes throw QuotaExceededError.
class FullStorage extends FakeStorage {
  setItem() {
    throw new DOMException("quota exceeded", "QuotaExceededError");
  }
}

// Storage that is blocked (e.g. privacy settings): every call throws SecurityError.
class BlockedStorage {
  getItem() {
    throw new DOMException("blocked", "SecurityError");
  }
  setItem() {
    throw new DOMException("blocked", "SecurityError");
  }
  removeItem() {
    throw new DOMException("blocked", "SecurityError");
  }
}

test("saves and loads a draft under the versioned key", (t) => {
  t.mock.method(Date, "now", () => 1700000000000);
  const storage = new FakeStorage();
  assert.equal(saveDraft(storage, "  hello "), true);
  assert.deepEqual(JSON.parse(storage.getItem(DRAFT_KEY)), {
    text: "  hello ",
    savedAt: 1700000000000,
  });
  assert.equal(DRAFT_KEY, "feedback-draft:v1");
  assert.deepEqual(loadDraft(storage), { text: "  hello ", savedAt: 1700000000000 });
});

test("saving again replaces the draft", () => {
  const storage = new FakeStorage();
  saveDraft(storage, "first");
  saveDraft(storage, "second");
  assert.equal(loadDraft(storage).text, "second");
  assert.equal(storage.data.size, 1);
});

test("returns null when there is no draft", () => {
  assert.equal(loadDraft(new FakeStorage()), null);
});

test("empty or whitespace-only text clears the draft instead of saving", () => {
  for (const text of ["", "   ", "\n\t "]) {
    const storage = new FakeStorage();
    saveDraft(storage, "keep me");
    assert.equal(saveDraft(storage, text), false);
    assert.equal(storage.getItem(DRAFT_KEY), null);
    assert.equal(loadDraft(storage), null);
  }
});

test("clearDraft removes the draft", () => {
  const storage = new FakeStorage();
  saveDraft(storage, "hello");
  clearDraft(storage);
  assert.equal(loadDraft(storage), null);
});

test("never throws when storage is unavailable", () => {
  for (const storage of [undefined, null]) {
    assert.equal(saveDraft(storage, "hello"), false);
    assert.equal(saveDraft(storage, ""), false);
    assert.equal(loadDraft(storage), null);
    assert.doesNotThrow(() => clearDraft(storage));
  }
});

test("never throws when storage is full", () => {
  const storage = new FullStorage();
  assert.equal(saveDraft(storage, "hello"), false);
  assert.equal(loadDraft(storage), null);
});

test("never throws when storage is blocked", () => {
  const storage = new BlockedStorage();
  assert.equal(saveDraft(storage, "hello"), false);
  assert.equal(saveDraft(storage, "  "), false);
  assert.equal(loadDraft(storage), null);
  assert.doesNotThrow(() => clearDraft(storage));
});

test("loadDraft returns null for corrupt JSON", () => {
  const storage = new FakeStorage();
  storage.setItem(DRAFT_KEY, "{not json");
  assert.equal(loadDraft(storage), null);
});

test("loadDraft returns null for valid JSON with the wrong shape", () => {
  for (const raw of ["null", "42", '"text"', "[]", '{"text":1,"savedAt":1}', '{"text":"hi"}', '{"text":"  ","savedAt":1}']) {
    const storage = new FakeStorage();
    storage.setItem(DRAFT_KEY, raw);
    assert.equal(loadDraft(storage), null, raw);
  }
});
