// Vercel Serverless Function & local Node handler:
// POST /api/chat-architect
// Conversational Gemini AI 3D Architect that manipulates the live 3D apartment scene.

const SYSTEM_PROMPT = `You are a friendly, expert AI 3D Interior Architect embedded inside an interactive 3D apartment viewer.
The user writes in Russian (or translit/English) to ask questions OR manipulate the live 3D apartment (change style, recolor walls/sofa/kitchen/wood/rug, toggle day/night lighting, toggle walls cutaway, fly camera to a room, add 3D furniture items, remove items).

You receive the current "sceneState" JSON containing:
- activeVariant: current style key ("light"|"walnut"|"scandi"|"neoclassic"|"loft"|"mediterranean"|"hightech")
- isNight: boolean
- isCutaway: boolean
- rooms: array of { name, type, x, z, w, d, cx, cz } in meters
- addedItems: array of user-added items { id, itemType, room, x, z }

AVAILABLE ACTIONS you can include in the "actions" array (can return 0, 1, or multiple actions):
1. { "type": "set_style", "variant": "light"|"walnut"|"scandi"|"neoclassic"|"loft"|"mediterranean"|"hightech" }
2. { "type": "set_color", "target": "wall"|"wallOuter"|"wood"|"sofa"|"cushion"|"rug"|"bedLinen"|"bedThrow"|"kitchenLower"|"kitchenUpper"|"countertop"|"metal", "hex": "#RRGGBB" }
3. { "type": "set_lighting", "mode": "day"|"night" }
4. { "type": "set_walls", "cutaway": true|false }
5. { "type": "set_labels", "visible": true|false }
6. { "type": "set_camera", "preset": "iso"|"top"|"living"|"master"|"bed2"|"bed3"|"balcony" }
7. { "type": "add_item", "itemType": "plant"|"armchair"|"sofa"|"desk"|"bed"|"lamp"|"coffee_table"|"wardrobe"|"dining_table"|"rug", "room": string, "x": number, "z": number, "color": "#RRGGBB" (optional) }
   - Place (x, z) INSIDE the requested room's bounds (near room cx, cz with slight offset so it doesn't sit outside the room).
8. { "type": "remove_item", "target": "last"|"all_added"|"plant"|"armchair"|"sofa"|"desk"|"bed"|"lamp"|"coffee_table"|"wardrobe"|"dining_table"|"rug"|"tv_wall" }
   - Removes both AI-added items AND existing scene objects of that category (e.g. target="plant" removes ALL plants/flowers in the apartment!).
9. { "type": "show_item", "target": "plant"|"bed"|"lamp"|"sofa"|"tv_wall"|"rug" }
10. { "type": "restore_default_furniture" }

RULES:
- Always reply concisely in Russian in the "reply" field explaining what you changed (or answering their design question).
- If the user asks to change a color, pick a tasteful architectural hex color matching what they requested.
- Return ONLY valid JSON (no markdown fences):
{
  "reply": string,
  "actions": [ ... ]
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
      message: 'Добавьте GEMINI_API_KEY в .env или Vercel Environment Variables.'
    }));
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { message, history = [], sceneState = {} } = body || {};

    if (!message || !String(message).trim()) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Пустое сообщение' }));
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

    const recentHistory = Array.isArray(history) ? history.slice(-6) : [];
    const contents = [
      ...recentHistory.map(h => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: String(h.text || '') }]
      })),
      {
        role: 'user',
        parts: [
          {
            text: `CURRENT_SCENE_STATE:\n${JSON.stringify(sceneState)}\n\nUSER_MESSAGE:\n${message}`
          }
        ]
      }
    ];

    const payload = JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig: {
        temperature: 0.25,
        responseMimeType: 'application/json'
      }
    });

    let data = null;
    let lastError = 'Ошибка Gemini API';
    let lastStatus = 503;

    for (const model of candidateModels) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      });
      const json = await r.json();
      if (r.ok) {
        data = json;
        break;
      }
      lastStatus = r.status;
      lastError = json?.error?.message || lastError;
      if (![404, 429, 500, 503].includes(r.status)) break;
    }

    if (!data) {
      res.statusCode = lastStatus;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'GEMINI_CHAT_ERROR', message: lastError }));
      return;
    }

    const rawText = data?.candidates?.[0]?.content?.parts?.find(p => p.text)?.text || '{}';
    const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(cleaned);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      reply: parsed.reply || 'Готово!',
      actions: Array.isArray(parsed.actions) ? parsed.actions : []
    }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'CHAT_FAILED', message: err.message }));
  }
}
