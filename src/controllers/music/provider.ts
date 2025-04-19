import { AudioResource } from "@discordjs/voice";

export interface Video {
  id: string;
  channel: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: Date;
  url?: string;
  /**
   * Duration in seconds
   */
  durationInSeconds: number;

  getStream: () => Promise<AudioResource>;
}

export abstract class Provider {
  async initialize() {}

  async querySearch(query: string): Promise<Video | null> {
    return null;
  }
}
