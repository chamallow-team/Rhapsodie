import { Provider, Video } from "../provider.ts";
import yts from "yt-search";

export class YoutubeProvider extends Provider {
  override async querySearch(query: string): Promise<Video | null> {
    const results = await yts(query);

    if (results.videos.length < 1) return null;

    const video = results.videos[0];

    console.log(video);

    return {
      id: video.id,
      title: video.title,
      description: video.description,
      publishedAt: video.publishedAt,
      channel: video.author.name,
      thumbnail: video.thumbnails[0].url,
    };
  }
}

export const youtubeProvider = new YoutubeProvider();
