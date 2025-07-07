const QUERY_URL = "https://rule34.us/index.php";

import axios from "axios";

// https://rule34.us/index.php?r=posts/index&q=raphtalia

const THUMBNAIL_AND_POST_URL_MATCHER =
  /<a[^>]+href="(https:\/\/rule34\.us\/index\.php\?r=posts\/view&amp;id=\d+)"[^>]*>\s*<img\s+src="(https:\/\/img\d?\.rule34\.us\/thumbnails\/\w+\/\w+\/[\w-]+\.\w+)"[^>]*>/gm;

const ORIGINAL_IMAGE_URL_MATCHER =
  /https:\/\/img2\.rule34\.us\/images\/\w+\/\w+\/\w+\.\w+/gm;

/**
 * The median time to fetch one page, in milliseconds
 */
export const MEDIAN_FETCH_TIME: number = 200;

interface ThumbnailData {
  thumbnailUrl: string;
  postUrl: string;
}

interface QueueItem {
  query: string;
  callback: (thumbnailsData: ThumbnailData[]) => void;
}

const INTERNAL_QUEUE: QueueItem[] = [];
let is_queue_running = false;

/**
 * Adds a query and its associated callback function to the processing queue.
 *
 * @param query - The search query to be processed.
 * @param callback - A function to handle the resulting array of image URLs.
 * @return This function does not return a value.
 */
export function addToQueue(
  query: string,
  callback: (thumbnailsData: ThumbnailData[]) => void,
) {
  INTERNAL_QUEUE.push({ query, callback });
  if (!is_queue_running) {
    iter_queue();
  }
}

export function getQueueLength(): number {
  return INTERNAL_QUEUE.length;
}

/**
 * Processes items in the INTERNAL_QUEUE, executing each item's query and callback in sequence.
 * The method ensures that processing respects the MEDIAN_FETCH_TIME to manage timing between requests.
 *
 * @return This function does not return a value.
 */
function iter_queue() {
  is_queue_running = true;

  const processNext = () => {
    if (INTERNAL_QUEUE.length === 0) {
      is_queue_running = false;
      return;
    }

    const n = Date.now();
    const item = INTERNAL_QUEUE.shift();

    if (!item) {
      is_queue_running = false;
      return;
    }

    const { query, callback } = item;
    fetchThumbnailsAndPostUrls(query)
      .then(callback)
      .catch(console.error)
      .finally(() => {
        const end = Date.now();
        const elapsed = end - n;
        const delay = Math.max(0, MEDIAN_FETCH_TIME - elapsed);
        setTimeout(processNext, delay);
      });
  };

  processNext();
}

async function fetchThumbnailsAndPostUrls(
  search_query: string,
): Promise<ThumbnailData[]> {
  if (search_query.length < 1) {
    throw new Error("Search query must be at least 1 character long");
  }

  const query = new URLSearchParams();
  query.set("r", "posts/index");
  query.set("q", search_query);

  const prepared = new URL(`${QUERY_URL}?${query.toString()}`);

  const res = await axios.get(prepared.toString());

  if (res.status !== 200) {
    throw new Error(`Request failed with status code ${res.status}`);
  }

  return extractThumbnailsAndPostUrlsFromHTML(res.data);
}

/**
 * Extracts thumbnail URLs and their associated post URLs from the given HTML string.
 *
 * @param html - The HTML string to search for.
 * @returns An array of objects, each containing a thumbnailUrl and its corresponding postUrl.
 */
function extractThumbnailsAndPostUrlsFromHTML(html: string): ThumbnailData[] {
  const matches = Array.from(html.matchAll(THUMBNAIL_AND_POST_URL_MATCHER));
  return matches.map((match) => ({
    postUrl: match[1].replace(/&amp;/, "&"),
    thumbnailUrl: match[2],
  }));
}

/**
 * Fetches the HTML content of a given URL.
 * @param url - The URL to fetch.
 * @returns A promise that resolves with the HTML content as a string.
 * @throws Error if the request fails.
 */
async function fetchHtml(url: string): Promise<string> {
  const res = await axios.get(url);
  if (res.status !== 200) {
    throw new Error(`Request to ${url} failed with status code ${res.status}`);
  }
  return res.data;
}

/**
 * Retrieves the URL of the original image from a Rule34.us post page.
 *
 * @param postUrl - The URL of the Rule34.us post page.
 * @returns A promise that resolves with the URL of the original image, or null if not found.
 */
export async function getOriginalImageUrlFromPost(
  postUrl: string,
): Promise<string | null> {
  try {
    const html = await fetchHtml(postUrl);
    const match = html.match(ORIGINAL_IMAGE_URL_MATCHER);

    if (match && match[1]) {
      return match[1];
    }
    return null;
  } catch (error) {
    console.error(`Error fetching or parsing post page ${postUrl}:`, error);
    return null;
  }
}

/**
 * Fetches images for a given query and returns a random full image URL.
 * This now involves two steps: getting post URLs, then fetching the image from a random post URL.
 *
 * @param query - The search query.
 * @returns A Promise that resolves with a random full image URL, or null if no images are found.
 */
export async function getRandomOriginalImageFromQuery(
  query: string,
): Promise<string | null> {
  return new Promise((resolve, reject) => {
    addToQueue(query, async (thumbnailsData: ThumbnailData[]) => {
      if (thumbnailsData.length === 0) {
        resolve(null);
        return;
      }

      // Prenez un post au hasard parmi les résultats initiaux
      const randomIndex = Math.floor(Math.random() * thumbnailsData.length);
      const randomPostUrl = thumbnailsData[randomIndex].postUrl;

      // Récupérez l'URL de l'image originale à partir de la page du post
      try {
        const originalImageUrl = await getOriginalImageUrlFromPost(
          randomPostUrl,
        );
        resolve(originalImageUrl);
      } catch (error) {
        reject(error);
      }
    });
  });
}
