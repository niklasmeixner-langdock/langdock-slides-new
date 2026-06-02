# Langdock Slides — Styleguide

Extracted from the Slides-Playground Figma file (66 master slides, IDs
`SM-01` through `SM-66`). All values are pixel-exact and verified across
multiple sampled masters.

## Canvas

| Property        | Value                          |
| --------------- | ------------------------------ |
| Slide size      | **1920 × 1080** px             |
| Side padding    | **40 px** (left and right)     |
| Content width   | **1840 px**                    |
| Nav band        | top of slide, height ≈ 104 px  |
| Footer band     | bottom of slide, padding 40 px |
| Title-block top | typically `y = 159` (light) / `y = 160` (text) |

## Colors

### Brand

| Token           | Hex       | Usage                                       |
| --------------- | --------- | ------------------------------------------- |
| Langdock Blue   | `#4469FC` | Accent. Hero metric cards, primary CTAs, active state |
| Black           | `#1A1C21` | Headlines, primary ink                      |
| Text Primary    | `#121420` | Alternate near-black (variable)             |
| Near-Black      | `#0E1112` | Darkest fills                               |

### Neutrals

| Token             | Hex       | Usage                                              |
| ----------------- | --------- | -------------------------------------------------- |
| Canvas Warm       | `#F1F0ED` | Default light slide background (cream)             |
| Canvas Cool       | `#F8F8F9` | Alternate light slide background                   |
| Card Surface      | `#F4F4F5` | Card / panel fills                                 |
| Card Border       | `#D7D7D8` | 1 px solid borders on cards                        |
| Border (variable) | `#BEBEC2` | Mid-tone separator                                 |
| Text Secondary    | `#78787A` | Sub-headlines, supporting labels (most common)     |
| Text Secondary v2 | `#717279` | Variable definition for "Text Secondary"           |
| Mid Grey          | `#6B706F` | Variable                                           |
| Ink 55%           | `rgba(26,28,33,0.55)` | Body copy inside cards                  |

### On-dark / inverted

| Token         | Hex       | Usage                                       |
| ------------- | --------- | ------------------------------------------- |
| Light Surface | `#F3F4F5` | Headlines on dark/image backgrounds         |
| Off-White     | `#F8F8F9` | Big numbers on Langdock Blue card           |
| Pale Grey     | `#EBEBEB` | Small labels on Langdock Blue card          |

### Semantic

| Token   | Hex       | Usage                       |
| ------- | --------- | --------------------------- |
| Cost    | `#DC3027` | Negative / cost lines       |
| Savings | `#2B733D` | Positive / savings lines    |

## Themes

A theme is a `{ canvas, ink, sub-ink }` triplet applied to a whole slide. Most
archetypes accept any theme; pick one based on the slide's emotional tone (the
deck doesn't need to stay on one theme — alternating cools/sage with the
default cream keeps things lively across a chapter).

| Theme         | Canvas bg | Ink (primary) | Sub-ink     | Nav variant | Use when                                  |
| ------------- | --------- | ------------- | ----------- | ----------- | ----------------------------------------- |
| **Cream**     | `#F1F0ED` | `#1A1C21`     | `#78787A`   | light       | Default. Warm, brand-neutral.             |
| **Cool**      | `#F8F8F9` | `#1A1C21`     | `#78787A`   | light       | Crisp, product-focused content.           |
| **Sage**      | `#DBE8E6` | `#1A1C21`     | `#3D4E4A`   | light       | Calm chapter, "trust" / "secure" tone.    |
| **Sky**       | `#B6CEE2` | `#1A1C21`     | `#3A4F65`   | light       | Cool, optimistic, "discovery" tone.       |
| **Warm grey** | `#D8D5CB` | `#1A1C21`     | `#5C5A52`   | light       | Refined, business-case tone.              |
| **Beige**     | `#F0EBE3` | `#1A1C21`     | `#78787A`   | light       | Soft alternate to Cream.                  |
| **Dark brown**| `#4D473C` | `#F3F4F5`     | `#C8C2B0`   | dark        | Serious / formal chapter divider.         |
| **Near-black**| `#292929` | `#F3F4F5`     | `#B3B3B3`   | dark        | High-impact statement, "executive" tone.  |
| **Langdock Blue** | `#4469FC` | `#F8F8F9` | `#EBEBEB`   | dark        | Reserved — see *Accent rules* below.      |

Use sparingly: at most 2–3 theme switches per deck. Default to Cream for
content slides; reserve dark themes for section dividers and statement
slides. Langdock Blue is **never** a slide-canvas theme except for a rare
hero declaration.

