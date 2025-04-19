import { ApplicationCommandOptionType, CommandInteraction } from "discord.js";
import {
  Argument,
  Command,
  CommandHandler,
  Description,
} from "../../lib/commands.ts";

@Command("8ball")
@Description("🎱 Posez une question et je vous répondrai !")
@Argument({
  name: "question",
  description: "Votre question",
  type: ApplicationCommandOptionType.String,
  required: true,
})
export class EightBallCommand implements CommandHandler {
  private static answers: string[] = [
    "Il est certain",
    "C'est décidément le cas",
    "Très probablement",
    "Les perspectives sont bonnes",
    "Oui",
    "Les signes indiquent que oui",
    "Mieux vaut ne pas vous le dire maintenant",
    "N'y comptez pas",
    "Ma réponse est non",
    "Mes sources disent non",
    "Les perspectives ne sont pas bonnes",
    "Très douteux",
  ];

  async run(interaction: CommandInteraction): Promise<void> {
    const question = interaction.options.get("question", true)!;

    const answer = EightBallCommand
      .answers[Math.floor(Math.random() * EightBallCommand.answers.length)];

    await interaction.reply({
      content: `> 🎱 **${interaction.user.displayName}** - ${
        question.value || "NONE"
      }\n${answer}`,
    });
  }
}
