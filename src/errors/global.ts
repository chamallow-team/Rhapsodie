export class NoTokenFound extends Error {
  constructor() {
    super("No token found in environment variables");
  }
}

export class InvalidIntents extends Error {
  constructor() {
    super("Invalid intents found in environment variables");
  }
}

export class NoIntents extends Error {
  constructor() {
    super("No intents found in environment variables");
  }
}
