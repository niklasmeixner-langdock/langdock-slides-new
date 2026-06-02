# Knowledge

Product knowledge the LLM should consult while drafting slide content.

## Files

| File                       | Purpose                                                                 |
| -------------------------- | ----------------------------------------------------------------------- |
| `langdock-docs-index.md`   | Mirror of `https://docs.langdock.com/llms.txt` — the canonical index of every public Langdock doc page. |

## How to use

When a slide is about anything Langdock-specific (a feature, an integration,
a security promise, a workflow capability, an API), do this **before**
drafting text:

1. Open `langdock-docs-index.md` and scan for relevant doc titles.
2. Fetch the matching URLs (each line points to a `.md` file on
   `docs.langdock.com`).
3. Use the fetched content as the source of truth for the slide's copy —
   feature names, exact terminology, capabilities, limits.
4. Never invent product facts. If the docs don't say it, the slide can't
   either.

This applies to:
- Product overview slides ("What Langdock does")
- Feature deep-dives (Agents, Workflows, Skills, File Library, Integrations)
- Integration spec slides (which actions, which scopes)
- Security / compliance slides
- API capability claims
