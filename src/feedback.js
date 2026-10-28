// Pure helpers, kept free of the DOM so they can be tested with node --test.

export function countLabel(text) {
  const n = text.length;
  return `${n} character${n === 1 ? "" : "s"}`;
}

export function validate(text) {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: "Please write something first." };
  if (trimmed.length > 2000) return { ok: false, error: "Please keep it under 2000 characters." };
  return { ok: true, value: trimmed };
}

// Stands in for a real API call.
export async function send(text) {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return { id: Math.random().toString(36).slice(2, 8), text };
}
