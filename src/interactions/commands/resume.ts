import { CommandInteraction } from "discord.js";
import { Command, CommandHandler, Description } from "../../lib/commands.ts";
import {
  player_storage,
  PlayerStatus,
} from "../../controllers/music/player.ts";

@Command("resume")
@Description("🎵 Relance la musique qui est en train de jouer")
export default class ResumeCommand implements CommandHandler {
  async run(interaction: CommandInteraction): Promise<void> {
    const player = player_storage.get(interaction.guild?.id || "");

    if (!player || player.status !== PlayerStatus.Paused) {
      await interaction.reply({
        content: "❌ **Aucune musique n'est en pause.**",
        ephemeral: true,
      });
      return;
    }

    player.resume();
    await interaction.reply({
      content: "✅ **La musique a été relancée.**",
      ephemeral: true,
    });
  }
}
