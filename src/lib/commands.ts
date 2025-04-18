import { getLogger } from "@logtape/logtape";
import { CommandInteraction } from "npm:discord.js@14.18.0/typings/index.d.ts";
import { Permissions } from "../controllers/guard.ts";

export const commands: Map<string, CommandInfo> = new Map();

const logger = getLogger(["lib", "commands"]);

interface CommandInfo {
  name: string;
  description: string;
  commandClass: any;
}

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

    if (target.__commandDescription) {
      commandInfo.description = target.__commandDescription;
    }

    commandInfo.commandClass = target;

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
    for (const [name, info] of commands.entries()) {
      if (info.commandClass === target) {
        info.description = description;
        logger.debug(`Description added to command ${name}: ${description}`);
        break;
      }
    }

    target.__commandDescription = description;

    return target;
  };
}

interface User {
  roles: string[];
  groups: string[];
  permissions: Permissions;
}

type RoleGuard = string | string[];
type GroupGuard = string | string[];
type UserGuard = string | string[];

export function GuardRoles(roles: RoleGuard = []) {
  const roleArray = Array.isArray(roles) ? roles : [roles];
  return function (target: any) {
    target.__guardRoles = roleArray;
    return target;
  };
}

export function GuardGroups(groups: GroupGuard = []) {
  const groupArray = Array.isArray(groups) ? groups : [groups];
  return function (target: any) {
    target.__guardGroups = groupArray;
    return target;
  };
}

export function GuardUser(users: UserGuard = []) {
  const userArray = Array.isArray(users) ? users : [users];
  return function (target: any) {
    target.__guardUsers = userArray;
    return target;
  };
}
