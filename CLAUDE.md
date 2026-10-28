# tomrade-demo-drafts

A tiny feedback form used to demo Tomrade: plain HTML, CSS and ES modules. No build step and no dependencies.

## Commands

- `npm start` — serve the app locally (`npx serve .`).
- `npm test` — run Node's built-in test runner (`node --test`).

## Layout

- `index.html` — the form. `#status` (`role="status"`) shows success and error messages.
- `src/feedback.js` — pure, DOM-free logic: `countLabel`, `validate`, `send` (injectable `transport`) and `submit`, the controller that turns a send into `{ ok, value }` or `{ ok: false, error }`.
- `src/main.js` — thin DOM wiring: reads the field, calls `submit`, renders the result, toggles the Send button.
- `src/style.css` — styles. Success text is green (`#2a7a3a`); errors are red via `#status.error`.
- `.demo/` — scripts that reset this repository and seed Tomrade's demo project. Not part of the app; leave it alone.
- `test/` — `node --test` tests for `src/feedback.js`; there is no DOM, so inject `send` or `transport` to cover failures.

## Conventions

- Keep decisions in `src/feedback.js` and DOM code in `src/main.js`; if `main.js` needs to decide something, move it into a pure helper.
- One branch per ticket (`<key>/<slug>`), and every commit message starts with the ticket key.
