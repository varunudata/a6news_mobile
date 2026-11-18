/**
 * Extracts a YouTube video ID from standard watch, short, embed, /v/, and Shorts URLs.
 * Pattern preserved from migration.txt (Section 12.2.B).
 */
export const getYoutubeVideoId = (url) => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  const videoIdMatch = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([^&?\n/]+)/
  );
  return videoIdMatch && videoIdMatch[1] ? videoIdMatch[1] : null;
};

export default getYoutubeVideoId;
