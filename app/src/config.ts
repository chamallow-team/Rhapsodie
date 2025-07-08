import { getLogger } from "@logtape/logtape";
import * as path from "node:path";
import { parse } from "@std/toml";

interface Config {
  contact_user_id: string;
}

const logger = getLogger(["app", "config"]);

export let config: Config;

export function loadConfig() {
  const configPath = path.join(
    import.meta.dirname!,
    "../",
    "config",
    "config.toml",
  );
  logger.debug(`Loading permissions from: ${configPath}`);
  const fileContent = Deno.readTextFileSync(configPath);
  if (!fileContent) {
    throw new Error(
      "Failed to read config file. Make sure the file exists and is not empty.",
    );
  }
  config = parse(fileContent) as unknown as Config;
}
