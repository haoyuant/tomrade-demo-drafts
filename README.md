# Feedback form

A tiny feedback form used to demo [Tomrade](https://tomrade.com): plain HTML and JavaScript, no build step.

- `npm start` serves it locally.
- `npm test` runs the tests (Node's built-in test runner).

## Drafts

- **What is saved:** the text in the message box, as you type (after a 500 ms pause).
- **Where:** your browser's `localStorage`, under the key `feedback-draft`. It stays on your device and is restored when the form opens.
- **When it is cleared:** after a successful send, or when you empty the box. A failed send keeps the draft.
