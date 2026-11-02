import { DRAFT_DELAY, countLabel, debounce, hasUnsentText, isSendShortcut, loadDraft, saveDraft, submit } from "./feedback.js";

const form = document.querySelector("#feedback");
const message = document.querySelector("#message");
const count = document.querySelector("#count");
const status = document.querySelector("#status");
const sendButton = form.querySelector('button[type="submit"]');

function setStatus(text, kind = "") {
  status.textContent = text;
  status.className = kind;
}

message.value = loadDraft(localStorage);
count.textContent = countLabel(message.value);

const persistDraft = debounce(() => saveDraft(message.value, localStorage), DRAFT_DELAY);

message.addEventListener("input", () => {
  count.textContent = countLabel(message.value);
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
    persistDraft.cancel();
    saveDraft("", localStorage);
    count.textContent = countLabel("");
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
