// Pure helpers, kept free of the DOM so they can be tested with node --test.

export const SEND_ERROR = "Couldn't send — please try again.";

export const LIMIT = 2000;
export const WARN_FROM = 1800;

export function countLabel(text) {
  const n = text.length;
  if (n >= WARN_FROM) return `${Math.max(0, LIMIT - n)} left`;
  return `${n} character${n === 1 ? "" : "s"}`;
}

export function validate(text) {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: "Please write something first." };
  if (trimmed.length > 2000) return { ok: false, error: "Please keep it under 2000 characters." };
  return { ok: true, value: trimmed };
}

// Stands in for a real API call. `transport` is injectable so tests can make it fail.
export async function send(text, { transport = postFeedback } = {}) {
  return transport(text);
}

async function postFeedback(text) {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return { id: Math.random().toString(36).slice(2, 8), text };
}

// Validates, sends and reports the outcome. Never throws: the DOM layer only renders.
export async function submit(text, { send: sendFn = send } = {}) {
  const result = validate(text);
  if (!result.ok) return { ok: false, error: result.error };

  try {
    await sendFn(result.value);
    return { ok: true, value: result.value };
  } catch {
    return { ok: false, error: SEND_ERROR };
  }
}

// Is this key event the send shortcut? ⌘+Enter on macOS, Ctrl+Enter elsewhere.
export function isSendShortcut(event, { isMac = false } = {}) {
  if (event.key !== "Enter" || event.altKey || event.shiftKey) return false;
  return isMac ? !!event.metaKey && !event.ctrlKey : !!event.ctrlKey && !event.metaKey;
}

// Is there text in the box that hasn't been sent? Whitespace alone doesn't count.
export function hasUnsentText(text) {
  return text.trim().length > 0;
}
