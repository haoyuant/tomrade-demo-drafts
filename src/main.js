import { countLabel, isSendShortcut, submit } from "./feedback.js";

const form = document.querySelector("#feedback");
const message = document.querySelector("#message");
const count = document.querySelector("#count");
const status = document.querySelector("#status");
const sendButton = form.querySelector('button[type="submit"]');
const mac = /Mac|iPhone|iPad/.test(navigator.userAgentData?.platform ?? navigator.platform ?? "");

function setStatus(text, kind = "") {
  status.textContent = text;
  status.className = kind;
}

message.addEventListener("input", () => {
  count.textContent = countLabel(message.value);
});

message.addEventListener("keydown", (event) => {
  if (!isSendShortcut(event, { mac })) return;
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
    setStatus("Thanks — we got it.");
  } finally {
    sendButton.disabled = false;
  }
});
