# Langdock Slides

The design source + product knowledge a Langdock agent uses to build
Langdock-branded slides in Figma. Peers `git pull` this repo and the agent
handles the rest.

```
templates/      HTML reference designs (one per slide archetype)
styleguide.md   Design tokens
assets/         Logos, icons
knowledge/      Product knowledge index
CLAUDE.md       Entry point — read first.
```

The Figma plugin and bridge server that turn the agent's output into actual
Figma nodes live under `infra/` and are only of interest to whoever runs the
service. Everyone else installs the plugin from Figma Community and is done.
