import { countLabel, validate, send } from "./feedback.js";

const form = document.querySelector("#feedback");
const message = document.querySelector("#message");
const count = document.querySelector("#count");
const status = document.querySelector("#status");

message.addEventListener("input", () => {
  count.textContent = countLabel(message.value);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const result = validate(message.value);
  if (!result.ok) {
    status.textContent = result.error;
    return;
  }
  await send(result.value);
  message.value = "";
  count.textContent = countLabel("");
  status.textContent = "Thanks — we got it.";
});
