import { CommandInteraction } from "discord.js";
import { Command, CommandHandler, Description } from "../../lib/commands.ts";
import { player_storage } from "../../controllers/music/player.ts";

@Command("skip")
@Description("🎺 Passe à la musique suivante")
export default class SkipCommand implements CommandHandler {
  async run(interaction: CommandInteraction): Promise<void> {
    const player = player_storage.get(interaction.guild?.id || "");
    if (!player) {
      await interaction.reply({
        content: "❌ **Aucune musique n'est en cours de lecture.**",
        ephemeral: true,
      });
      return;
    }

    player.skip();

    await interaction.reply({
      content: "🎶 **La musique a été sautée.**",
    });
  }
}
