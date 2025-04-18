import { Client, Events } from "discord.js";

export async function run() {
  if (!Deno.env.has("INTENTS")) throw new NoIntents();
  const intents = Number.parseInt(Deno.env.get("INTENTS")!);
  if (isNaN(intents!)) throw new InvalidIntents();

  const client = new Client({
    intents: intents,
  });

  client.once(Events.ClientReady, (c) => {
    console.log("Ready!");
  });

  const token = Deno.env.get("TOKEN");
  if (!token) throw new NoTokenFound();

  await client.login(token);
}

class NoTokenFound extends Error {
  constructor() {
    super("No token found in environment variables");
  }
}

class InvalidIntents extends Error {
  constructor() {
    super("Invalid intents found in environment variables");
  }
}

class NoIntents extends Error {
  constructor() {
    super("No intents found in environment variables");
  }
}
