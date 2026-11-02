import { DRAFT_DELAY, countLabel, debounce, hasUnsentText, isSendShortcut, saveDraft, submit } from "./feedback.js";

const form = document.querySelector("#feedback");
const message = document.querySelector("#message");
const count = document.querySelector("#count");
const status = document.querySelector("#status");
const draftNote = document.querySelector("#draft-note");
const sendButton = form.querySelector('button[type="submit"]');

function setStatus(text, kind = "") {
  status.textContent = text;
  status.className = kind;
}

const persistDraft = debounce(() => {
  const saved = saveDraft(message.value, localStorage);
  draftNote.hidden = !(saved && message.value !== "");
}, DRAFT_DELAY);

message.addEventListener("input", () => {
  count.textContent = countLabel(message.value);
  draftNote.hidden = true;
  persistDraft();
});

const isMac = /Mac|iPhone|iPad/.test(navigator.platform);

message.addEventListener("keydown", (event) => {
  if (!isSendShortcut(event, { isMac })) return;
  event.preventDefault();
  form.requestSubmit();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (sendButton.disabled) return;

  sendButton.disabled = true;
  try {
    const result = await submit(message.value);
    if (!result.ok) {
      setStatus(result.error, "error");
      return;
    }
    message.value = "";
    count.textContent = countLabel("");
    draftNote.hidden = true;
    setStatus("Thanks — we got it.");
  } finally {
    sendButton.disabled = false;
  }
});

window.addEventListener("beforeunload", (event) => {
  if (!hasUnsentText(message.value)) return;
  event.preventDefault();
  event.returnValue = "";
});
