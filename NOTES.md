# Langdock Slides — Status & Pickup Notes

Pausing here on 2026-06-02.  This file captures where the renderer stands,
the bugs that are still open, and the order to attack them when work resumes.

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

### 1.  Text width is sometimes too narrow → wraps unexpectedly

Symptoms in latest `stacked-cards` render:

- `Advanced Tools` (nav-right) wraps to two lines
- Card title `Subagents & Workflows` wraps to two lines (w=237, two
  24px lines of height 48)

The walker measures text width in the iframe (system font), then the
renderer feeds that width into Figma where the actual font (Inter Semi
Bold) is wider.  We reordered text-property setting so `fontSize` is set
BEFORE `characters` (otherwise Figma measures at default fontSize 12 and
doesn't re-measure).  That fixed `Langdock` (one word) but multi-word
text still wraps.

Probable cause: the walker's `constrained` flag is set to TRUE for any
text inside a flex container even when the CSS doesn't intend a width
constraint (no `max-width`, no explicit `width`).  We started fixing
this with the `isAbsolute` exemption — extend the same logic to:

- inline / inline-flex / flex-item children of a flex container with
  no max-width should not be treated as constrained

### 2.  Body text in a non-flex parent reports `h=1, mode=NONE`

The renderer sets `text.textAutoResize = 'HEIGHT'` and `resize(w, 1)` for
constrained text, but the inspector reports `textAutoResize: 'NONE'` and
`height: 1` afterward.  Visually the text DOES render (height auto-grows
past the bounding box), but the node geometry is wrong, which will
break any downstream layout that reads `text.height`.

Try: set `textAutoResize='HEIGHT'` AFTER `characters` is set, not before
the `resize` call.  Or: set it, set characters, then resize.  The order
problem keeps surfacing — needs a definitive test against the Figma
plugin API behavior.

### 3.  Cards' fixed height clips wrapped title text

Once #1 is fixed, the cards' frame height (currently locked from the
walker's iframe measurement) may still be too small if the renderer's
real-font measurements push title onto two lines.  The card frame is
NOT auto-layout (CSS uses `position: relative` only), so it doesn't
auto-grow.  Solutions:

- (a) Make `.card` auto-layout VERTICAL in CSS, OR
- (b) Have the renderer detect "container of mostly-text content" and
  enable HUG sizing

Option (a) is simpler — change the template.

## Files modified this session (uncommitted)

- `infra/plugin/code.js` — text-property order fix, HEIGHT-mode handling,
  slide-relative x/y preservation for flex children's grandchildren,
  layoutSizing HUG/FIXED logic for text children of auto-layout, image
  fill fallback, `_renderDebug` instrumentation
- `infra/plugin/ui.html` — walker preserves slide-relative x/y on flex
  children, splits styled-with-text containers, `isAbsolute` exemption
  for the `constrained` flag
- `knowledge/README.md`, `knowledge/langdock-docs-index.md` — new

## When resuming

1.  Land bug #1 (the `constrained` flag is over-eager).  Re-fire
    `stacked-cards` and verify title fits on one line.
2.  Land bug #2 (body text HEIGHT mode not sticking).
3.  Either change `.card` CSS to flex-column (bug #3 fix) or add
    container-auto-grow heuristic.
4.  Continue verifying the remaining simple archetypes:
    `text-image-right`, `image-cover-headline`, `quote`,
    `workshop-cover`, `cover-image`, `cover-frosted`, `stats-logos`,
    `numbered-steps`, `centered-definition`,
    `section-divider-portrait`, `section-divider-image`,
    `closing-testimonial`.
5.  Hand-code the visual-heavy archetypes (one Figma Plugin API JS file
    per archetype): `roi-chart`, `hub-diagram`, `growth-charts`,
    `comparison-bars`, `prompt-elements`, `product-ui`.
6.  Add SVG support to the renderer
    (`figma.createNodeFromSvg` for inline `<svg>` elements).
7.  Asset library wiring (user is providing files).
