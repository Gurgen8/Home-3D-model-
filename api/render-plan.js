// Vercel Serverless Function & local Node handler:
// POST /api/render-plan
// Generates a photorealistic 3D isometric cutaway render of an uploaded floor plan in the chosen style.

const STYLE_PROMPTS = {
  light: 'Light Japandi — Warm Sand & Light Oak: creamy beige limewash walls, light oak herringbone parquet, travertine stone tiles in bathrooms/kitchen, cream bouclé sofa, slatted oak TV wall, cashmere handleless kitchen, soft golden afternoon sunlight.',
  walnut: 'Warm Minimalism — American Walnut & Greige: warm greige microcement walls, American walnut wide-plank floors, dark taupe porcelain tiles in bathrooms, taupe sofa with terracotta pillows, fluted walnut cabinetry, moody warm recessed LED lighting.',
  scandi: 'Airy Scandi-Japandi — Pale Ash, White & Sage: crisp warm off-white walls, pale bleached ash planks, light terrazzo bathroom tiles, oatmeal linen sofa with sage green accents, matte white & pale sage kitchen, lush indoor plants, bright morning daylight.',
  neoclassic: 'Modern Neoclassic / Luxury: pearl-white boiserie walls with brushed brass trim, honey oak herringbone parquet, white Calacatta gold marble in bathrooms/kitchen, deep emerald velvet sofa, brass hardware, refined bright daylight.',
  loft: 'Modern Loft / Dark Industrial: architectural gray concrete walls, warm exposed brick accents, dark smoked oak floors, dark slate bathrooms, cognac leather sectional sofa, matte black kitchen & metal shelving, warm Edison accent lighting.',
  mediterranean: 'Modern Mediterranean / Coastal Resort: sun-washed textured warm white stucco walls, light limestone & terracotta tiles, bleached oak, slipcovered white linen sofa with coastal blue & terracotta pillows, rattan chairs, potted olive trees.',
  hightech: 'High-Tech / Futuristic Minimalism: ultra-smooth cool white & matte slate-gray architectural panels, glossy light-gray microcement floors, white Italian leather modular sofa, chrome & glass furniture, glossy white & graphite kitchen, ice-blue & cool-white linear LED strips.'
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'PASTE_YOUR_GEMINI_API_KEY_HERE') {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: 'GEMINI_API_KEY_MISSING',
      message: 'Добавьте GEMINI_API_KEY в .env или Vercel Environment Variables.'
    }));
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { imageBase64, mimeType = 'image/jpeg', styleKey = 'light' } = body || {};
    if (!imageBase64) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Не передано изображение плана' }));
      return;
    }

    const styleDesc = STYLE_PROMPTS[styleKey] || STYLE_PROMPTS.light;
    const primaryModel = process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image';
    const candidateModels = [...new Set([
      primaryModel,
      'gemini-3.1-flash-image',
      'gemini-3.1-flash-lite-image',
      'gemini-3-pro-image'
    ])];

    const prompt = `Create a photorealistic 3D architectural isometric cutaway floor plan render (bird's-eye 45-degree angle, roof removed, clean light studio background) strictly preserving the exact room layout, walls, doors, windows, and balconies of the uploaded 2D floor plan image.

Interior Design Style: ${styleDesc}

Architectural visualization quality (Corona / V-Ray render), crisp soft shadows, realistic furniture and materials in every room, no text or watermarks.`;

    const payload = JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: imageBase64
              }
            }
          ]
        }
      ],
      generationConfig: {
        responseModalities: ['IMAGE', 'TEXT']
      }
    });

    let data = null;
    let lastError = 'Ошибка генерации рендера в Gemini';
    let lastStatus = 503;

    for (const model of candidateModels) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const geminiRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      });
      const json = await geminiRes.json();
      if (geminiRes.ok) {
        data = json;
        break;
      }
      lastStatus = geminiRes.status;
      lastError = json?.error?.message || lastError;
      if (![404, 429, 500, 503].includes(geminiRes.status)) break;
    }

    if (!data) {
      res.statusCode = lastStatus;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        error: 'GEMINI_IMAGE_ERROR',
        message: lastError
      }));
      return;
    }

    const parts = data?.candidates?.[0]?.content?.parts || [];
    const imgPart = parts.find(p => p.inlineData?.data);
    if (!imgPart) {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Gemini не вернул изображение' }));
      return;
    }

    const outMime = imgPart.inlineData.mimeType || 'image/png';
    const imageDataUrl = `data:${outMime};base64,${imgPart.inlineData.data}`;

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ imageDataUrl }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'RENDER_FAILED', message: err.message }));
  }
}
