export interface Video {
  id: string;
  channel: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: Date;
}

export abstract class Provider {
  async initialize() {}

  async querySearch(query: string): Promise<Video | null> {
    return null;
  }
}
