// ============================================================
// 2D Floor Plan Image (PNG/JPG/WEBP) -> 3D Architectural Data
// Pure browser CV engine (works offline & on Vercel static)
// + Optional Gemini Vision API mode if user provides a key
// ============================================================

/**
 * Loads an image File/Blob into an HTMLImageElement
 */
export function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve({ img, dataUrl: reader.result });
      img.onerror = () => reject(new Error('Не удалось прочитать изображение'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('Ошибка чтения файла'));
    reader.readAsDataURL(file);
  });
}

/**
 * Analyzes a 2D floor plan image using client-side computer vision:
 * 1. Filters out colored CAD dimension lines (red/blue annotations)
 * 2. Detects dark structural walls & removes text speckle
 * 3. Extracts merged horizontal & vertical 3D wall segments
 * 4. Flood-fills interior rooms & estimates areas in m²
 */
export function parseFloorPlanCV(img, options = {}) {
  const targetAreaM2 = Number(options.targetAreaM2) || 100;
  const sensitivity = Number(options.sensitivity) || 55; // 20..85

  // 1. Draw to analysis canvas (max 150px on longest side for clean architectural resolution)
  const MAX_DIM = 150;
  const scale = Math.min(MAX_DIM / img.width, MAX_DIM / img.height, 1);
  const w = Math.max(40, Math.round(img.width * scale));
  const h = Math.max(40, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  const imgData = ctx.getImageData(0, 0, w, h).data;

  // 2. Build binary wall mask (ignoring red/blue colored dimension lines & light beige fills)
  // Higher sensitivity -> higher luminance threshold (picks up lighter gray walls)
  const lumThreshold = Math.round(90 + (sensitivity / 100) * 115); // ~110..190
  const rawWall = new Uint8Array(w * h);

  for (let i = 0; i < w * h; i++) {
    const r = imgData[i * 4];
    const g = imgData[i * 4 + 1];
    const b = imgData[i * 4 + 2];
    const a = imgData[i * 4 + 3];
    if (a < 100) continue;

    // Ignore strongly colored annotation lines (red dimensions, blue marks, etc.)
    const maxC = Math.max(r, g, b);
    const minC = Math.min(r, g, b);
    const saturation = maxC - minC;
    if (saturation > 48 && maxC > 110) continue;

    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (lum < lumThreshold) {
      rawWall[i] = 1;
    }
  }

  // 3. Denoise: keep only pixels that belong to a horizontal OR vertical line of length >= 4
  // This cleanly removes small room text labels, numbers, and furniture icons!
  const wallMask = new Uint8Array(w * h);
  const MIN_RUN = 4;

  // Horizontal runs
  for (let y = 0; y < h; y++) {
    let runStart = -1;
    for (let x = 0; x <= w; x++) {
      const isW = x < w && rawWall[y * w + x] === 1;
      if (isW && runStart === -1) runStart = x;
      if (!isW && runStart !== -1) {
        if (x - runStart >= MIN_RUN) {
          for (let rx = runStart; rx < x; rx++) wallMask[y * w + rx] = 1;
        }
        runStart = -1;
      }
    }
  }
  // Vertical runs
  for (let x = 0; x < w; x++) {
    let runStart = -1;
    for (let y = 0; y <= h; y++) {
      const isW = y < h && rawWall[y * w + x] === 1;
      if (isW && runStart === -1) runStart = y;
      if (!isW && runStart !== -1) {
        if (y - runStart >= MIN_RUN) {
          for (let ry = runStart; ry < y; ry++) wallMask[ry * w + x] = 1;
        }
        runStart = -1;
      }
    }
  }

  // 4. Find bounding box of detected walls (crop white margins)
  let minX = w, maxX = 0, minY = h, maxY = 0;
  let wallCount = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (wallMask[y * w + x]) {
        wallCount++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // Fallback if image had too few walls (e.g. very faint blueprint)
  if (wallCount < 30 || maxX - minX < 10 || maxY - minY < 10) {
    minX = Math.round(w * 0.08);
    maxX = Math.round(w * 0.92);
    minY = Math.round(h * 0.08);
    maxY = Math.round(h * 0.92);
    // Draw a fallback perimeter so user still gets a 3D shell
    for (let x = minX; x <= maxX; x++) {
      wallMask[minY * w + x] = 1;
      wallMask[maxY * w + x] = 1;
    }
    for (let y = minY; y <= maxY; y++) {
      wallMask[y * w + minX] = 1;
      wallMask[y * w + maxX] = 1;
    }
  }

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;

  // Compute real-world meters per pixel so apartment area matches targetAreaM2
  // Assume ~78% of bounding box is usable interior floor
  const aspect = cropW / cropH;
  const estBoxArea = targetAreaM2 / 0.78;
  const worldW = Math.sqrt(estBoxArea * aspect);
  const worldD = estBoxArea / worldW;
  const mPerPxX = worldW / cropW;
  const mPerPxZ = worldD / cropH;

  // 5. Extract clean merged wall segments (horizontal & vertical runs -> rectangles)
  const visitedH = new Uint8Array(w * h);
  const visitedV = new Uint8Array(w * h);
  const walls = [];

  // Horizontal wall segments
  for (let y = minY; y <= maxY; y++) {
    let x = minX;
    while (x <= maxX) {
      if (wallMask[y * w + x] && !visitedH[y * w + x]) {
        let x2 = x;
        while (x2 <= maxX && wallMask[y * w + x2] && !visitedH[y * w + x2]) x2++;
        const runLen = x2 - x;
        if (runLen >= 4) {
          // Merge downward if next rows have similar span
          let y2 = y + 1;
          while (y2 <= maxY && y2 - y < 6) {
            let matchCount = 0;
            for (let rx = x; rx < x2; rx++) {
              if (wallMask[y2 * w + rx]) matchCount++;
            }
            if (matchCount >= runLen * 0.75) {
              y2++;
            } else {
              break;
            }
          }
          for (let ry = y; ry < y2; ry++) {
            for (let rx = x; rx < x2; rx++) visitedH[ry * w + rx] = 1;
          }
          const thickPx = Math.max(1, y2 - y);
          const wx1 = (x - minX) * mPerPxX;
          const wx2 = (x2 - minX) * mPerPxX;
          const wz = ((y + y2) / 2 - minY) * mPerPxZ;
          const thickness = Math.min(0.32, Math.max(0.12, thickPx * mPerPxZ));
          const isOuter = (y <= minY + 3 || y2 >= maxY - 3);
          walls.push({ x1: wx1, z1: wz, x2: wx2, z2: wz, thickness, isOuter });
        }
        x = x2;
      } else {
        x++;
      }
    }
  }

  // Vertical wall segments
  for (let x = minX; x <= maxX; x++) {
    let y = minY;
    while (y <= maxY) {
      if (wallMask[y * w + x] && !visitedV[y * w + x]) {
        let y2 = y;
        while (y2 <= maxY && wallMask[y2 * w + x] && !visitedV[y2 * w + x]) y2++;
        const runLen = y2 - y;
        if (runLen >= 4) {
          let x2 = x + 1;
          while (x2 <= maxX && x2 - x < 6) {
            let matchCount = 0;
            for (let ry = y; ry < y2; ry++) {
              if (wallMask[ry * w + x2]) matchCount++;
            }
            if (matchCount >= runLen * 0.75) {
              x2++;
            } else {
              break;
            }
          }
          for (let rx = x; rx < x2; rx++) {
            for (let ry = y; ry < y2; ry++) visitedV[ry * w + rx] = 1;
          }
          const thickPx = Math.max(1, x2 - x);
          const wz1 = (y - minY) * mPerPxZ;
          const wz2 = (y2 - minY) * mPerPxZ;
          const wx = ((x + x2) / 2 - minX) * mPerPxX;
          const thickness = Math.min(0.32, Math.max(0.12, thickPx * mPerPxX));
          const isOuter = (x <= minX + 3 || x2 >= maxX - 3);
          walls.push({ x1: wx, z1: wz1, x2: wx, z2: wz2, thickness, isOuter });
        }
        y = y2;
      } else {
        y++;
      }
    }
  }

  // 6. Flood-fill exterior vs interior rooms!
  // Slightly dilate wallMask by 1px to close small door gaps for room segmentation
  const closedMask = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (wallMask[y * w + x]) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
              closedMask[ny * w + nx] = 1;
            }
          }
        }
      }
    }
  }

  const labelMap = new Int32Array(w * h);
  // Flood fill outside from border (label = -1)
  const queue = [];
  for (let x = 0; x < w; x++) {
    if (!closedMask[x]) { labelMap[x] = -1; queue.push(x); }
    const bIdx = (h - 1) * w + x;
    if (!closedMask[bIdx]) { labelMap[bIdx] = -1; queue.push(bIdx); }
  }
  for (let y = 0; y < h; y++) {
    const lIdx = y * w;
    if (!closedMask[lIdx]) { labelMap[lIdx] = -1; queue.push(lIdx); }
    const rIdx = y * w + (w - 1);
    if (!closedMask[rIdx]) { labelMap[rIdx] = -1; queue.push(rIdx); }
  }
  let qHead = 0;
  while (qHead < queue.length) {
    const idx = queue[qHead++];
    const cx = idx % w;
    const cy = (idx - cx) / w;
    const neighbors = [
      cx > 0 ? idx - 1 : -1,
      cx < w - 1 ? idx + 1 : -1,
      cy > 0 ? idx - w : -1,
      cy < h - 1 ? idx + w : -1
    ];
    for (const n of neighbors) {
      if (n >= 0 && !closedMask[n] && labelMap[n] === 0) {
        labelMap[n] = -1;
        queue.push(n);
      }
    }
  }

  // Flood fill interior rooms
  const rawRooms = [];
  let nextLabel = 1;
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const idx = y * w + x;
      if (!closedMask[idx] && labelMap[idx] === 0) {
        const lbl = nextLabel++;
        const rq = [idx];
        labelMap[idx] = lbl;
        let rHead = 0;
        let rMinX = x, rMaxX = x, rMinY = y, rMaxY = y;
        let sumX = 0, sumY = 0;

        while (rHead < rq.length) {
          const cur = rq[rHead++];
          const cx = cur % w;
          const cy = (cur - cx) / w;
          sumX += cx;
          sumY += cy;
          if (cx < rMinX) rMinX = cx;
          if (cx > rMaxX) rMaxX = cx;
          if (cy < rMinY) rMinY = cy;
          if (cy > rMaxY) rMaxY = cy;

          const nb = [
            cx > 0 ? cur - 1 : -1,
            cx < w - 1 ? cur + 1 : -1,
            cy > 0 ? cur - w : -1,
            cy < h - 1 ? cur + w : -1
          ];
          for (const n of nb) {
            if (n >= 0 && !closedMask[n] && labelMap[n] === 0) {
              labelMap[n] = lbl;
              rq.push(n);
            }
          }
        }

        const pxArea = rq.length;
        const areaM2 = pxArea * mPerPxX * mPerPxZ;
        if (areaM2 >= 2.2) {
          const rx1 = (rMinX - minX) * mPerPxX;
          const rx2 = (rMaxX - minX) * mPerPxX;
          const rz1 = (rMinY - minY) * mPerPxZ;
          const rz2 = (rMaxY - minY) * mPerPxZ;
          rawRooms.push({
            x1: rx1,
            z1: rz1,
            x2: rx2,
            z2: rz2,
            w: rx2 - rx1,
            d: rz2 - rz1,
            cx: (sumX / pxArea - minX) * mPerPxX,
            cz: (sumY / pxArea - minY) * mPerPxZ,
            area: Math.round(areaM2 * 10) / 10
          });
        }
      }
    }
  }

  // Classify detected rooms by area & aspect ratio
  rawRooms.sort((a, b) => b.area - a.area);
  let bedCount = 0;
  let bathCount = 0;
  const rooms = rawRooms.slice(0, 12).map((r, idx) => {
    const ratio = Math.max(r.w, r.d) / Math.max(0.5, Math.min(r.w, r.d));
    let type = 'bedroom';
    let name = '';

    if (idx === 0 && r.area >= 14) {
      type = 'living';
      name = 'Гостиная + Кухня';
    } else if (r.area <= 6.5) {
      if (ratio > 2.4) {
        type = 'hall';
        name = 'Коридор / Балкон';
      } else {
        bathCount++;
        type = 'bathroom';
        name = bathCount === 1 ? 'Санузел' : `Санузел ${bathCount}`;
      }
    } else if (ratio > 2.7 && r.area < 12) {
      type = 'hall';
      name = 'Коридор';
    } else {
      bedCount++;
      type = 'bedroom';
      name = bedCount === 1 ? 'Мастер-спальня' : `Спальня ${bedCount}`;
    }

    return { ...r, type, name };
  });

  // Create cropped blueprint canvas dataURL for optional floor reference underlay
  const cropCanvas = document.createElement('canvas');
  const cropPxW = Math.round((cropW / w) * img.width);
  const cropPxH = Math.round((cropH / h) * img.height);
  cropCanvas.width = Math.min(1024, Math.max(256, cropPxW));
  cropCanvas.height = Math.min(1024, Math.max(256, cropPxH));
  const cCtx = cropCanvas.getContext('2d');
  cCtx.drawImage(
    img,
    (minX / w) * img.width,
    (minY / h) * img.height,
    (cropW / w) * img.width,
    (cropH / h) * img.height,
    0,
    0,
    cropCanvas.width,
    cropCanvas.height
  );

  return {
    width: worldW,
    depth: worldD,
    walls,
    rooms,
    totalArea: Math.round(rooms.reduce((s, r) => s + r.area, 0) * 10) / 10 || targetAreaM2,
    blueprintDataUrl: cropCanvas.toDataURL('image/jpeg', 0.85)
  };
}
