import { ApplicationCommandData, Client, CommandInteraction } from "discord.js";
import { getLogger } from "@logtape/logtape";
import { CommandHandler, commands } from "../lib/commands.ts";
import { checkPerms } from "./guard.ts";

const logger = getLogger(["app", "commands"]);

// Store for all registered commands

/**
 * Register all commands with the Discord client
 * @param client The Discord.js client
 */
export async function registerCommands(client: Client) {
  logger.info(`Registering ${commands.size} commands with Discord...`);

  const commandsData: ApplicationCommandData[] = [];

  for (const [name, info] of commands.entries()) {
    commandsData.push({
      name,
      description: info.description || "No description provided",
    });
  }

  // Register commands with Discord
  if (client.application) {
    await client.application.commands.set(commandsData);
    logger.info(`Successfully registered ${commandsData.length} commands`);
  } else {
    logger.error(
      "Failed to register commands: client.application is not available",
    );
  }
}

/**
 * Handle an incoming command interaction
 * @param interaction The command interaction to handle
 */
export async function handleCommand(interaction: CommandInteraction) {
  const commandName = interaction.commandName;
  const commandInfo = commands.get(commandName);

  //
  //    EXISTENCE CHECK
  //

  if (!commandInfo) {
    logger.warn(`Received command ${commandName} but no handler is registered`);
    await interaction.reply({
      content: "This command is not implemented yet.",
      ephemeral: true,
    });
    return;
  }

  //
  //    PERMISSIONS
  //

  const CommandClass = commandInfo.commandClass;

  const requiredRoles = CommandClass.__guardRoles || [];
  const requiredGroups = CommandClass.__guardGroups || [];
  const allowedUsers = CommandClass.__guardUsers || [];

  const permissionChecks = [
    allowedUsers.length === 0 || allowedUsers.includes(interaction.user.id),

    requiredRoles.length === 0 ||
    checkPerms(interaction.user.id, { roles: requiredRoles }),

    requiredGroups.length === 0 ||
    checkPerms(interaction.user.id, { groups: requiredGroups }),
  ];

  if (!permissionChecks.every((check) => check)) {
    logger.warn(
      `L'utilisateur '${interaction.user.username}' a tenté d'utiliser la commande '${commandName}' sans les permissions nécessaires.`,
    );

    await interaction.reply({
      content: "Vous n'avez pas la permission d'utiliser cette commande.",
      ephemeral: true,
    });
    return;
  }

  //
  //    EXECUTE
  //

  try {
    // Instantiate the command handler
    const handler = new commandInfo.commandClass() as CommandHandler;

    // Execute the command
    await handler.run(interaction);
  } catch (error) {
    logger.error(
      `Error executing command ${commandName}: ${error}`,
    );
    await interaction.reply({
      content: "An error occurred while executing this command.",
      ephemeral: true,
    }).catch(() => {});
  }
}
