import { readdirSync } from "node:fs";
import { join } from "node:path";
import { getLogger } from "@logtape/logtape";

const logger = getLogger(["app", "loader"]);

const loadCommands = async (
  commandsPath = join(import.meta.dirname!, "../interactions/commands"),
) => {
  const commandFiles = readdirSync(commandsPath)
    .filter((file) => file.endsWith(".ts"));

  const asyncActions = [];

  for (const file of commandFiles) {
    const p = join(commandsPath, file);

    if (Deno.lstatSync(p).isDirectory) {
      asyncActions.push(loadCommands(p));
    } else {
      const fileUrl = new URL(`file://${p}`).href;
      asyncActions.push(import(fileUrl));
      logger.debug(`Command '${file}' loaded.`);
    }
  }

  await Promise.all(asyncActions);
};

export default loadCommands;
