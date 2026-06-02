// Langdock Slides — remote executor + HTML-template renderer.

figma.showUI(__html__, { width: 280, height: 168, themeColors: true });

let lastNode = null;
const _renderDebug = [];

figma.ui.onmessage = async (msg) => {
  if (!msg || typeof msg !== 'object') return;

  // ─── Path A: raw Figma Plugin API code (the original 'exec') ───
  if (msg.type === 'exec' && typeof msg.code === 'string') {
    const beforeIds = new Set(figma.currentPage.children.map((n) => n.id));
    const existingBoxes = figma.currentPage.children.map(bbox);
    try {
      const fn = new Function('figma', `return (async () => { ${msg.code} })();`);
      const result = await fn(figma);
      finishCreated(beforeIds, existingBoxes);
      figma.ui.postMessage({ type: 'ok', requestId: msg.requestId, result: safe(result) });
    } catch (err) {
      figma.ui.postMessage({
        type: 'err',
        requestId: msg.requestId,
        message: String(err && err.message || err),
        stack: err && err.stack
      });
    }
    return;
  }

  // ─── Path B: render a JSON tree produced by the UI's HTML walker ───
  if (msg.type === 'render-tree' && msg.tree) {
    const beforeIds = new Set(figma.currentPage.children.map((n) => n.id));
    const existingBoxes = figma.currentPage.children.map(bbox);
    _renderDebug.length = 0;
    try {
      // Load every font referenced in the tree upfront. Try requested font,
      // fall back to Inter weights when a family isn't available.
      const fontUses = collectFonts(msg.tree);
      const fontMap = new Map(); // 'family|weight|italic' → resolved FontName
      for (const u of fontUses) {
        const key = `${u.family}|${u.weight}|${u.italic}`;
        if (fontMap.has(key)) continue;
        fontMap.set(key, await resolveFont(u.family, u.weight, u.italic));
      }
      const node = await createFromTree(msg.tree, fontMap);
      figma.currentPage.appendChild(node);
      finishCreated(beforeIds, existingBoxes);
      figma.ui.postMessage({
        type: 'ok',
        requestId: msg.requestId,
        result: { id: node.id, name: node.name, _debug: _renderDebug.slice(0, 40) }
      });
    } catch (err) {
      figma.ui.postMessage({
        type: 'err',
        requestId: msg.requestId,
        message: String(err && err.message || err),
        stack: err && err.stack
      });
    }
    return;
  }

  // ─── Focus the last created node ───
  if (msg.type === 'focus' && lastNode) {
    try {
      const n = await figma.getNodeByIdAsync(lastNode.id);
      if (n && n.removed !== true) {
        figma.currentPage.selection = [n];
        figma.viewport.scrollAndZoomIntoView([n]);
      } else {
        figma.ui.postMessage({ type: 'err', message: 'Last node was removed' });
      }
    } catch (e) {
      figma.ui.postMessage({ type: 'err', message: String(e && e.message || e) });
    }
  }
};

// ─── Auto-placement + selection (shared between exec and render-tree) ───
function finishCreated(beforeIds, existingBoxes) {
  const created = figma.currentPage.children.filter((n) => !beforeIds.has(n.id));
  if (!created.length) return;

  if (existingBoxes.length) {
    const group = unionBoxes(created.map(bbox));
    const overlaps = existingBoxes.some((e) => intersects(group, e));
    if (overlaps) {
      const rightmost = existingBoxes.reduce((a, b) => (a.x + a.w > b.x + b.w ? a : b));
      const dx = rightmost.x + rightmost.w + 200 - group.x;
      const dy = rightmost.y - group.y;
      for (const n of created) { n.x += dx; n.y += dy; }
    }
  }

  const n = created[created.length - 1];
  lastNode = {
    id: n.id, name: n.name, page: figma.currentPage.name,
    x: Math.round(n.x), y: Math.round(n.y),
    width: Math.round(n.width), height: Math.round(n.height),
    count: created.length
  };
  figma.currentPage.selection = created;
  figma.viewport.scrollAndZoomIntoView(created);
  figma.ui.postMessage({ type: 'created', node: lastNode });
}