## Component treatments

Most multi-element slides (4-card grids, stacked lists, stat rows) support a
"treatment" that controls how individual components are coloured. The
treatments are mutually exclusive — pick one per slide.

### Treatment: `neutral` (default)

Every component is the same.

| Property | Value |
| -------- | ----- |
| Card fill | `#F4F4F5` (or `#fff` on Cool canvas) |
| Card border | `1 px solid #D7D7D8` |
| Card title | `#1A1C21` 24 px Regular |
| Card body | `rgba(26,28,33,0.55)` 24 px Book |

Use for: parallel feature lists where no single item should stand out.

### Treatment: `pastel-rotation`

Distribute pastel fills across siblings. No borders. Best on Cool / Cream
canvas (the canvas reads as white-ish, so the pastel cards pop).

Palette (rotate in order — wrap if more than 4 items):

| Position | Card fill   | Card title | Card body                      |
| -------- | ----------- | ---------- | ------------------------------ |
| 1        | `#B6CEE2`   | `#1A1C21`  | `rgba(26,28,33,0.65)`          |
| 2        | `#D8D5CB`   | `#1A1C21`  | `rgba(26,28,33,0.65)`          |
| 3        | `#EBEBEB`   | `#1A1C21`  | `rgba(26,28,33,0.55)`          |
| 4        | `#DBE8E6`   | `#1A1C21`  | `rgba(26,28,33,0.65)`          |

Use for: when each item is conceptually distinct (e.g. four different
properties of a system) and the variety helps the reader pause on each.

### Treatment: `highlight`

One component in Langdock Blue with light text, the rest neutral.

| Property of highlighted card | Value |
| ---------------------------- | ----- |
| Card fill | `#4469FC` |
| Card border | none |
| Card title | `#F8F8F9` |
| Card body | `#EBEBEB` |

The remaining cards stay `neutral`. Use for: drawing the eye to a single
property — "active state", "today's focus", "the answer", "the
differentiator". Exactly **one** card per slide gets this treatment.

## Accent rules — when to reach for Langdock Blue (`#4469FC`)

Langdock Blue is the loudest colour in the system. Use it deliberately:

- ✅ **One hero metric card** per slide (e.g. "ROI nach 12 Monaten >2 000 %")
- ✅ **One highlighted card** in a multi-card grid (treatment: `highlight`)
- ✅ **Active state** on tab rows, model pickers, toggles
- ✅ **The centre pill** in hub-diagram slides ("Langdock" connecting models
  and integrations)
- ❌ Never as a slide-canvas theme (except a single declarative cover)
- ❌ Never for body text or sub-headings
- ❌ Never on more than one element per slide

## Typography

**Font families** — both must be loaded:
- `STK Bureau Sans` — primary. Weights used: `Regular` and `Book` (lighter, for body copy).
- `Inter` — used for the footnote variable only (`Medium`, 18 px).

**Universal tracking rule:** letter-spacing = **−2 %** of font-size. The
sampled values confirm this exactly:
`96 → −1.92`, `64 → −1.28`, `48 → −0.96`, `36 → −0.72`, `24 → −0.48`,
`18 → −0.36`, `16 → −0.32`. Use −2 % for any size ≥ 16 px; below that,
leave tracking at 0.

### Scale

**Hard rule — main slide content is NEVER below 20 px.** Anything readable as
the slide's message — titles, subheads, card content, bullet points, body
copy — uses 24 px or larger. Sizes ≤ 18 px are reserved for chrome that is
*not* the slide's content: navigation band, footer, axis labels on charts,
footnotes, and tiny legend labels. If you find yourself reaching for 16 px
to "fit more text", restructure the slide instead.

