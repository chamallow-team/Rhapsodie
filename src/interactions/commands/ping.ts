import { Command, CommandHandler, Description } from "../../lib/commands.ts";
import { CommandInteraction } from "discord.js";

@Command("ping")
@Description("Permet d'obtenir la latence du bot")
export default class Ping implements CommandHandler {
  async run(interaction: CommandInteraction): Promise<void> {
    await interaction.reply({
      content: `🏓 **Latence:** ${Math.round(interaction.client.ws.ping)}ms`,
      ephemeral: false,
    });
  }
}