// ─── Tree → Figma nodes ───
async function createFromTree(t, fontMap) {
  if (t.type === 'text') {
    const fn = fontMap.get(`${t.fontFamily}|${t.fontWeight}|${!!t.italic}`)
            || (await resolveFont(t.fontFamily, t.fontWeight, t.italic));
    const text = figma.createText();
    // Set ALL typography props BEFORE characters.  Figma measures width when
    // characters is set, and won't re-measure if fontSize/lineHeight change
    // afterward — so the final font config has to be in place first.
    text.fontName = fn;
    text.fontSize = t.fontSize || 16;
    if (t.lineHeight) text.lineHeight = t.lineHeight;
    if (t.letterSpacing) text.letterSpacing = t.letterSpacing;
    if (t.textAlign === 'center') text.textAlignHorizontal = 'CENTER';
    else if (t.textAlign === 'right') text.textAlignHorizontal = 'RIGHT';

    if (t.constrained && t.w > 0) {
      // Fixed width, auto height.  Order: switch to HEIGHT mode first (so
      // Figma knows width is the constrained axis), resize to target width,
      // then set characters — auto-resize fills in the height.
      text.textAutoResize = 'HEIGHT';
      text.resize(t.w, 1);
    } else {
      text.textAutoResize = 'WIDTH_AND_HEIGHT';
    }

    text.characters = String(t.characters || '');
    text.fills = [{
      type: 'SOLID',
      color: { r: t.color.r, g: t.color.g, b: t.color.b },
      opacity: t.color.a != null ? t.color.a : 1
    }];
    return text;
  }

  // Frame
  const f = figma.createFrame();
  f.name = t.name || 'Frame';

  if (t.fill && t.fill.a > 0.001) {
    f.fills = [{
      type: 'SOLID',
      color: { r: t.fill.r, g: t.fill.g, b: t.fill.b },
      opacity: t.fill.a != null ? t.fill.a : 1
    }];
  } else {
    f.fills = [];
  }

  if (t.bgImage) {
    // Skip placeholder URLs (placehold.co etc.) — fetching them slows down
    // imports and they're meaningless visually. Just stub with a grey.
    if (/placehold\.co/.test(t.bgImage)) {
      f.fills = [{ type: 'SOLID', color: { r: 0.78, g: 0.78, b: 0.78 } }];
    } else {
      try {
        const img = await figma.createImageAsync(t.bgImage);
        f.fills = [{ type: 'IMAGE', scaleMode: 'FILL', imageHash: img.hash }];
      } catch (_) {
        // Fallback to grey so the slot is at least visible.
        f.fills = [{ type: 'SOLID', color: { r: 0.78, g: 0.78, b: 0.78 } }];
      }
    }
  }

  if (t.borderColor && t.borderWidth) {
    f.strokes = [{
      type: 'SOLID',
      color: { r: t.borderColor.r, g: t.borderColor.g, b: t.borderColor.b },
      opacity: t.borderColor.a != null ? t.borderColor.a : 1
    }];
    f.strokeWeight = t.borderWidth;
    f.strokeAlign = 'INSIDE';
  }
  if (t.radius) f.cornerRadius = t.radius;
  f.clipsContent = !!t.clipsContent;

  // Apply auto-layout if this frame is a flex container.
  const usingLayout = !!t.layout;
  _renderDebug.push({
    name: t.name || f.name,
    treeHasLayout: !!t.layout,
    layoutMode: t.layout && t.layout.mode,
    treeW: t.w, treeH: t.h,
    children: (t.children || []).length
  });
  if (usingLayout) {
    f.layoutMode = t.layout.mode;
    f.itemSpacing = t.layout.gap || 0;
    f.paddingTop    = t.layout.paddingTop    || 0;
    f.paddingRight  = t.layout.paddingRight  || 0;
    f.paddingBottom = t.layout.paddingBottom || 0;
    f.paddingLeft   = t.layout.paddingLeft   || 0;
    if (t.layout.justify === 'space-between') f.primaryAxisAlignItems = 'SPACE_BETWEEN';
    else if (t.layout.justify === 'center')   f.primaryAxisAlignItems = 'CENTER';
    else if (t.layout.justify === 'flex-end') f.primaryAxisAlignItems = 'MAX';
    if (t.layout.align === 'center')          f.counterAxisAlignItems = 'CENTER';
    else if (t.layout.align === 'flex-end')   f.counterAxisAlignItems = 'MAX';
    // Frame sizes itself to its w/h (fixed), not hugged.
    f.primaryAxisSizingMode = 'FIXED';
    f.counterAxisSizingMode = 'FIXED';
  }

  f.resize(Math.max(1, t.w), Math.max(1, t.h));

  for (const child of (t.children || [])) {
    const cn = await createFromTree(child, fontMap);
    f.appendChild(cn);
    if (usingLayout && child._absoluteInFlex) {
      // CSS position:absolute child — take it out of auto-layout flow,
      // preserve its real x/y from the iframe.
      try { cn.layoutPositioning = 'ABSOLUTE'; } catch (_) {}
      cn.x = child.x - t.x;
      cn.y = child.y - t.y;
      continue;
    }
    if (usingLayout) {
      // Auto-layout positions this child — never set x/y here.  Below we
      // just pick the layoutSizing mode.
      const isPrimaryV = t.layout.mode === 'VERTICAL';
      const flexFill = (child.flexGrow || 0) > 0;
      if (cn.type === 'TEXT') {
        // Width: FIXED when CSS constrained the text (max-width / width),
        // else HUG to natural content width.
        if (child.constrained && child.w > 0) cn.layoutSizingHorizontal = 'FIXED';
        else                                  cn.layoutSizingHorizontal = 'HUG';
        // Height always hugs content (textAutoResize=HEIGHT already on).
        cn.layoutSizingVertical = 'HUG';
      } else {
        // Frames: FILL when flex-grow > 0; HUG only works when the child is
        // itself auto-layout, so fall back to FIXED (preserves the resize
        // dims) for plain frames.
        const childIsAL = cn.layoutMode && cn.layoutMode !== 'NONE';
        const huggable = childIsAL ? 'HUG' : 'FIXED';
        if (isPrimaryV) {
          cn.layoutSizingVertical   = flexFill ? 'FILL' : huggable;
          cn.layoutSizingHorizontal = 'FILL';
        } else {
          cn.layoutSizingHorizontal = flexFill ? 'FILL' : huggable;
          cn.layoutSizingVertical   = 'FILL';
        }
      }
    } else {
      cn.x = child.x - t.x;
      cn.y = child.y - t.y;
    }
  }

  return f;
}

