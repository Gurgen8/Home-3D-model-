// Vercel Serverless Function & local Node handler:
// POST /api/analyze-plan
// Uses Gemini Vision to turn any 2D floor plan image into clean 3D architectural JSON.

const ARCHITECT_PROMPT = `You are a senior architectural CAD analyst. Carefully examine the uploaded 2D apartment/house floor plan image and extract an EXACT, watertight room-by-room architectural layout in meters.

CRITICAL ACCURACY RULES:
1. Origin (0, 0) is the TOP-LEFT corner of the apartment footprint. X goes LEFT → RIGHT (meters). Z goes TOP → BOTTOM (meters).
2. READ ALL PRINTED DIMENSIONS (in mm, cm, or m) and room areas (m²) on the drawing! Use those exact measurements so the layout matches the blueprint faithfully.
3. EVERY room is a rectangle { name, type, x, z, w, d, area }. Adjacent rooms MUST touch edge-to-edge cleanly (e.g., if Room A ends at x=2.7, Room B starts at x=2.7) with NO random gaps and NO overlaps!
4. Include EVERY space on the plan:
   - "living" (living room or open living+kitchen)
   - "kitchen" (if separate kitchen)
   - "bedroom" (each bedroom; include L-shaped alcoves as a second touching "bedroom" or "dressing" rect if needed)
   - "bathroom" (each bathroom/WC)
   - "hall" (entry vestibule / inner corridor)
   - "balcony" (each balcony / loggia / terrace)
5. Output ALL doors connecting rooms (and entry door) in "doors": { x, z, axis: "x"|"z", width } where (x, z) is the center of the doorway on the wall, axis="x" means the wall runs horizontally (left-right), axis="z" means the wall runs vertically (top-bottom).
6. Output ALL exterior windows / balcony glass doors in "windows": { x, z, axis: "x"|"z", width }.
7. Room names MUST be in Russian (e.g. "Гостиная + Кухня", "Мастер-спальня", "Спальня 2", "Спальня 3", "Санузел 1", "Санузел 2", "Прихожая", "Коридор", "Большой балкон", "Балкон 2").
8. DO NOT wrap balconies or empty air inside a fake rectangle. Only output the actual rooms & balconies that exist on the floor plan!

Return ONLY valid JSON (no markdown fences, no commentary):
{
  "width_m": number,
  "depth_m": number,
  "totalArea": number,
  "rooms": [
    { "name": string, "type": "living"|"kitchen"|"bedroom"|"bathroom"|"hall"|"balcony", "x": number, "z": number, "w": number, "d": number, "area": number, "hasKitchen": boolean }
  ],
  "doors": [
    { "x": number, "z": number, "axis": "x"|"z", "width": number }
  ],
  "windows": [
    { "x": number, "z": number, "axis": "x"|"z", "width": number }
  ]
}`;

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
      message: 'Добавьте ваш GEMINI_API_KEY в файл .env (локально) или в Vercel Environment Variables.'
    }));
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { imageBase64, mimeType = 'image/jpeg', targetAreaM2 = 100 } = body || {};

    if (!imageBase64) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Не передано изображение (imageBase64)' }));
      return;
    }

    const primaryModel = process.env.GEMINI_VISION_MODEL || 'gemini-3.6-flash';
    const candidateModels = [...new Set([
      primaryModel,
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-3-flash-preview',
      'gemini-3.5-flash-lite',
      'gemini-flash-lite-latest'
    ])];

    const promptText = `${ARCHITECT_PROMPT}\n\nApproximate total area hint from user (use printed plan dimensions if visible): ~${targetAreaM2} m².`;
    const payload = JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            { text: promptText },
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
        temperature: 0.15,
        responseMimeType: 'application/json'
      }
    });

    let data = null;
    let lastError = 'Ошибка ответа Gemini API';
    let lastStatus = 503;
    let usedModel = primaryModel;

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
        usedModel = model;
        break;
      }
      lastStatus = geminiRes.status;
      lastError = json?.error?.message || lastError;
      // Retry next fallback model on high demand / unavailable / not found / rate limit
      if (![404, 429, 500, 503].includes(geminiRes.status)) {
        break;
      }
    }

    if (!data) {
      res.statusCode = lastStatus;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        error: 'GEMINI_API_ERROR',
        message: `${lastError} (пробовали модели: ${candidateModels.join(', ')})`
      }));
      return;
    }

    const rawText = data?.candidates?.[0]?.content?.parts?.find(p => p.text)?.text;
    if (!rawText) {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Пустой ответ от Gemini' }));
      return;
    }

    const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(cleaned);

    // Normalize structure safely
    const result = {
      width: Number(parsed.width_m) || 12,
      depth: Number(parsed.depth_m) || 9,
      totalArea: Number(parsed.totalArea) || Number(targetAreaM2) || 100,
      rooms: Array.isArray(parsed.rooms) ? parsed.rooms : [],
      doors: Array.isArray(parsed.doors) ? parsed.doors : [],
      windows: Array.isArray(parsed.windows) ? parsed.windows : [],
      source: 'gemini'
    };

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'ANALYZE_FAILED', message: err.message }));
  }
}
