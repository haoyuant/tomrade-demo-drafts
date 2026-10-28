// Draft storage helpers, kept free of the DOM so they can be tested with node --test.
// `storage` is anything shaped like window.localStorage; it may be missing,
// blocked, full or hold corrupt data, and none of that ever throws from here.

export const DRAFT_KEY = "feedback-draft:v1";

// Saves {text, savedAt}. Empty or whitespace-only text clears the draft instead.
// Returns true when the draft was written.
export function saveDraft(storage, text) {
  if (typeof text !== "string" || !text.trim()) {
    clearDraft(storage);
    return false;
  }
  try {
    storage.setItem(DRAFT_KEY, JSON.stringify({ text, savedAt: Date.now() }));
    return true;
  } catch {
    return false;
  }
}

// Returns {text, savedAt}, or null when there is no usable draft.
export function loadDraft(storage) {
  try {
    const raw = storage.getItem(DRAFT_KEY);
    if (raw == null) return null;
    const draft = JSON.parse(raw);
    if (
      !draft ||
      typeof draft.text !== "string" ||
      !draft.text.trim() ||
      typeof draft.savedAt !== "number"
    ) {
      return null;
    }
    return { text: draft.text, savedAt: draft.savedAt };
  } catch {
    return null;
  }
}

export function clearDraft(storage) {
  try {
    storage.removeItem(DRAFT_KEY);
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}
