import { Provider, Video } from "../provider.ts";
import { createAudioResource } from "@discordjs/voice";
import { getLogger } from "@logtape/logtape";
import yts from "yt-search";
import ytdl from "@distube/ytdl-core";

const logger = getLogger(["app", "provider", "youtube"]);

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
      thumbnail: video.thumbnail,
      url: video.url,
      durationInSeconds: video.duration?.seconds || 0,

      getStream: function () {
        try {
          const stream = ytdl(video.url, {
            filter: "audioonly",
            quality: "highestaudio",
          });

          stream.on("error", (error) => {
            logger.error(
              "Error while streaming data from ytdl: {error}",
              { error },
            );
          });

          return createAudioResource(stream);
        } catch (error) {
          logger.error(
            "Error while creating stream from ytdl: {error}",
            { error },
          );
          throw error;
        }
      },
    };
  }
}

export const youtubeProvider = new YoutubeProvider();
