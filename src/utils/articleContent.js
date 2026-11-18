/**
 * Paragraph and inline gallery distribution algorithm preserved from migration.txt (Section 12.2.A).
 */
export function distributeArticleContent(content, gallery) {
  const galleryImages = Array.isArray(gallery)
    ? gallery.map((g) => (typeof g === 'string' ? g.trim() : '')).filter(Boolean)
    : [];

  let paragraphs = content
    ? String(content)
        .split(/\n+/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0)
    : [];

  // Single-Block Sentence Grouping when a single paragraph accompanies gallery images
  if (paragraphs.length === 1 && galleryImages.length > 0) {
    const sentences = paragraphs[0]
      .split(/(?<=[.!?।])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (sentences.length > 1) {
      const targetGroups = Math.min(sentences.length, galleryImages.length + 1);
      const grouped = [];
      const baseSize = Math.floor(sentences.length / targetGroups);
      const remainder = sentences.length % targetGroups;
      let cursor = 0;

      for (let gIdx = 0; gIdx < targetGroups; gIdx++) {
        const groupLen = baseSize + (gIdx < remainder ? 1 : 0);
        grouped.push(sentences.slice(cursor, cursor + groupLen).join(' '));
        cursor += groupLen;
      }
      paragraphs = grouped;
    }
  }

  // Even Image Distribution (`imagesAfterParagraph` map)
  const imagesAfterParagraph = {};
  if (galleryImages.length > 0 && paragraphs.length > 0) {
    const P = paragraphs.length;
    const G = galleryImages.length;

    galleryImages.forEach((imgUrl, idx) => {
      let targetParaIdx;
      if (P === 1) {
        targetParaIdx = 0;
      } else if (G < P) {
        const internalBreaks = P - 1;
        const pos = Math.floor(((idx + 1) * P) / (G + 1)) - 1;
        targetParaIdx = Math.min(internalBreaks - 1, Math.max(0, pos));
      } else {
        targetParaIdx = Math.min(P - 1, Math.floor((idx * P) / G));
      }

      if (!imagesAfterParagraph[targetParaIdx]) {
        imagesAfterParagraph[targetParaIdx] = [];
      }
      imagesAfterParagraph[targetParaIdx].push({ url: imgUrl, index: idx });
    });
  }

  return {
    paragraphs,
    galleryImages,
    imagesAfterParagraph,
  };
}

export default distributeArticleContent;
