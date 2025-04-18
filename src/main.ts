import { run } from "./app.ts";
import setupLogger from "./logger.ts";
import { getLogger } from "@logtape/logtape";

// Import command files to register decorators
// This is a simple import for the example, but in a real application
// you might want to dynamically load all files in the commands directory
import "./interactions/commands/hello.ts";

const logger = getLogger(["app", "main"]);

if (import.meta.main) {
  try {
    // Setup the logger system before anything
    await setupLogger();
    logger.info("Starting bot...");
    await run();
  } catch (error) {
    logger.error("Failed to start bot:", error);
    Deno.exit(1);
  }
}
