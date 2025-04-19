import { ApplicationCommandOptionType, CommandInteraction } from "discord.js";
import {
  Argument,
  Command,
  CommandHandler,
  Description,
} from "../../lib/commands.ts";
import { youtubeProvider } from "../../controllers/music/providers/youtube.ts";
import { Player } from "../../controllers/music/player.ts";

@Command("play")
@Description("🎸 Play a music")
@Argument({
  name: "recherche",
  description: "La recherche à effectuer",
  type: ApplicationCommandOptionType.String,
  required: true,
})
export class PlayCommand implements CommandHandler {
  async run(interaction: CommandInteraction): Promise<void> {
    // Check if the user is in a voice channel
    const member = this.getMember(interaction);
    if (
      !interaction.guild || !member || !member.voice.channel ||
      !member.voice.channel.joinable
    ) {
      interaction.reply({
        content:
          "❌ **Vous devez être dans un salon vocal pour utiliser cette commande.**",
        ephemeral: true,
      });
      return;
    }

    const argument = interaction.options.get("recherche", true);

    await interaction.deferReply({ ephemeral: true });

    const music = await youtubeProvider.querySearch(argument.value as string);

    if (!music) {
      await interaction.editReply({
        content: `❌ **Aucun résultat trouvé pour cette recherche:** ${
          ((argument.value || "") as string).slice(0, 512)
        }`,
      });
      return;
    }

    const player = Player.createPlayer(
      member.voice.channel,
      interaction.channel?.id || "923379258137649152",
      interaction.guild.id,
    );

    player.addMusic(music);
    await interaction.editReply({
      content: `✅ **${music.title}** a été ajouté à la file d'attente.`,
    });
  }

  private getMember(interaction: CommandInteraction) {
    if (!interaction.guild || !interaction.member) return null;
    return interaction.guild.members.cache.get(interaction.member.user.id);
  }
}
