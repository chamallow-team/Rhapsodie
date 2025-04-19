import { getLogger } from "@logtape/logtape";
import { CommandInfo, commands as localCommands } from "../lib/commands.ts";
import {
  ApplicationCommand,
  ApplicationCommandOptionData,
  Client,
  GuildResolvable,
} from "discord.js";

const logger = getLogger(["app", "commands", "register"]);

export async function registerCommands(client: Client<true>) {
  logger.info(`Registering commands...`);

  const clientCommands = await client.application.commands.fetch();
  const apiValidCommands: Set<string> = new Set();

  const asyncActions: Promise<void>[] = [];

  for (const cmdInfos of localCommands.values()) {
    const distantCommand = clientCommands
      .find((c) => c.name === cmdInfos.name);

    if (!distantCommand) {
      logger.debug(
        `Command '${cmdInfos.name}' wasn't registered`,
      );

      const action = client.application.commands.create({
        name: cmdInfos.name,
        description: cmdInfos.description,
      }).then(() => {});
      asyncActions.push(action);
    } else if (isCommandDifferent(cmdInfos, distantCommand)) {
      logger.debug(`Updating command '${cmdInfos.name}'...`);

      const action = distantCommand.edit({
        name: cmdInfos.name,
        description: cmdInfos.description,
        options: cmdInfos.arguments as ApplicationCommandOptionData[],
      }).then(() => {});
      asyncActions.push(action);
    }

    apiValidCommands.add(cmdInfos.name);
  }

  // Manage removing commands that aren't registered
  clientCommands
    .filter((c) => !apiValidCommands.has(c.name))
    .forEach(function (c) {
      logger.debug(`Removing old command '${c.name}'...`);
      asyncActions.push(c.delete().then(() => {}));
    });

  await Promise.all(asyncActions);
  logger.info("Commands registered");
}

function isCommandDifferent(
  local: CommandInfo,
  distant: ApplicationCommand<{ guild: GuildResolvable }>,
) {
  let optionsDifference = local.arguments.length !== distant.options.length;
  optionsDifference ||= local.arguments.some((arg) => {
    const distantArg = distant.options.find((opt) => opt.name === arg.name);
    if (!distantArg) return true;

    return arg.description !== distantArg.description;
  });

  return optionsDifference || local.description !== distant.description;
}
