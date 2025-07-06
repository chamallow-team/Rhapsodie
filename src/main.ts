import { run } from "./app.ts";
import setupLogger from "./logger.ts";
import { getLogger } from "@logtape/logtape";

import "./interactions/commands/hello.ts";
import { readPermissions } from "./controllers/guard.ts";
import loadCommands from "./controllers/loader.ts";
import { loadConfig } from "./config.ts";

const logger = getLogger(["app", "main"]);

if (import.meta.main) {
  try {
    loadConfig();
    await setupLogger();
    await loadCommands();

    readPermissions();

    logger.info("Starting bot...");
    run();
  } catch (error) {
    logger.error(`Failed to start bot: ${error}`);
    Deno.exit(1);
  }
}
