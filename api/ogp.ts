import type { VercelRequest, VercelResponse } from '@vercel/node';

const SITE_NAME = '献立ガチャ';
const BASE_URL = 'https://kondate-nu.vercel.app';

const DEFAULT_TITLE = '献立ガチャ - 今日のごはん、ガチャで決めよう！';
const DEFAULT_DESCRIPTION =
  '毎日の献立に迷ったら、ガチャを回そう！AIが季節の食材を活かしたレシピを提案。レア度付きで楽しく料理。';

const TYPE_LABELS: Record<string, string> = {
  main: '主菜',
  side: '副菜',
  soup: '汁物',
};

function generateOgImageUrl(title: string, type?: string): string {
  const params = new URLSearchParams({ recipe: title });
  return `${BASE_URL}/api/og-image?${params.toString()}`;
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { title, description, type, path } = req.query;

  const ogTitle = typeof title === 'string' && title
    ? `${title} | ${SITE_NAME}`
    : DEFAULT_TITLE;

  const ogDescription = typeof description === 'string' && description
    ? description
    : DEFAULT_DESCRIPTION;

  const ogType = typeof type === 'string' ? type : undefined;
  const typeLabel = ogType && TYPE_LABELS[ogType] ? `【${TYPE_LABELS[ogType]}】` : '';

  const displayTitle = typeLabel ? `${typeLabel} ${ogTitle}` : ogTitle;

  const ogUrl = typeof path === 'string' && path
    ? `${BASE_URL}${path}`
    : BASE_URL;

  const ogImage = generateOgImageUrl(displayTitle, ogType);

  const html = `<!DOCTYPE html>
<html lang="ja" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(displayTitle)}</title>

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />
  <meta property="og:title" content="${escapeHtml(displayTitle)}" />
  <meta property="og:description" content="${escapeHtml(ogDescription)}" />
  <meta property="og:url" content="${escapeHtml(ogUrl)}" />
  <meta property="og:image" content="${escapeHtml(ogImage)}" />
  <meta property="og:image:width" content="1024" />
  <meta property="og:image:height" content="1024" />
  <meta property="og:locale" content="ja_JP" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(displayTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(ogDescription)}" />
  <meta name="twitter:image" content="${escapeHtml(ogImage)}" />

  <!-- Redirect non-crawler browsers to the actual app -->
  <meta http-equiv="refresh" content="0;url=${escapeHtml(ogUrl)}" />
</head>
<body>
  <p>Redirecting to <a href="${escapeHtml(ogUrl)}">${escapeHtml(displayTitle)}</a>...</p>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  res.status(200).send(html);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
