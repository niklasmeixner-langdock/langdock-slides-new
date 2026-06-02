# Langdock Slides — Status & Pickup Notes

Updated 2026-06-02 (second pass).  This file captures where the
renderer stands, the bugs that are still open, and the order to
attack them when work resumes.

## What this repo does

LLM (in Langdock) reads HTML templates from `templates/`, fills them with copy
sourced from `knowledge/`, and posts `{ html, slots }` to a local bridge.
The bridge (`infra/server/server.js`, port 4000) forwards to the Figma
plugin (`infra/plugin/`).  The plugin walks the HTML in a hidden iframe,
builds a JSON tree, and emits native Figma nodes (frames, text,
auto-layout, image fills).

See `CLAUDE.md` for the agent-facing summary.

## What works today

- End-to-end pipeline: HTML → iframe walker (`ui.html#walkElement`) →
  JSON tree → renderer (`code.js#createFromTree`) → Figma nodes
- Auto-layout for `display: flex` containers (VERTICAL / HORIZONTAL)
- `position: absolute` children inside flex parents
  (`layoutPositioning='ABSOLUTE'`)
- Mixed-content elements: a `<div>` with both a background AND direct text
  is split into a styled frame + a text child (used for pills, badges)
- Image fills (skips `placehold.co` and falls back to grey)
- Font fallback: requests STK Bureau Sans, falls back to Inter Semi Bold
  when STK isn't loaded in the file
- 23 archetypes in `templates/` (legacy 66 templates preserved in
  `templates/legacy/`)
- Knowledge index at `knowledge/langdock-docs-index.md`

## Archetypes confirmed rendering passably

- `centered-statement`
- `four-cards`
- `section-divider`
- `cover-minimal`
- `stacked-cards` (cards have content; minor text bugs — see below)

## Open bugs (in priority order)

All three Pass 1 bugs have a fix in this commit.  None has been
tested in Figma yet — local bridge is intentionally not running.
First action on resume is to start the bridge and re-fire
`stacked-cards` to verify.

### ~~1.  Text width too narrow → wraps unexpectedly~~  [fix in this commit]

Root cause: `getComputedStyle().width` always returns a resolved
px value, even for elements with no declared CSS width — so the
walker's `explicitW` check was a false positive for spans in flex
containers.

Fix in `infra/plugin/ui.html`: replace the `explicitW` heuristic
with an intent-based check.  An element is `constrained` only
when:

- `max-width` is set (real CSS constraint), OR
- it's a leaf that stretches to its parent's cross-axis width:
  block in normal flow, OR block in a flex-column parent (default
  align-items=stretch).

Anything else — flex-row items, inline elements, position:absolute
elements — sizes naturally in Figma.

### ~~2.  Body text reports `h=1, mode=NONE`~~  [fix in this commit]

Root cause: calling `text.resize(w, 1)` on an empty text node with
`textAutoResize='HEIGHT'` already set silently demoted the mode
back to `NONE`.

Fix in `infra/plugin/code.js`: set `characters` FIRST (under the
default `WIDTH_AND_HEIGHT` mode, so Figma measures the natural
width with the final font config), THEN switch to `HEIGHT` mode
and resize to the target width.  The current `text.height` value
is passed to `resize()` so Figma has something coherent to start
from before re-flowing.

### ~~3.  Cards' fixed height clips wrapped title text~~  [fix in this commit]

Two-part fix:

- `templates/stacked-cards.html`: `.card` now uses
  `display: flex; flex-direction: column; gap: 8px` instead of
  `position: relative`.  The walker emits an auto-layout VERTICAL
  frame; head + body + (absolute) pill all become flex children.
- `infra/plugin/code.js`: auto-layout frames now use
  `primaryAxisSizingMode='AUTO'` (was `'FIXED'`).  Primary axis
  hugs content — height grows for VERTICAL layouts, width grows
  for HORIZONTAL.  Counter axis remains FIXED to the
  iframe-measured cross dimension.  When the frame is itself a
  layout child, the parent's `layoutSizingHorizontal/Vertical`
  setter overrides.

This means the .cards container and each .card will auto-grow
their height to fit Figma's font, instead of clipping at the
walker's measured value.

## Files modified this session

Committed at end of Pass 1: bridge / template scaffolding,
flex-children x/y preservation, mixed styled-and-text containers,
image-fill fallback, knowledge index, `_renderDebug` instrumentation.

Pass 2 (this commit):

- `infra/plugin/ui.html` — `constrained` flag rewritten around
  intent (max-width / block-in-normal-flow / block-in-flex-column)
  rather than the unreliable `getComputedStyle().width` value
- `infra/plugin/code.js` — text properties set before characters;
  `characters` set under default WIDTH_AND_HEIGHT mode; HEIGHT
  mode switched on AFTER characters and resize uses `text.height`;
  auto-layout frames use `primaryAxisSizingMode='AUTO'` so height
  (or width) hugs content
- `templates/stacked-cards.html` — `.card` switched from
  `position: relative` to `display: flex; flex-direction: column;
  gap: 8px` so card height auto-grows with Figma-font content

## When resuming

1.  Start the local bridge: `cd infra/server && PORT=4000 node
    server.js` (background it).  Open the plugin in Figma.
2.  Re-render `stacked-cards` and inspect with
    `figma.getNodeByIdAsync` to verify:
    - `Langdock` and `Advanced Tools` no longer wrap
    - Card title `Subagents & Workflows` is on a single line
    - Body text has `textAutoResize='HEIGHT'` and a real
      `height` value (not 1)
    - Card and `.cards` container heights auto-grow past the
      iframe measurement
3.  If anything regresses, the most likely culprits are:
    - `parentIsFlexRow` over-detecting (e.g. inline-flex parents
      that aren't real row containers)
    - `primaryAxisSizingMode='AUTO'` collapsing some container
      whose t.h was load-bearing — the slide root is NOT
      auto-layout so it's not affected, but child auto-layout
      frames at 0 height might appear if their children all hug
      to 0
4.  Continue verifying the remaining simple archetypes:
    `text-image-right`, `image-cover-headline`, `quote`,
    `workshop-cover`, `cover-image`, `cover-frosted`,
    `stats-logos`, `numbered-steps`, `centered-definition`,
    `section-divider-portrait`, `section-divider-image`,
    `closing-testimonial`.
5.  Hand-code the visual-heavy archetypes (one Figma Plugin API
    JS file per archetype): `roi-chart`, `hub-diagram`,
    `growth-charts`, `comparison-bars`, `prompt-elements`,
    `product-ui`.
6.  Add SVG support to the renderer
    (`figma.createNodeFromSvg` for inline `<svg>` elements).
7.  Asset library wiring (user is providing files).
