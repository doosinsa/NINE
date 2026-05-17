#!/usr/bin/env node

import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const defaultOptions = {
  db: resolve(homedir(), ".n8n/database.sqlite"),
  workflowPrefix: "NINE - ",
  limit: 20,
  strict: false,
};

function main() {
  const options = parseArgs(process.argv.slice(2));

  if (!existsSync(options.db)) {
    throw new Error(`n8n database not found: ${options.db}`);
  }

  const workflows = queryJson(
    options.db,
    `
      select
        id,
        name,
        active,
        json_extract(nodes, '$[0].parameters.rule.interval[0].expression') as cron,
        json_extract(nodes, '$[1].type') as requestNodeType,
        json_extract(nodes, '$[1].parameters.method') as method,
        json_extract(nodes, '$[1].parameters.url') as url,
        json_extract(nodes, '$[1].parameters.jsonBody') as jsonBody,
        updatedAt
      from workflow_entity
      where name like ${sqlString(`${options.workflowPrefix}%`)}
      order by name;
    `,
  );

  const recentExecutions = queryJson(
    options.db,
    `
      select
        e.id,
        w.name as workflowName,
        e.status,
        e.finished,
        e.mode,
        e.startedAt,
        e.stoppedAt
      from execution_entity e
      join workflow_entity w on w.id = e.workflowId
      where w.name like ${sqlString(`${options.workflowPrefix}%`)}
      order by e.id desc
      limit ${options.limit};
    `,
  );

  const executionSummary = queryJson(
    options.db,
    `
      select
        w.name as workflowName,
        count(*) as total,
        sum(case when e.status = 'success' then 1 else 0 end) as successCount,
        sum(case when e.status != 'success' then 1 else 0 end) as nonSuccessCount,
        max(e.startedAt) as lastStartedAt,
        (
          select e2.status
          from execution_entity e2
          where e2.workflowId = w.id
          order by e2.id desc
          limit 1
        ) as lastStatus
      from workflow_entity w
      left join execution_entity e on e.workflowId = w.id
      where w.name like ${sqlString(`${options.workflowPrefix}%`)}
      group by w.id, w.name
      order by w.name;
    `,
  );

  const inactiveWorkflows = workflows.filter((workflow) => Number(workflow.active) !== 1);
  const latestFailures = executionSummary.filter((summary) => summary.lastStatus && summary.lastStatus !== "success");

  console.log(
    JSON.stringify(
      {
        db: options.db,
        workflowPrefix: options.workflowPrefix,
        workflowCount: workflows.length,
        activeWorkflowCount: workflows.length - inactiveWorkflows.length,
        inactiveWorkflowNames: inactiveWorkflows.map((workflow) => workflow.name),
        latestFailureWorkflowNames: latestFailures.map((summary) => summary.workflowName),
        workflows: workflows.map(formatWorkflow),
        executionSummary: executionSummary.map(formatExecutionSummary),
        recentExecutions: recentExecutions.map(formatExecution),
      },
      null,
      2,
    ),
  );

  if (options.strict) {
    const failures = [];

    if (workflows.length === 0) {
      failures.push(`no workflows matched prefix ${JSON.stringify(options.workflowPrefix)}`);
    }

    if (inactiveWorkflows.length > 0) {
      failures.push(`inactive workflows: ${inactiveWorkflows.map((workflow) => workflow.name).join(", ")}`);
    }

    if (latestFailures.length > 0) {
      failures.push(`latest failed workflows: ${latestFailures.map((summary) => summary.workflowName).join(", ")}`);
    }

    if (failures.length > 0) {
      throw new Error(`n8n monitor strict check failed: ${failures.join("; ")}`);
    }
  }
}

function parseArgs(args) {
  const options = { ...defaultOptions };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }

    if (!arg.startsWith("--")) {
      throw new Error(`Unexpected argument: ${arg}`);
    }

    const [rawKey, inlineValue] = arg.slice(2).split("=", 2);
    const value = inlineValue ?? args[index + 1];

    switch (rawKey) {
      case "db":
        if (!inlineValue) index += 1;
        options.db = resolve(requiredValue(rawKey, value));
        break;
      case "workflow-prefix":
        if (!inlineValue) index += 1;
        options.workflowPrefix = requiredValue(rawKey, value);
        break;
      case "limit":
        if (!inlineValue) index += 1;
        options.limit = parsePositiveInteger(rawKey, requiredValue(rawKey, value));
        break;
      case "strict":
        options.strict = parseBooleanFlag(rawKey, value, inlineValue);
        if (!inlineValue && value && !value.startsWith("--")) index += 1;
        break;
      default:
        throw new Error(`Unknown option: --${rawKey}`);
    }
  }

  return options;
}

function queryJson(db, sql) {
  const result = spawnSync("sqlite3", ["-json", db, sql], {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `sqlite3 exited with code ${result.status}`);
  }

  const output = result.stdout.trim();

  if (!output) return [];

  return JSON.parse(output);
}

function formatWorkflow(workflow) {
  return {
    id: workflow.id,
    name: workflow.name,
    active: Number(workflow.active) === 1,
    cron: workflow.cron,
    requestNodeType: workflow.requestNodeType,
    method: workflow.method,
    url: workflow.url,
    jsonBody: workflow.jsonBody || null,
    updatedAt: workflow.updatedAt,
  };
}

function formatExecutionSummary(summary) {
  return {
    workflowName: summary.workflowName,
    total: Number(summary.total ?? 0),
    successCount: Number(summary.successCount ?? 0),
    nonSuccessCount: Number(summary.nonSuccessCount ?? 0),
    lastStatus: summary.lastStatus,
    lastStartedAt: summary.lastStartedAt,
  };
}

function formatExecution(execution) {
  return {
    id: Number(execution.id),
    workflowName: execution.workflowName,
    status: execution.status,
    finished: Number(execution.finished) === 1,
    mode: execution.mode,
    startedAt: execution.startedAt,
    stoppedAt: execution.stoppedAt,
  };
}

function sqlString(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

function requiredValue(key, value) {
  if (!value || value.startsWith("--")) {
    throw new Error(`--${key} requires a value.`);
  }

  return value;
}

function parsePositiveInteger(key, value) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`--${key} must be a positive integer.`);
  }

  return parsed;
}

function parseBooleanFlag(key, value, inlineValue) {
  if (!inlineValue && (!value || value.startsWith("--"))) {
    return true;
  }

  const normalized = String(value).toLowerCase();

  if (["true", "1", "yes"].includes(normalized)) return true;
  if (["false", "0", "no"].includes(normalized)) return false;

  throw new Error(`--${key} must be a boolean flag or true/false value.`);
}

function printHelp() {
  console.log(`Usage:
  npm run n8n:monitor
  npm run n8n:monitor -- --limit 50
  npm run n8n:monitor -- --db "$HOME/.n8n/database.sqlite"

Options:
  --db                 Path to n8n SQLite database. Defaults to ~/.n8n/database.sqlite.
  --workflow-prefix    Workflow name prefix to inspect. Defaults to "NINE - ".
  --limit              Recent execution count. Defaults to 20.
  --strict             Exit non-zero if no workflows match, any workflow is inactive,
                       or any workflow's latest execution is non-success.

This command reads local n8n workflow and execution metadata only. It does not read
or print n8n API keys, provider secrets, credentials, or execution request bodies.`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
