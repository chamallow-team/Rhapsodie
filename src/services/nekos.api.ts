import { getLogger } from "@logtape/logtape";
import { z } from "zod";
import axios from "axios";

const logger = getLogger(["app", "services", "nekos-api"]);

const BASE_URL = "https://api.nekosapi.com/v4/";

// =================================================
//
//    Schemas
//
// =================================================

export const ImageRatingSchema = z.enum([
  "safe",
  "suggestive",
  "borderline",
  "explicit",
]);

export const ImageSchema = z.object({
  id: z.number(),
  url: z.string().url(),
  rating: ImageRatingSchema,
  color_dominant: z.array(z.number()),
  color_palette: z.array(z.array(z.number())),
  artist_name: z.string().nullable(),
  tags: z.array(z.string()),
  source_url: z.string().url().nullable(),
});

export const ApiResponseSchema = z.array(ImageSchema);

export type Image = z.infer<typeof ImageSchema>;
export type ImageRating = z.infer<typeof ImageRatingSchema>;

/**
 * @throws {Error}
 */
export async function getRandomImage(
  rating: ImageRating = "safe",
  tags: string[] = [],
  limit: number = 1,
  without_tags: string[] = [],
  artists: number[] = [],
) {
  if (limit < 1 || limit > 100) {
    throw new Error("Limit must be between 1 and 100");
  }

  const params = new URLSearchParams();
  params.set("rating", rating);
  params.set("tags", tags.join(","));
  params.set("limit", limit.toString());
  params.set("without_tags", without_tags.join(","));
  params.set("artist", artists.join(","));

  const reqUrl = new URL(`${BASE_URL}images/random?${params.toString()}`);

  const res = await axios.get(reqUrl.toString());

  if (res.status !== 200) {
    throw new Error(`Request failed with status code ${res.status}`);
  }

  const parsedData = ApiResponseSchema.safeParse(res.data);
  if (!parsedData.success) {
    logger.error(
      "Failed to validate API response: {e}",
      () => ({ e: parsedData.error.errors }),
    );

    throw new Error(
      `Failed to parse response: ${parsedData.error.message}`,
    );
  }

  return parsedData.data;
}
