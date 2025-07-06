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
    "config.toml",
  );
  logger.debug(`Loading permissions from: ${configPath}`);
  config = parse(Deno.readTextFileSync(configPath)) as unknown as Config;
}
