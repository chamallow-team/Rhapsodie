import { getLogger } from "@logtape/logtape";
import { CommandInteraction } from "npm:discord.js@14.18.0/typings/index.d.ts";

export const commands: Map<string, CommandInfo> = new Map();

const logger = getLogger(["lib", "commands"]);

// Interface for command metadata
interface CommandInfo {
  name: string;
  description: string;
  commandClass: any;
}

// Interface that command classes should implement
export interface CommandHandler {
  run(interaction: CommandInteraction): Promise<void>;
}

/**
 * Command decorator - registers a class as a slash command
 * @param name The name of the command (as a string or in an array)
 */
export function Command(name: string) {
  const commandName = Array.isArray(name) ? name[0] : name;

  // deno-lint-ignore no-explicit-any
  return function (target: any) {
    const commandInfo = commands.get(commandName) || {
      name: commandName,
      description: "",
      commandClass: target,
    };

    // If there's a description stored on the class (from @Description),
    // use it now
    if (target.__commandDescription) {
      commandInfo.description = target.__commandDescription;
    }

    // Update the command class
    commandInfo.commandClass = target;

    // Store the command info
    commands.set(commandName, commandInfo);

    logger.debug(`Command registered: ${commandName}`);

    return target;
  };
}

/**
 * Description decorator - adds a description to a command
 * @param description The description of the command
 */
export function Description(description: string) {
  return function (target: any) {
    // Find the command this class is registered for
    for (const [name, info] of commands.entries()) {
      if (info.commandClass === target) {
        // Update the description
        info.description = description;
        logger.debug(`Description added to command ${name}: ${description}`);
        break;
      }
    }

    // If the command hasn't been registered yet with @Command
    // We'll store the description temporarily on the class
    target.__commandDescription = description;

    return target;
  };
}
