// Pure helpers, kept free of the DOM so they can be tested with node --test.

export const SEND_ERROR = "Couldn't send — please try again.";

const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

// Counts user-perceived characters, so "👍" is 1 rather than 2 UTF-16 units.
function charCount(text) {
  let n = 0;
  for (const _ of segmenter.segment(text)) n++;
  return n;
}

export function countLabel(text) {
  const n = charCount(text);
  return `${n} character${n === 1 ? "" : "s"}`;
}

export function validate(text) {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: "Please write something first." };
  if (charCount(trimmed) > 2000) return { ok: false, error: "Please keep it under 2000 characters." };
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
