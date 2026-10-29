// Seeds the "Feedback form" project in the installed Tomrade with the demo backlog,
// through Tomrade's local MCP server. Run it once on a freshly created project:
//   node .demo/seed.mjs [--project "Feedback form"] [--port 19090] [--force]

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const at = args.indexOf(`--${name}`);
  return at >= 0 && args[at + 1] ? args[at + 1] : fallback;
};
const projectName = option("project", "Feedback form");
const endpoint = `http://127.0.0.1:${option("port", "19090")}/mcp`;
const force = args.includes("--force");

const acceptance = (...lines) => `\n\n## Acceptance\n${lines.map((line) => `- ${line}`).join("\n")}`;

// In creation order, so a fresh project with prefix FB gets FB-1 … FB-10.
// `parent` names an earlier entry by its slug.
const ITEMS = [
  {
    slug: "readme",
    title: "Add a README with how to run it",
    status: "done",
    priority: 1,
    body: "Say what the app is and how to start it and run the tests." + acceptance("README.md names `npm start` and `npm test`.")
  },
  {
    slug: "failed-sends",
    title: "Handle failed sends in the feedback form",
    status: "done",
    priority: 3,
    body: "When sending fails, the text is kept and the person sees why." + acceptance("A failed send keeps the message and shows an error.", "Tests cover the failure.")
  },
  { slug: "polish", kind: "epic", title: "Polish the form", status: "todo", priority: 2, body: "Small things that make the form nicer to use." },
  {
    slug: "send-shortcut",
    parent: "polish",
    title: "Send with ⌘/Ctrl+Enter",
    status: "todo",
    priority: 2,
    body:
      "People who type a lot want to send without reaching for the mouse." +
      acceptance(
        "⌘+Enter on macOS and Ctrl+Enter elsewhere send the form, exactly like pressing Send.",
        "Plain Enter still adds a new line.",
        "The decision (is this key event a send shortcut?) is a pure helper in src/feedback.js with a node --test test."
      )
  },
  {
    slug: "chars-left",
    parent: "polish",
    title: "Show how many characters are left near the limit",
    status: "backlog",
    priority: 1,
    body: "The limit is 2000 characters. From 1800 on, show how many are left instead of the count." + acceptance("At 1800+ the label reads “N left”.", "Tested in src/feedback.js.")
  },
  {
    slug: "dark-system",
    parent: "polish",
    title: "Follow the system's dark mode",
    status: "backlog",
    priority: 1,
    body: "Use prefers-color-scheme so the form is dark when the system is." + acceptance("Dark colours under prefers-color-scheme: dark.", "Text stays readable in both.")
  },
  {
    slug: "dark-mode",
    title: "Support dark mode",
    status: "backlog",
    priority: 1,
    body: "Someone asked for a dark version of the form." + acceptance("The form has a dark look.")
  },
  {
    slug: "emoji",
    title: "Count emoji as one character",
    status: "backlog",
    priority: 2,
    body: "👍 counts as 2 characters today; count what a person sees." + acceptance("countLabel counts user-perceived characters (Intl.Segmenter).", "Tests cover emoji and accented letters.")
  },
  {
    slug: "leave-warning",
    title: "Warn before closing the tab with unsent text",
    status: "backlog",
    priority: 1,
    body: "If the box has text that wasn't sent, ask before the tab closes." + acceptance("beforeunload asks only when there is unsent text.")
  },
  {
    slug: "v2",
    title: "Feedback v2: attachments, categories and follow-up by email",
    status: "backlog",
    priority: 1,
    body:
      "Let people attach a screenshot, pick a category (bug, idea, question) and leave an email address if they want an answer. " +
      "Show a summary before sending, and send a confirmation email afterwards."
  }
];

let session;
let nextId = 1;

async function rpc(method, params, { notify = false } = {}) {
  const id = notify ? undefined : nextId++;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      ...(session ? { "mcp-session-id": session } : {})
    },
    body: JSON.stringify({ jsonrpc: "2.0", method, params, ...(notify ? {} : { id }) })
  });
  session ??= res.headers.get("mcp-session-id") ?? undefined;
  if (notify) return;
  if (!res.ok) throw new Error(`${method}: HTTP ${res.status} ${await res.text()}`);
  const text = await res.text();
  // Streamable HTTP answers with JSON or with server-sent events carrying it.
  const messages = res.headers.get("content-type")?.includes("text/event-stream")
    ? text.split("\n").filter((line) => line.startsWith("data:")).map((line) => JSON.parse(line.slice(5)))
    : [JSON.parse(text)];
  const reply = messages.find((message) => message.id === id);
  if (!reply) throw new Error(`${method}: no reply`);
  if (reply.error) throw new Error(`${method}: ${reply.error.message}`);
  return reply.result;
}

async function call(name, input) {
  const result = await rpc("tools/call", { name, arguments: input });
  const parts = result.content?.map((part) => part.text ?? "") ?? [];
  if (result.isError) throw new Error(`${name}: ${parts.join("\n")}`);
  // The answer is the first part; Tomrade may add a note (such as a sync line) after it.
  try {
    return JSON.parse(parts[0] ?? "");
  } catch {
    return parts.join("\n");
  }
}

try {
  await rpc("initialize", { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "tomrade-demo-seed", version: "1" } });
} catch (error) {
  console.error(`Tomrade isn't answering at ${endpoint}. Is the installed Tomrade running?\n${error.message}`);
  process.exit(1);
}
await rpc("notifications/initialized", undefined, { notify: true });

const projects = await call("list_projects", {});
const project = projects.find((p) => p.name === projectName && !p.archived);
if (!project) {
  console.error(`No project named “${projectName}”. Create it first (New project, ticket key prefix FB).`);
  process.exit(1);
}
const existing = await call("count_items", { projectId: project.id });
const total = typeof existing === "number" ? existing : existing?.total ?? existing?.count ?? 0;
if (total > 0 && !force) {
  console.error(`“${projectName}” already has ${total} items. Seed a fresh project, or pass --force to add the demo backlog anyway.`);
  process.exit(1);
}

const keys = new Map();
for (const item of ITEMS) {
  const created = await call("create_item", {
    projectId: project.id,
    requestId: `demo-seed:${project.id}:${item.slug}`,
    title: item.title,
    body: item.body,
    kind: item.kind ?? "ticket",
    status: item.status,
    priority: item.priority,
    ...(item.kind === "epic" ? {} : { workType: "coding" }),
    ...(item.parent ? { parentId: keys.get(item.parent) } : {})
  });
  const key = created?.key ?? created?.item?.key;
  keys.set(item.slug, key);
  console.log(`${key ?? "?"}  ${item.status.padEnd(7)}  ${item.title}`);
}
console.log(`\nSeeded ${ITEMS.length} items into “${projectName}”. Paste .demo/rules.md into Project settings → Rules next.`);
