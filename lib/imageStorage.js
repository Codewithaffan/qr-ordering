import { optionalUrl } from "../utils/validators.js";

/**
 * Image storage seam.
 *
 * Today product images are plain URLs (validated http/https). To move to Cloudinary/S3 later,
 * change ONLY this file: upload the incoming file/data-URL here and return the hosted URL.
 * Services and the UI already treat `image` as an opaque URL string.
 */
export function resolveImageUrl(input) {
  return optionalUrl(input, "image");
}
