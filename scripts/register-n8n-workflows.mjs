#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";

const repoRoot = resolve(import.meta.dirname, "..");
const env = {
  ...process.env,
  ...readEnvFile(resolve(repoRoot, ".env")),
};

const baseUrl = env.N8N_BASE_URL ?? "http://localhost:5678";
const apiKey = env.N8N_API_KEY;

if (!apiKey) {
  throw new Error("N8N_API_KEY is required in .env or process env.");
}

const workflows = [
  {
    name: "NINE - Weekly EPS Collect",
    cron: "10 10 * * 0",
    request: postRequest("http://127.0.0.1:3001/api/eps/collect", {
      tickers: ["PLTR", "NVDA"],
    }),
  },
  {
    name: "NINE - Quarterly Earnings Collect",
    cron: "20 8 * * 1-5",
    request: postRequest("http://127.0.0.1:3002/api/earnings/collect"),
  },
  {
    name: "NINE - Core Briefs Collect",
    cron: "11 10 * * 0",
    request: postRequest("http://127.0.0.1:3006/api/briefs/collect"),
  },
  {
    name: "NINE - Discover Collect",
    cron: "20 10 * * 0",
    request: getRequest("http://127.0.0.1:3005/api/discover"),
  },
];

async function main() {
  const existing = await listWorkflows();
  const existingByName = new Map(existing.map((workflow) => [workflow.name, workflow]));
  const results = [];

  for (const definition of workflows) {
    const payload = buildWorkflow(definition);
    const current = existingByName.get(definition.name);

    if (current) {
      const updated = await updateWorkflow(current.id, payload);
      results.push({
        id: updated.id,
        name: updated.name,
        status: "updated",
        active: Boolean(updated.active),
      });
      continue;
    }

    const created = await createWorkflow(payload);
    results.push({
      id: created.id,
      name: created.name,
      status: "created",
      active: Boolean(created.active),
    });
  }

  console.log(JSON.stringify({ baseUrl, results }, null, 2));
}

function getRequest(url) {
  return {
    method: "GET",
    url,
  };
}

function postRequest(url, body = {}) {
  return {
    method: "POST",
    url,
    sendBody: true,
    contentType: "json",
    specifyBody: "json",
    jsonBody: JSON.stringify(body),
  };
}

function buildWorkflow({ name, cron, request }) {
  const triggerId = randomUUID();
  const commandId = randomUUID();

  return {
    name,
    nodes: [
      {
        id: triggerId,
        name: "Schedule",
        type: "n8n-nodes-base.scheduleTrigger",
        typeVersion: 1.2,
        position: [0, 0],
        parameters: {
          rule: {
            interval: [
              {
                field: "cronExpression",
                expression: cron,
              },
            ],
          },
        },
      },
      {
        id: commandId,
        name: "Call Worker API",
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 4.2,
        position: [260, 0],
        parameters: {
          ...request,
          options: {},
        },
      },
    ],
    connections: {
      Schedule: {
        main: [
          [
            {
              node: "Call Worker API",
              type: "main",
              index: 0,
            },
          ],
        ],
      },
    },
    settings: {
      executionOrder: "v1",
      timezone: "Asia/Seoul",
    },
  };
}

async function listWorkflows() {
  const data = await n8nFetch("/api/v1/workflows");

  return Array.isArray(data?.data) ? data.data : [];
}

async function createWorkflow(payload) {
  return n8nFetch("/api/v1/workflows", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function updateWorkflow(id, payload) {
  return n8nFetch(`/api/v1/workflows/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

async function n8nFetch(path, options = {}) {
  const response = await fetch(new URL(path, baseUrl), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-N8N-API-KEY": apiKey,
      ...(options.headers ?? {}),
    },
  });
  const text = await response.text();
  const json = parseJson(text);

  if (!response.ok) {
    throw new Error(`n8n API ${options.method ?? "GET"} ${path} failed with HTTP ${response.status}: ${summarize(text)}`);
  }

  return json;
}

function readEnvFile(path) {
  if (!existsSync(path)) return {};

  const parsed = {};
  const content = readFileSync(path, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");

    if (separator <= 0) continue;

    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();

    parsed[key] = unquote(rawValue);
  }

  return parsed;
}

function unquote(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function parseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function summarize(value) {
  return value.replace(/\s+/g, " ").slice(0, 300);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
