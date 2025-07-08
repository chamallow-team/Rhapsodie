import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  CommandInteraction,
  EmbedBuilder,
  TextChannel,
} from "discord.js";

import {
  Argument,
  Command,
  CommandHandler,
  Description,
} from "../../lib/commands.ts";

import {
  addToQueue,
  getOriginalImageUrlFromPost,
  getQueueLength,
  MEDIAN_FETCH_TIME,
} from "../../services/rule34.api.ts";

@Command("rule34")
@Description("🔞 Si ca existe, c'est sur rule34")
@Argument({
  name: "query",
  description: "Votre recherche",
  type: ApplicationCommandOptionType.String,
  required: true,
})
export class EightBallCommand implements CommandHandler {
  async run(interaction: CommandInteraction): Promise<void> {
    const query = interaction.options.get("query", true)!;

    if (!(interaction.channel as TextChannel).nsfw) {
      await interaction.reply({
        content:
          "> 🔞 **Cette commande est uniquement disponible dans les salons NSFW.**",
      });
      return;
    }

    await interaction.deferReply();

    const queueLength = getQueueLength();
    const totalEstimatedFetchTime = (MEDIAN_FETCH_TIME * (queueLength + 1)) /
      1000;

    if (totalEstimatedFetchTime >= 15 * 60 * 1000) {
      await interaction.editReply({
        content:
          "> :x: **Impossible de répondre à votre demande**.\nLe temps moyen est de + de 15 minutes, veuillez réessayer plus tard.",
      });
      return;
    }

    await interaction.editReply({
      content: "> 🔎 **Recherche en cours...**\n" +
        `Temps estimé: ${totalEstimatedFetchTime}s` +
        (queueLength > 0 ? ` - ${getQueueLength()} images en attente` : ""),
    });

    addToQueue(query.value, async (images) => {
      if (images.length < 1) {
        await interaction.editReply({
          content: "> 😒 **Aucune image n'as été trouvée.**",
        });
        return;
      }

      const thumbnail = images[Math.floor(Math.random() * images.length)];
      const imageURL = await getOriginalImageUrlFromPost(thumbnail.postUrl);

      const embed = new EmbedBuilder()
        .setColor(0x242429)
        .setTitle("Résultat de votre recherche ! 🎲")
        .setURL(imageURL)
        .setImage(imageURL)
        .setDescription(
          `**${images.length}** résultats. ${
            images.length > 1
              ? "Image sélectionnée au hasard dans la liste"
              : ""
          }`,
        )
        .setTimestamp();

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Danger)
          .setEmoji("🗑️")
          .setLabel("Supprimer")
          .setCustomId("DELETE_MESSAGE"),
        new ButtonBuilder()
          .setLabel("Voir l'image originale")
          .setStyle(ButtonStyle.Link)
          .setURL(imageURL),
      );

      await interaction.editReply({
        content: null,
        embeds: [embed],
        components: [row],
      });
    });
  }
}
