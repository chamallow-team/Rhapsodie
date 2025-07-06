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
import { getRandomImage, type Image } from "../../services/nekos.api.ts";
import { config } from "../../config.ts";
import { rgbArrayToHexInt } from "../../utils.ts";

const BLACKLISTED_TAGS: string[] = ["tree"];

@Command("anime")
@Description("🎲 Image animé aléatoire Safe For Work")
@Argument({
  name: "type",
  description:
    "Le type d'image animé que vous voulez (par ex: safe, suggestive)",
  type: ApplicationCommandOptionType.String,
  required: false,
  choices: [
    { name: "Safe", value: "safe" },
    { name: "Suggestive", value: "suggestive" },
    { name: "Borderline", value: "borderline" },
    { name: "Explicit", value: "explicit" },
  ],
})
@Argument({
  name: "tags",
  description: "Une liste de tags anglais sans accents et séparés de ','",
  type: ApplicationCommandOptionType.String,
  required: false,
})
export class EightBallCommand implements CommandHandler {
  async run(interaction: CommandInteraction): Promise<void> {
    const rating = (interaction.options.get("type")?.value as
      | Image["rating"]
      | undefined) || "safe";

    if (
      !rating ||
      !["safe", "suggestive", "borderline", "explicit"].includes(rating)
    ) {
      await interaction.reply({
        content: "> ❌ **Vous devez sélectionner un type de contenu.**",
      });
      return;
    }

    if (!(interaction.channel as TextChannel).nsfw) {
      await interaction.reply({
        content:
          "> 🔞 **Cette commande est uniquement disponible dans les salons NSFW.**",
      });
      return;
    }

    const tags = interaction.options.get("tags")?.value as string;
    if (tags && !(/\w+((,\w+)+)?/gm).test(tags)) {
      await interaction.reply({
        content:
          "> :x: **Les tags sont invalides.**\nVeillez à avoir une liste de tags en ANGLAIS, sans accents ni espaces, et séparés par des virgules.\n\nExemple: `girl,blue_hair,tree`",
      });
      return;
    }

    await interaction.deferReply();

    try {
      const promises = [];
      const images_promise: Promise<Image[]> = getRandomImage(
        rating,
        tags ? tags.split(",").map((tag) => tag.trim().toLowerCase()) : [],
        1,
        BLACKLISTED_TAGS,
        [],
      );
      promises.push(images_promise);
      promises.push(
        interaction.editReply({
          content: "> 🔎 **Récupération de l'image...**",
        }),
      );

      await Promise.all(promises);
      const images = await images_promise;

      if (images.length < 1) {
        await interaction.editReply({
          content: "> 😒 **Aucune image n'est disponible pour le moment.**",
        });
        return;
      }

      // Réponse

      const image = images[0];

      const embed = new EmbedBuilder()
        .setColor(
          rgbArrayToHexInt(image.color_dominant as [number, number, number]) ||
            0x242429,
        )
        .setTitle("Votre image d'anime aléatoire ! 🎲")
        .setURL(image.url)
        .setImage(image.url)
        .setDescription(`Rating: **${image.rating.toUpperCase()}**`)
        .setFooter({ text: `ID: ${image.id}` })
        .setTimestamp();

      if (image.artist_name) {
        embed.addFields({
          name: "Artiste",
          value: image.artist_name,
          inline: true,
        });
      }

      if (image.tags && image.tags.length > 0) {
        const displayTags = image.tags.slice(0, 5).join(", ");
        embed.addFields({ name: "Tags", value: displayTags, inline: true });
      }

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel("Voir l'image originale")
          .setStyle(ButtonStyle.Link)
          .setURL(image.url),
        ...(image.source_url
          ? [
            new ButtonBuilder()
              .setLabel("Source Originale")
              .setStyle(ButtonStyle.Link)
              .setURL(image.source_url),
          ]
          : []),
      );

      await interaction.editReply({
        content: null,
        embeds: [embed],
        components: [row],
      });
    } catch (error) {
      await interaction.editReply({
        content: `> :x: **Une erreur est survenue : ** ${
          (error as Error).message
        }\nVeuillez contacter <@${config.contact_user_id}>`,
      });
    }
  }
}
