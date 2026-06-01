# Templates

One HTML file per Figma slide master from the Slides-Playground
(`SM-01` through `SM-66`). Each file is the **design source** the LLM reads
when building a slide for a customer.

## Conventions

- **Self-contained, browser-previewable.** Open any `.html` in a browser to
  see the slide rendered at exactly 1920×1080 px. No external CSS, no JS.
- **Token values inline from `/styleguide.md`.** Colors, font sizes, line
  heights, tracking — all match the playground exactly (with fallback to
  Inter when `STK Bureau Sans` isn't loaded).
- **Replaceable elements carry `data-slot="<name>"`.** Anything wrapped this
  way is content the LLM should swap when building a real slide. Anything
  without is structural.
- **Top-of-file comment names the slots and gives character budgets** so the
  LLM doesn't overflow the layout.

## File naming

`sm-XX.html` matches the Figma master name (`SM-XX`) one-to-one. The Figma
node id is recorded in the file's top comment so we can cross-reference.

## How the LLM uses these

1. Reads `/styleguide.md` once at session start.
2. Reads the brief.
3. Picks one or more templates based on the brief's structure.
4. Substitutes text and image slots with real content.
5. Emits Figma Plugin API JavaScript that reproduces the slide as native,
   editable Figma nodes — using exact positions / sizes / fonts from the
   template's CSS.
6. Calls the `exec` tool. The plugin runs the code and the slide appears in
   Figma.

The HTML never reaches Figma directly — it's a design-language *source*, not
a render target.

## Future

The same HTML files will feed the planned `deploy_html` tool: instead of
inserting the slide into Figma, the agent can publish it as a hosted
web page using the rendered HTML as-is.
