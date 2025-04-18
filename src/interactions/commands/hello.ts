import { CommandInteraction } from "discord.js";
import {
  Command,
  CommandHandler,
  Description,
  GuardRoles,
} from "../../lib/commands.ts";

@Command("hello")
@Description("This is a command to say 'hello'")
@GuardRoles("admin")
export default class HelloCommand implements CommandHandler {
  async run(interaction: CommandInteraction): Promise<void> {
    await interaction.reply({
      content: `Hello, ${interaction.user.username}! 👋`,
      ephemeral: false,
    });
  }
}
