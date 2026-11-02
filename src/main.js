import { countLabel, hasUnsentText, isSendShortcut, submit } from "./feedback.js";

const form = document.querySelector("#feedback");
const message = document.querySelector("#message");
const count = document.querySelector("#count");
const status = document.querySelector("#status");
const sendButton = form.querySelector('button[type="submit"]');

function setStatus(text, kind = "") {
  status.textContent = text;
  status.className = kind;
}

let sending = false;

function updateSendButton() {
  sendButton.disabled = sending || !hasUnsentText(message.value);
}

updateSendButton();

message.addEventListener("input", () => {
  count.textContent = countLabel(message.value);
  updateSendButton();
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

  sending = true;
  updateSendButton();
  try {
    const result = await submit(message.value);
    if (!result.ok) {
      setStatus(result.error, "error");
      return;
    }
    message.value = "";
    count.textContent = countLabel("");
    setStatus("Thanks — we got it.");
  } finally {
    sending = false;
    updateSendButton();
  }
});

window.addEventListener("beforeunload", (event) => {
  if (!hasUnsentText(message.value)) return;
  event.preventDefault();
  event.returnValue = "";
});
