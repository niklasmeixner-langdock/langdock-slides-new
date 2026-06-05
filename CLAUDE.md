# Langdock Slides — Skills Pack

This repo is the design source the Langdock agent reads to build presentation
slides in Figma. The agent emits Figma Plugin API JavaScript; a separate
plugin (installed once per Figma file) executes it.

## Session start

```bash
git pull
```

## Files the agent reads

| Path             | Purpose                                                         |
| ---------------- | --------------------------------------------------------------- |
| `templates/`     | HTML reference designs — one file per slide archetype.          |
| `styleguide.md`  | Design tokens (typography, color, spacing, layout grid).        |
| `assets/`        | Logos, icons (tabler, integrations, workflows).                 |
| `knowledge/`     | Product knowledge index → `docs.langdock.com` paths.            |

## How a slide gets made

1. User asks the Langdock agent for a slide.
2. Agent picks (or composes) a template, fills in content from `knowledge/`.
3. Agent translates the HTML/CSS into Figma Plugin API JS that creates
   native, editable Figma nodes — auto-layout, fonts, fills,
   `figma.createNodeFromSvg` for icons.
4. Agent calls the `exec` tool with that code. The bridge forwards it to the
   open plugin; the plugin runs it. The slide appears in Figma.

## Authoring rules

TODO — fill in once `templates/` and `styleguide.md` are in place.
