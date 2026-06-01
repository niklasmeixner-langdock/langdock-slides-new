// Langdock Slides — remote executor for Figma Plugin API code.
//
// The LLM writes Figma Plugin API JavaScript (figma.createFrame, loadFontAsync,
// createNodeFromSvg, auto-layout, etc.). The bridge forwards that code over a
// WebSocket; this plugin runs it against the open Figma file.

figma.showUI(__html__, { width: 280, height: 168, themeColors: true });

// Track the most recently created top-level node so the UI can offer a
// jump-to link.
let lastNode = null;

figma.ui.onmessage = async (msg) => {
  if (!msg || typeof msg !== 'object') return;

  if (msg.type === 'exec' && typeof msg.code === 'string') {
    const beforeIds = new Set(figma.currentPage.children.map((n) => n.id));
    const existingBoxes = figma.currentPage.children.map(bbox);
    try {
      const fn = new Function('figma', `return (async () => { ${msg.code} })();`);
      const result = await fn(figma);

      const created = figma.currentPage.children.filter((n) => !beforeIds.has(n.id));

      // If anything new overlaps the existing canvas, shift the whole new group
      // to free space on the right (preserving relative positions).
      if (created.length && existingBoxes.length) {
        const group = unionBoxes(created.map(bbox));
        const overlaps = existingBoxes.some((e) => intersects(group, e));
        if (overlaps) {
          // Pin to the right of the rightmost existing node, at that node's y.
          // This places new content beside the outer edge of your work
          // instead of being pulled up by stray distant nodes.
          const rightmost = existingBoxes.reduce((a, b) => (a.x + a.w > b.x + b.w ? a : b));
          const safeX = rightmost.x + rightmost.w + 200;
          const safeY = rightmost.y;
          const dx = safeX - group.x;
          const dy = safeY - group.y;
          for (const n of created) { n.x += dx; n.y += dy; }
        }
      }

      if (created.length) {
        const n = created[created.length - 1];
        lastNode = {
          id: n.id,
          name: n.name,
          page: figma.currentPage.name,
          x: Math.round(n.x),
          y: Math.round(n.y),
          width: Math.round(n.width),
          height: Math.round(n.height),
          count: created.length
        };
        figma.currentPage.selection = created;
        figma.viewport.scrollAndZoomIntoView(created);
        figma.ui.postMessage({ type: 'created', node: lastNode });
      }

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

  if (msg.type === 'focus' && lastNode) {
    try {
      const node = await figma.getNodeByIdAsync(lastNode.id);
      if (node && node.removed !== true) {
        figma.currentPage.selection = [node];
        figma.viewport.scrollAndZoomIntoView([node]);
      } else {
        figma.ui.postMessage({ type: 'err', message: 'Last node was removed' });
      }
    } catch (e) {
      figma.ui.postMessage({ type: 'err', message: String(e && e.message || e) });
    }
  }
};

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
