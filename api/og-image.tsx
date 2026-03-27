import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Lazy imports to catch errors
    const satori = (await import('satori')).default;
    const { Resvg, initWasm } = await import('@resvg/resvg-wasm');
    const React = (await import('react')).default;

    // Load WASM from CDN
    try {
      const wasmRes = await fetch(
        'https://unpkg.com/@resvg/resvg-wasm@2.6.2/index_bg.wasm',
      );
      const wasmBuf = await wasmRes.arrayBuffer();
      await initWasm(wasmBuf);
    } catch {
      // Already initialized
    }

    // Load font - Noto Sans JP Bold from Google Fonts
    const fontRes = await fetch(
      'https://fonts.gstatic.com/s/notosansjp/v56/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFPYk75s.ttf',
    );
    if (!fontRes.ok) throw new Error(`Font fetch failed: ${fontRes.status}`);
    const fontData = await fontRes.arrayBuffer();

    const recipe = (req.query.recipe as string) || '今日の献立';
    const rarity = (req.query.rarity as string) || 'N';
    const calories = (req.query.calories as string) || '';
    const time = (req.query.time as string) || '';

    const RARITY_COLORS: Record<string, { bg: string; text: string }> = {
      N: { bg: '#8B7355', text: '#FFFFFF' },
      R: { bg: '#1E88E5', text: '#FFFFFF' },
      SR: { bg: '#F9A825', text: '#2D1B00' },
      SSR: { bg: '#7B1FA2', text: '#FFFFFF' },
    };
    const colors = RARITY_COLORS[rarity] || RARITY_COLORS.N;

    const metaParts: string[] = [];
    if (time) metaParts.push(`${time}分`);
    if (calories) metaParts.push(`${calories}kcal`);
    const metaText = metaParts.join('  ·  ');
    const fontSize = recipe.length > 15 ? 52 : 64;

    const element = React.createElement(
      'div',
      {
        style: {
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #FFF8F0 0%, #FFE8D6 50%, #FFF0E8 100%)',
          fontFamily: 'Noto Sans JP',
          position: 'relative',
        },
      },
      // Rarity badge
      React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            padding: '8px 24px',
            borderRadius: '20px',
            background: colors.bg,
            color: colors.text,
            fontSize: '28px',
            fontWeight: 700,
            letterSpacing: '2px',
            marginBottom: '16px',
          },
        },
        rarity,
      ),
      // Recipe name
      React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            fontSize: `${fontSize}px`,
            fontWeight: 700,
            color: '#2D1B00',
            textAlign: 'center',
            lineHeight: 1.3,
            maxWidth: '900px',
            marginBottom: '20px',
          },
        },
        recipe,
      ),
      // Meta
      metaText
        ? React.createElement(
            'div',
            { style: { display: 'flex', fontSize: '24px', color: '#8B7355' } },
            metaText,
          )
        : null,
      // Branding
      React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            position: 'absolute',
            bottom: '32px',
            alignItems: 'center',
            gap: '12px',
          },
        },
        React.createElement(
          'div',
          { style: { display: 'flex', fontSize: '28px', fontWeight: 700, color: '#FF6B35' } },
          '献立ガチャ',
        ),
      ),
    );

    const svg = await satori(element, {
      width: 1200,
      height: 630,
      fonts: [{ name: 'Noto Sans JP', data: fontData, weight: 700, style: 'normal' as const }],
    });

    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800');
    res.status(200).send(Buffer.from(pngBuffer));
  } catch (e: any) {
    res.status(500).json({ error: e.message, stack: e.stack?.split('\n').slice(0, 8) });
  }
}
