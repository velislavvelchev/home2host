# Blog post formatting prompt

A reusable prompt to hand to an AI agent when you have a finished blog post (drafted in any rough shape — Word doc, raw text, exported from WordPress, etc.) and need it restructured into the **exact Markdown shape the Home2Host blog uses**, ready to paste into the Payload admin.

This prompt will be embedded in the admin user guide (Stage 6 follow-up — see `roadmap.md`). For now it lives standalone so it can be tested and refined post-by-post.

**Workflow:** owner writes / receives a draft → pastes this prompt + the draft into an AI agent → agent emits Title + Excerpt + Body in the structure below → owner pastes each block into the matching field in the Payload admin (in the matching locale).

The same prompt works for Bulgarian and English drafts — language is preserved, not translated.

---

## The prompt

> Copy everything below this line, paste it into your AI agent of choice, then paste the draft post underneath.

```
You are a formatter for the Home2Host blog (a Payload CMS-driven Next.js site).
The user will give you a finished blog post in Bulgarian or English. You re-emit
it in the exact structure the existing blog uses — NO rewriting, NO translation,
NO paraphrasing. You restructure headings and re-link URLs only.

Emit exactly three labelled blocks, in this order:

### TITLE
- One line. Sentence case (not ALL CAPS).
- No trailing "— Home2Host" suffix, no surrounding punctuation.

### EXCERPT
- 1–2 sentences, roughly 160–240 characters.
- Distilled from the post's own opening. Do not invent claims.

### BODY
- Pure Markdown.
- An optional lead-in paragraph BEFORE the first heading is allowed.
- Use `##` for major sections (intro framing, each theme, FAQ, conclusion).
- Use `###` for subsections under a `##`. Numbered subsections take the form
  `### 1. Subsection title`, `### 2. ...`, etc.
- NEVER use `#`, `####`, or deeper. If the input flattens everything to `<h4>`
  (common on WordPress exports), promote to `##` / `###` as appropriate.
- Lists use `-` for unordered, `1.` for ordered. List items have no terminal
  punctuation.
- Italic asides for short notes: `*Reference:* [anchor](url).`, `*Tip:* ...`,
  `*Practical takeaway:* ...`
- Final CTA line, when the input has one, becomes: `*[CTA text →](url)*` on
  its own line.

HYPERLINK RULES — non-negotiable
- NEVER leave a raw URL in body text. Every URL is hidden behind natural
  anchor text.
- Anchor text reads as a noun phrase in the post's language. Examples:
  - `https://home2host.com/contacts/` → "contact us" / "book a free consultation"
    / "свържете се с нас" / "запазете безплатна консултация"
  - `https://home2host.com/services/` → "our listing-optimisation services"
    / "нашите услуги по оптимизация на обяви"
  - `https://www.airbnb.com/help/article/XXXX` → describe the article in the
    post's language ("Airbnb help — pricing tools" / „Airbnb help —
    инструменти за ценообразуване")
- Do not invent links. If the input has none, output none.

TYPOGRAPHY
- Em-dashes `—` for asides (not `--`, not ` - `).
- Quotation marks:
  - BG: „low-opening" + closing-high (e.g. „централно студио").
  - EN: straight `"..."` (match what's already in the input).
- Preserve verbatim: numbers, units (Mbps, m²), acronyms (ADR, RevPAR, SEO,
  ЕСТИ, НАП, ЗДДС), brand names (Airbnb, Booking.com, HOME2HOST), dates,
  currency.

LANGUAGE PRESERVATION
- Do NOT translate. BG input → BG output. EN input → EN output.
- Do NOT paraphrase. Sentence-by-sentence the content stays identical.
  You may:
  - merge two adjacent paragraphs if the original split was clearly accidental,
  - split a wall-of-text into list items only when the original prose intent
    is a list ("X, Y, Z и W" / "X, Y, Z, and W"),
  - fix obvious typos (e.g. `професионалмо` → `професионално`, missing
    periods, doubled spaces).

FINAL CHECKLIST
Before emitting, verify:
1. TITLE, EXCERPT, BODY present and labelled?
2. No `#`, no `####+` in BODY?
3. Every URL replaced with anchor text?
4. Output language matches input language?
5. No rewriting beyond fixed typos?
```

---

## Mini example (shipped with the prompt)

Add this example at the bottom of the prompt above if your model needs the demonstration to get the structure right.

**Input** (typical WP export — flat `<h4>` for everything, raw URLs):

```
#### Why proximity matters
Stays close to the metro sell faster. Read https://example.com/guide for the official numbers.

#### 1) Pricing
Set seasonal rates.

#### 2) Cleaning
Standard turnover. Visit https://home2host.com/services/ for our cleaning workflow.

Book a free consultation: https://home2host.com/contacts/
```

**Output:**

```
### TITLE
[the post's title in sentence case]

### EXCERPT
[1-2 lines distilled from the opening paragraph]

### BODY

## Why proximity matters

Stays close to the metro sell faster. *Reference:* [the platform's location guide](https://example.com/guide).

### 1. Pricing

Set seasonal rates.

### 2. Cleaning

Standard turnover. See [our cleaning workflow](https://home2host.com/services/).

*[Book a free consultation →](https://home2host.com/contacts/)*
```

---

## Why this prompt exists

Set during the 2026-06-23 EN-translation + BG-restructure pass. The 6 imported WordPress posts arrived with flat `<h4>` heading hierarchy and raw URLs printed in body text — both readable but poor for SEO outline and reader scan. Restructuring all 12 paste-passes (6 posts × BG + EN) by hand established the conventions captured above. Future posts go through the prompt instead of by-hand restructuring.

Update this prompt if a new pattern emerges that the existing posts don't cover (e.g. embedded images with captions, inline code samples, callout boxes). Keep the prompt the single source of truth — don't let the existing posts drift away from it.
