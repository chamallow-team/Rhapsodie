import { ApplicationCommandOptionType, CommandInteraction } from "discord.js";
import {
  Argument,
  Command,
  CommandHandler,
  Description,
} from "../../lib/commands.ts";
import { player_storage } from "../../controllers/music/player.ts";

@Command("volume")
@Description("🔊 Modifier le volume de la musique")
@Argument({
  name: "volume",
  description: "Le volume de la musique",
  required: true,
  type: ApplicationCommandOptionType.Number,
})
export class VolumeCommand implements CommandHandler {
  async run(interaction: CommandInteraction): Promise<void> {
    const volume = interaction.options.get("volume", true);
    if (!volume || isNaN(volume.value as number)) {
      await interaction.reply({
        content: "❌ **Le volume doit être un nombre.**",
        ephemeral: true,
      });
      return;
    }
    const parsedVolume = parseFloat(volume.value as string);
    if (parsedVolume < 0 || parsedVolume > 200) {
      await interaction.reply({
        content: "❌ **Le volume doit être entre 0 et 200.**",
        ephemeral: true,
      });
      return;
    }

    const player = player_storage.get(interaction.guild?.id || "");
    if (!player) {
      await interaction.reply({
        content: "❌ **Aucune musique n'est en cours de lecture.**",
        ephemeral: true,
      });
      return;
    }

    if (volume) {
      try {
        player.setVolume(parsedVolume / 100);
        await interaction.reply({
          content: `🔊 **Le volume a été modifié à** ${parsedVolume}%`,
          ephemeral: true,
        });
      } catch (error) {
        await interaction.reply({
          content:
            `❌ **Une erreur est survenue en modifiant le volume**\n${error}`,
          ephemeral: true,
        });
        return;
      }
    }
  }
}
