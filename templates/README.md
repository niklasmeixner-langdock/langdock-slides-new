# Templates

Each `.html` file in this directory is an **archetype** — a structural slide
pattern that the LLM picks, then customises with a theme and (where
applicable) a component treatment from `/styleguide.md`.

## The model

```
Slide  =  Archetype  +  Theme  +  Treatment (when applicable)  +  Slot values
            shape       canvas      per-component palette        content
```

- **Archetype** chooses the layout (cards? headline + image? full-bleed?).
- **Theme** chooses the canvas bg + ink colours (see `/styleguide.md` →
  *Themes*).
- **Treatment** chooses how multi-element components are coloured
  (`neutral` / `pastel-rotation` / `highlight`).
- **Slot values** fill in the actual text and image URLs.

## Archetype catalog (23)

| File                            | Use when                                                                     | Replaces legacy |
| ------------------------------- | ---------------------------------------------------------------------------- | --------------- |
| `cover-image.html`              | Opening with a strong photographic hero, dark nav.                            | SM-03, 17, 41, 42, 43, 44 |
| `cover-frosted.html`            | Softer, glassier cover variant (40 px backdrop blur).                         | SM-12 |
| `cover-minimal.html`            | Brand bookend / blank canvas with centred mark only.                          | SM-65, 66 |
| `section-divider.html`          | Chapter break — 130 px headline on a themed canvas.                           | SM-13, 14, 15, 16, 18, 53*, 54*, 55*, 56*, 57*, 58* |
| `section-divider-image.html`    | Chapter break with image on the right.                                       | SM-19 |
| `section-divider-portrait.html` | Workshop / session opener with speaker portrait.                              | SM-20, 21 |
| `centered-statement.html`       | Single thesis statement, centred. 36 / 64 / 96 px size.                       | SM-46, 53, 54, 55, 56, 57, 58, 60 |
| `centered-definition.html`      | Eyebrow + centred statement (definition / recommendation pattern).            | SM-07, 59 |
| `four-cards.html`               | Headline + subhead + 4 parallel cards. Use treatments.                        | SM-28, 29, 30 |
| `stacked-cards.html`            | Headline + subhead + N stacked cards with optional status pills.              | SM-34, 38, 39 |
| `numbered-steps.html`           | 4 numbered cards (ordered sequence, Persona / Task / Context / Format style). | SM-27 |
| `text-image-right.html`         | Title + subhead left, large shadowed screenshot right.                        | SM-04, 05, 40, 49, 50 |
| `image-cover-headline.html`     | Full-bleed image + bottom-left ink headline.                                  | SM-06, 45 |
| `closing-testimonial.html`      | Closing deck: full-bleed image + speaker + big metrics.                       | SM-01, 02 |
| `workshop-cover.html`           | Workshop opener with 3-portrait row + event info.                             | SM-08, 09 |
| `quote.html`                    | Customer quote + portrait (with optional attribution + brand mark).           | SM-47, 48 |
| `stats-logos.html`              | Stat cards left + customer logo wall right.                                   | SM-31, 32, 33 |
| `hub-diagram.html`              | Langdock as centre pill connecting models + integrations.                     | SM-22, 23, 25, 26 |
| `roi-chart.html`                | ROI line chart + sidebar metric cards.                                        | SM-36, 37 |
| `growth-charts.html`            | Two stacked growth curves with shared time axis.                              | SM-35 |
| `comparison-bars.html`          | Two bars (potential vs actual usage etc.).                                    | SM-24 |
| `product-ui.html`               | Tab row + large product UI mockup.                                            | SM-31, 61, 62, 63, 64 |
| `prompt-elements.html`          | Annotated prompt-card teaching slide.                                         | SM-51, 52 |

\* Pure colour variants — replaced by `centered-statement.html` + a `Theme`
from the styleguide.

## Authoring rules

When the LLM authors a new slide:

1. **Pick an archetype** by structural match to the brief. Prefer the
   simplest one that fits.
2. **Pick a theme** from `/styleguide.md` § *Themes* unless the brief
   dictates a specific tone. Default to `Cream`.
3. **Pick a treatment** if the archetype is multi-component (cards, stats,
   stacked items). Default to `neutral`. Reach for `highlight` exactly once
   per slide when one item should stand out.
4. **Inline-substitute the theme colours** when building the final HTML —
   replace the archetype's default `#F1F0ED` canvas / `#1A1C21` ink etc.
   with the chosen theme's values.
5. **Inline-substitute treatment colours** the same way for cards.
6. **Fill slot values** (text, image URLs).
7. POST `{ html, slots, name }` to the bridge.

The plugin's HTML→Figma renderer turns it into native editable Figma nodes.

## Files

- `legacy/` — the original 66 SM-XX HTML files, preserved for reference.
- `README.md` — this file.
- `*.html` — the 23 archetypes.
