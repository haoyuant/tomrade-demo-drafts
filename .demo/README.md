# Demo kit

What Tomrade's demo videos are recorded from. Not part of the app.

- `reset.sh` — puts this repository back at the `demo-baseline` tag: closes open pull requests and issues, deletes other branches and agent worktrees, force-pushes `main`, opens the seed issues again.
- `seed.mjs` — fills a fresh Tomrade project named “Feedback form” (ticket key prefix `FB`) with the demo backlog, FB-1 … FB-10, through the installed Tomrade's local MCP server (port 19090).
- `rules.md` — the project rules, pasted into Project settings → Rules.
- `issues/` — the GitHub issues the inbox picks up (first line is the title).

## Before each take

1. `.demo/reset.sh`
2. In Tomrade: delete the previous “Feedback form” project, then New project → name “Feedback form”, ticket key prefix `FB`.
3. `node .demo/seed.mjs`
4. Project settings → Rules: paste `rules.md`, Save rules.
5. Project settings → Repositories: Choose folder… → this checkout; tick the Main workstream; Connect on this machine only.
6. Inbox → Sources: switch on GitHub issues. Don't press Check now until the inbox clip.
