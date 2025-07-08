import { ButtonInteraction } from "discord.js";

export async function handleButton(interaction: ButtonInteraction) {
  if (interaction.customId === "DELETE_MESSAGE") {
    const clearContent = () =>
      interaction.message.edit({ content: "> 🗑️ **Contenu supprimé.**" });

    if (interaction.message.deletable) {
      await interaction.message.delete().catch(clearContent);
    } else {
      await clearContent();
    }
  }
}
