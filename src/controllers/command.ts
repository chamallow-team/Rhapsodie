import { ApplicationCommandData, Client, CommandInteraction } from "discord.js";
import { getLogger } from "@logtape/logtape";
import { CommandHandler, commands } from "../lib/commands.ts";

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

  if (!commandInfo) {
    logger.warn(`Received command ${commandName} but no handler is registered`);
    await interaction.reply({
      content: "This command is not implemented yet.",
      ephemeral: true,
    });
    return;
  }

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
