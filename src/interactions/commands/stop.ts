import { CommandInteraction } from "discord.js";
import { Command, CommandHandler, Description } from "../../lib/commands.ts";
import {
  player_storage,
  PlayerStatus,
} from "../../controllers/music/player.ts";

@Command("stop")
@Description("🎵 Arrête la musique actuelle et pause le player")
export default class StopCommand implements CommandHandler {
  async run(interaction: CommandInteraction): Promise<void> {
    const player = player_storage.get(interaction.guild?.id || "");

    if (!player || player.status !== PlayerStatus.Playing) {
      await interaction.reply({
        content: "❌ **Aucune musique n'est en cours de lecture.**",
        ephemeral: true,
      });
      return;
    }

    player.stop();
    await interaction.reply({
      content: "✅ **La musique a été arrêtée.**",
      ephemeral: true,
    });
  }
}
