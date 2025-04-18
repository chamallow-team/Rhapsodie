import { CommandInteraction } from "discord.js";
import { Command, CommandHandler, Description } from "../../lib/commands.ts";

@Command("hello")
@Description("This is a command to say 'hello'")
export default class HelloCommand implements CommandHandler {
  async run(interaction: CommandInteraction): Promise<void> {
    await interaction.reply({
      content: `Hello, ${interaction.user.username}! 👋`,
      ephemeral: false,
    });
  }
}