// ─── Font resolution with Inter fallback ───
async function resolveFont(family, weight, italic) {
  const style = pickStyle(weight, italic);
  // Try requested family first
  try {
    const fn = { family, style };
    await figma.loadFontAsync(fn);
    return fn;
  } catch (_) {}
  // Fall back to Inter
  const fallbacks = [
    { family: 'Inter', style },
    { family: 'Inter', style: italic ? 'Regular Italic' : 'Regular' },
    { family: 'Inter', style: 'Regular' }
  ];
  for (const fn of fallbacks) {
    try { await figma.loadFontAsync(fn); return fn; } catch (_) {}
  }
  // Last resort
  const fn = { family: 'Inter', style: 'Regular' };
  await figma.loadFontAsync(fn);
  return fn;
}

function pickStyle(weight, italic) {
  let w;
  if (weight <= 250) w = 'Thin';
  else if (weight <= 350) w = 'Light';      // STK Bureau "Book"-ish, Inter "Light"
  else if (weight <= 450) w = 'Regular';
  else if (weight <= 550) w = 'Medium';
  else if (weight <= 650) w = 'Semi Bold';
  else if (weight <= 750) w = 'Bold';
  else if (weight <= 850) w = 'Extra Bold';
  else w = 'Black';
  if (italic) {
    return w === 'Regular' ? 'Italic' : `${w} Italic`;
  }
  return w;
}

function collectFonts(tree, out) {
  out = out || [];
  if (tree.type === 'text') {
    out.push({ family: tree.fontFamily, weight: tree.fontWeight || 400, italic: !!tree.italic });
  }
  for (const child of (tree.children || [])) collectFonts(child, out);
  return out;
}

// ─── Geometry helpers ───
function bbox(n) { return { x: n.x, y: n.y, w: n.width, h: n.height }; }
function intersects(a, b) {
  return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
}
function unionBoxes(boxes) {
  const minX = Math.min(...boxes.map((b) => b.x));
  const minY = Math.min(...boxes.map((b) => b.y));
  const maxX = Math.max(...boxes.map((b) => b.x + b.w));
  const maxY = Math.max(...boxes.map((b) => b.y + b.h));
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function safe(value, depth) {
  depth = depth || 0;
  if (depth > 3) return '[…]';
  if (value == null) return value;
  const t = typeof value;
  if (t === 'string' || t === 'number' || t === 'boolean') return value;
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => safe(v, depth + 1));
  if (t === 'object') {
    if (typeof value.id === 'string' && typeof value.type === 'string') {
      return { id: value.id, type: value.type, name: value.name };
    }
    const out = {};
    let n = 0;
    for (const k of Object.keys(value)) {
      if (n++ > 20) break;
      try { out[k] = safe(value[k], depth + 1); } catch (_) { out[k] = '[unreadable]'; }
    }
    return out;
  }
  return undefined;
}
