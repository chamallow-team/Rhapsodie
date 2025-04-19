import { CommandInteraction } from "discord.js";
import { Command, CommandHandler, Description } from "../../lib/commands.ts";
import {
  player_storage,
  PlayerStatus,
} from "../../controllers/music/player.ts";

@Command("pause")
@Description("🎵 Met en pause la musique qui est en train de jouer")
export default class PauseCommand implements CommandHandler {
  async run(interaction: CommandInteraction): Promise<void> {
    const player = player_storage.get(interaction.guild?.id || "");

    if (
      !player ||
      ![PlayerStatus.Playing, PlayerStatus.Paused].includes(player.status)
    ) {
      await interaction.reply({
        content: "❌ **Aucune musique n'est en cours de lecture.**",
        ephemeral: true,
      });
      return;
    }

    if (player.status === PlayerStatus.Paused) {
      await interaction.reply({
        content: "❌ **La musique est déjà en pause.**",
        ephemeral: true,
      });
      return;
    }

    player.pause();
    await interaction.reply({
      content: "✅ **La musique a été mise en pause.**",
      ephemeral: true,
    });
  }
}