| Role               | Size   | Weight          | Line-height | Letter-spacing | Default color    | Use? |
| ------------------ | ------ | --------------- | ----------- | -------------- | ---------------- | ---- |
| Display (mega num) | 96 px  | Regular         | 1.0         | −1.92          | `#F3F4F5` on dark | content |
| Display            | 64 px  | Regular         | 1.1         | −1.28          | `#1A1C21`        | content |
| Title              | 48 px  | Regular         | 1.1         | −0.96          | `#1A1C21` (+ `#78787A` for subhead variant) | content |
| Subhead            | 36 px  | Regular         | 1.1         | −0.72          | `#78787A`        | content |
| Card title / body  | 24 px  | Regular / Book  | normal / 1.2| −0.48          | `#1A1C21` / `rgba(26,28,33,0.55)` | content |
| — — — — — — — —    | — — —  | — — —           | — — —       | — — —          | — — —            | — — — |
| Body large         | 18 px  | Regular         | 20 px (~1.1)| −0.36          | `#1A1C21` / `#78787A` | **chrome only** — footnotes, dense data labels |
| Footnote (Inter)   | 18 px  | Inter Medium 500| 20 px       | −0.36          | `#717279`        | **chrome only** — source / disclaimer lines |
| Caption / axis     | 16 px  | Regular         | 20 px       | −0.32          | `#78787A`        | **chrome only** — chart axes |
| Small label        | 14 px  | Regular         | 18 px       | 0              | `#78787A`        | **chrome only** — chart legends, bullet lists inside charts |
| Nav band           | 12.8 px| Regular         | 15 px       | 0              | `#78787A`        | **chrome only** — nav component |

### Pattern: two-tone headline

Used for section titles where the kicker and the title differ in color but
share size and line-break:

```
<span color="#1A1C21">ROI Berechnung</span><br>
<span color="#78787A">Hoher ROI bereits bei Standardanwendungsfällen</span>
```

Both spans: 48 px, Regular, leading 1.1, tracking −0.96.

## Cards & surfaces

| Property         | Value                              |
| ---------------- | ---------------------------------- |
| Default fill     | `#F4F4F5`                          |
| Border           | `1px solid #D7D7D8`                |
| Corner radius    | **12 px** (most cards) / **8 px** (compact / hero metric) |
| Padding          | `32px 40px` (most) / `24px 20px 20px 20px` (hero metric) |
| Gap inside card  | 32–40 px between title and body    |
| Card grid gap    | **16 px** between sibling cards    |

### Hero metric card (Langdock Blue)

| Property      | Value                                 |
| ------------- | ------------------------------------- |
| Background    | `#4469FC`                             |
| Radius        | 8 px                                  |
| Padding       | `pt-24 pb-20 px-20`                   |
| Eyebrow label | 18 px Regular, color `#EBEBEB`, leading 20 |
| Big number    | 36 px Regular, leading 1.3, color `#F8F8F9`, tracking −0.9 |

## Navigation (every slide)

Top band, sits over the canvas at `(0, 0)` with `pt-30 px-40`.

Component variants:
- `slides navigation/light` — for light-canvas slides.
- `slides navigation/dark` — for dark / over-image slides. Exposes a
  `presentationTitle` component property; defaults to `"Advanced Tools\nP. 12"`.

Inner anatomy (same in both variants):

| Element            | Property                                                  |
| ------------------ | --------------------------------------------------------- |
| Left text          | `Langdock` — STK Bureau Sans Regular 12.8 px, color `#78787A`, leading 15 |
| Right text (2 line)| Line 1: presentation title. Line 2: `P. N` (1-based page number). Same 12.8 / 15 / `#78787A` |
| Right-edge mark    | 26 × 15.779 px vector at `ml-1824` (Langdock glyph)        |
| Below nav          | 1 px divider line, width 1840 px, color `#BEBEC2`          |
| Gap nav → divider  | `gap-24` (24 px)                                          |

## Footer (every slide)

Bottom band, `pb-40 px-40`. Just a 1 px divider line at the top of the band, full content-width (1840 px), color `#BEBEC2`.

## Layout conventions

- Content blocks start at **x = 40**.
- Common content top: **y = 159–160** (just under the nav band).
- Common content bottom: **y ≈ 1008** (above the footer line).
- Big vertical stacks use `gap: 80px` between headline and body.
- Inside cards, vertical stacks use `gap: 32px` or `40px`.
- Card grids: `flex` with `gap: 16px`, children `flex-1`.

## Slide masters — index

The Slides-Playground file ships 66 masters named `SM-01` through `SM-66`.
The 4 sampled for this guide:

| ID            | Master  | Purpose                                                     |
| ------------- | ------- | ----------------------------------------------------------- |
| `750:19557`   | SM-17   | Cover with hero image + dark nav + decorative rounded panel  |
| `750:18337`   | SM-30   | Headline + subhead + 4-card grid (security / GDPR pattern)   |
| `750:16425`   | SM-37   | ROI chart slide: dual-axis line chart + sidebar metric cards |
| `1084:32440`  | SM-01   | Testimonial / closing: full-bleed image + 96 px metric stack |

Pull others via the Figma MCP `get_design_context` when authoring a new
template — IDs are listed inline in `templates/` once those are filled in.
