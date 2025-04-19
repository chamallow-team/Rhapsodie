import { Client, Events, Interaction } from "discord.js";
import { InvalidIntents, NoIntents, NoTokenFound } from "./errors/global.ts";
import { getLogger } from "@logtape/logtape";
import { handleCommand } from "./controllers/command.ts";
import { registerCommands } from "./controllers/register.ts";

const logger = getLogger(["app", "global"]);

export function run() {
  logger.info("Initializing...");
  // Get the intents from the environment variables
  if (!Deno.env.has("INTENTS")) throw new NoIntents();
  const intents = Number.parseInt(Deno.env.get("INTENTS")!);
  if (isNaN(intents!)) throw new InvalidIntents();

  const client = new Client({
    intents: intents,
  });

  logger.info("Defining events...");

  client.once(Events.ClientReady, async (c) => {
    logger.info(`Client ready! Logged in as ${c.user.tag}`);

    await registerCommands(c);
    // await registerCommands(client);
  });

  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    // We don't give a fuck about bot interactions
    if (interaction.user.bot) return;

    if (interaction.isChatInputCommand()) {
      await handleCommand(interaction);
    }
  });

  // Get the token and log in the bot
  const token = Deno.env.get("TOKEN");
  if (!token) throw new NoTokenFound();

  client.login(token);
}
