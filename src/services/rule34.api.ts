const QUERY_URL = "https://rule34.us/index.php";

import axios from "axios";

// https://rule34.us/index.php?r=posts/index&q=raphtalia

const IMAGE_URL_MATCHER =
  /<img\s+src="(https:\/\/img2\.rule34\.us\/thumbnails\/\w+\/\w+\/\w+\.\w+)"/gm;

/**
 * The median time to fetch one page, in milliseconds
 */
export const MEDIAN_FETCH_TIME: number = 200;

interface QueueItem {
  query: string;
  callback: (images: string[]) => void;
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
  callback: (images: string[]) => void,
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

  while (INTERNAL_QUEUE.length > 0) {
    const n = Date.now();

    const item = INTERNAL_QUEUE.shift();
    if (!item) {
      is_queue_running = false;
      return;
    }

    const { query, callback } = item;
    getImages(query)
      .then(callback)
      .catch(console.error);

    const end = Date.now();
    const elapsed = end - n;
    if (elapsed < MEDIAN_FETCH_TIME) {
      setTimeout(iter_queue, MEDIAN_FETCH_TIME - elapsed);
      return;
    }
  }

  is_queue_running = false;
}

async function getImages(search_query: string) {
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

  return extractImagesFromHTML(res.data);
}

/**
 * Extracts all image URLs from the given HTML string.
 *
 * @param html - The HTML string to search for image URLs.
 * @return An array of image URLs found within the provided HTML string.
 */
function extractImagesFromHTML(html: string): string[] {
  return Array.from(html.matchAll(IMAGE_URL_MATCHER)).map((match) => (
    match[1]
  ));
}
