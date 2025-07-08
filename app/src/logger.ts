import { configure, getConsoleSink } from "@logtape/logtape";

/**
 * Get the lowest log level for the application based on the NODE_ENV environment variable.
 * @returns The lowest log level for the application.
 */
function getAppLoggerLowestLevel() {
  switch (Deno.env.get("NODE_ENV")) {
    case "dev":
      return "warning";
    case "test":
      return "info";
    default:
      return "debug";
  }
}

export default async function setupLogger() {
  await configure({
    sinks: { console: getConsoleSink() },
    loggers: [
      {
        category: ["logtape", "meta"],
        lowestLevel: "warning",
        sinks: ["console"],
      },
      {
        category: "app",
        lowestLevel: getAppLoggerLowestLevel(),
        sinks: ["console"],
      },
    ],
    filters: {},
  });
}
