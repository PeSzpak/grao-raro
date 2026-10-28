# DIRECTION SHEET — The page is the object
seed 1289546212 · drawn 2026-10-28 · sector ecommerce · tone luxury
Brief: Grão Raro: loja dos cafés mais raros e caros do mundo, equipamentos e guias de preparo; cada café tem fazenda, altitude, processo e notas

| | |
| --- | --- |
| Direction | The page is the object |
| Hero | Card over a dim room |
| Type | Schibsted Grotesk |
| Colour | Green-black and bone |
| Sections | showcase (Square plate, spare text) → list (Cards that fold into spines) → how-it-works (Drag row of moments) → features (Capabilities as a menu) → cta (Question at both edges) → footer (Photograph half, menu half) |
| Motion | Pinned story |
| Photographs | the "Objects" set, as atmosphere |

This is the direction for this build. Adopt it. Do not blend it with the layout you would have made anyway,
and do not redraw because it is unfamiliar: unfamiliar is the point. Redraw a slot only when it conflicts
with a stated brand constraint or needs an asset that does not exist, and say why in your report.

The parts of this sheet were written separately and will disagree in small ways. Settle every disagreement in this order:
**house rules** (including type no smaller than 13px and body text of 16px or more) → **the direction** (the idea, the composition habits, where the
one accent goes) → **the type system and the palette** (which face does which job, the five size steps, which colour is the ground and where the
accent goes) → **the hero blueprint** → **the section blueprints**. Under each blueprint below, "Adjusted for this page" lists where it disagrees.
In practice: take geometry from blueprints (columns, proportions, what sits where) and take everything else from above them. Map every size a
blueprint names onto one of your five type steps instead of adding a sixth. Use one button shape, one corner radius and one pair of page margins on
the whole page, whatever individual blueprints say. If a blueprint names a kind of typeface (a light serif, a heavy grotesk), use the dealt face.

## 1. The idea
Find the printed or physical artefact that already exists in the subject's world and build the page as that thing. A wedding site is the invitation card. A restaurant is its menu. A conference is the ticket; a record is its sleeve; a shop is the receipt or the swing tag; an archive is a stack of tabbed folders; a course is the syllabus sheet. The artefact supplies everything a template would otherwise invent: its proportions, its typographic manners, its way of grouping information. Visitors recognise the object instantly, which is why these pages feel specific.

Before anything else, write one sentence in your notes: "On this page, <the subject's own material> becomes <the device>."
Fill the first blank from your inventory of what only this client has (its name and what it means, its street, its numbers, its
constraint), then put the nearest competitor in the sentence: if it still works, the idea is the category's, not the client's.
Then name the one live thing the visitor can do on the page (SKILL.md step 4).

## 2. Composition
The first screen shows the artefact as a single filled panel (paper colour on a contrasting ground) centred or offset, with believable proportions: a card at 5:7, a ticket at about 2.2:1 with a notch cut by `clip-path`, a menu as a tall sheet. All primary content lives on it, set the way that object is set: centred and symmetrical for an invitation, in tidy aligned columns for a menu or ticket. The ground behind is a flat colour or one full-bleed photograph. As the page continues, each section is another piece of the same stationery: a second card, a tear-off stub, a folded panel, always filled shapes with real edges (straight, notched, scalloped, perforated by a dotted `border` of round dots at 4px or more), never outlined boxes. The footer is the back of the object.

## 3. Type — Schibsted Grotesk
A compact, warm grotesk set heavy with letters almost touching; small text stays in the same family at semibold. Suits music, events and culture pages where the type is the image.
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;600;800&display=swap" rel="stylesheet">
```
- Display: **Schibsted Grotesk** — weight 800 · tracking -0.05em · leading 0.88 · sentence case or all lowercase
- Text: **Schibsted Grotesk** — 400 for paragraphs, 600 for navigation and other functional text · leading 1.4 · tracking -0.01em
```css
:root {
  --step-small: clamp(0.8125rem, 0.79rem + 0.1vw, 0.875rem);
  --step-body: clamp(1.0625rem, 1rem + 0.25vw, 1.1875rem);
  --step-lead: clamp(1.25rem, 1.1rem + 0.7vw, 1.625rem);
  --step-head: clamp(2rem, 1.3rem + 3.2vw, 4rem);
}
```
Take the manners of the artefact: a bookish serif with small caps avoided, or a blunt condensed face for tickets and posters. Sizes stay within what print would use relative to the panel; the name is large on the panel, details are small and exact.
The direction decides sizes and how many of them; the type system decides how this face is set. Where the two give different tracking or leading, use the values of the type system: they are tuned to this face.
The display size itself comes from the hero blueprint below.

## 4. Colour — Green-black and bone
```css
:root {
  --bg: #161c1a;
  --surface: #1f2725;
  --ink: #e3e2da;
  --muted: #8e948d;
  --accent: #9fc7b8;
  --accent-ink: #161c1a;
}
```
Bone type on green-black from top to bottom, with panels and drawn details barely lighter than the ground so photographs supply the colour. Pale jade is for the booking or contact button alone.
Paper and ink plus the ground the paper sits on. Two or three flat colours in total, like a two-colour print job.

## 5. Imagery
**There are no photographs of the product and none can be faked.** Wherever this sheet calls for a picture of the object, draw the object: its pieces as flat shapes in inline SVG, large, in one graphic language and in the colours that make it worth buying (a glaze, a finish, a material), never grey placeholders (references/imagery.md §8). **Around the object, use real pictures of its world** from the open collections: its material up close, its town in old postcards, its craft in engravings, a museum piece of the same kind, never one a visitor could take for the product itself (references/imagery.md §3). Start with `node /Users/pedroszpak/.claude/skills/design-taste-frontend/scripts/assets.mjs "ecommerce"`, then queries from your inventory (its street, its materials, its trade's tools and history). Download what you use with `--get` and credit every one on the page (`--credits` prints the footer line). Type at scale and full colour fields carry the rest; the dealt photographs only where they plainly do not pretend to be the product. In your report, say that product photography is needed and which drawings it will replace, and list every found picture with its source and licence.

Optional. One photograph behind the object, or small photographs placed on it like tipped-in plates. The object itself is the image.

**Floor (the inspector checks it):** at least four real pictures on the page, usually six to twelve; SVG drawings do not count. One moving picture where an honest clip exists: `node <skill>/scripts/assets.mjs --video "<query>"`, used as a muted loop with a poster frame. Whatever this direction says about pictures, it is carried out with real ones.

Photographs dealt for this build, from the "Objects" set (single objects seen close: instruments, tools, cameras, books)
Order of preference for imagery: (1) the project's own photographs and product shots; (2) images you generate, if an image tool is
available; (3) real pictures of the subject's world found in the open collections (assets.mjs, downloaded and credited on the page);
(4) drawings of the subject in code; (5) these. They are real photographs (Unsplash licence, served by picsum.photos) of places, light and
texture. They are atmosphere, never a stand-in for a specific product, dish, person or interface. List the ones you use in your report so
they can be replaced.
- `https://picsum.photos/id/63/1600/1000` — Cup of coffee seen from above on a bright red surface · mid tone · bright red, white, brown · calm area: right · native landscape · photo: Justin Leibow
- `https://picsum.photos/id/24/1600/1000` — Open book lying on a wooden table in soft light · light tone · cream, warm brown · calm area: top · native landscape · photo: Alejandro Escamilla
- `https://picsum.photos/id/687/1600/1000` — Coin-operated viewing binoculars facing a pale sea and sky · light tone · white, pale blue, silver grey · calm area: right · native landscape · photo: davide ragusa
- `https://picsum.photos/id/23/1600/1000` — Close-up of metal fork tines against a dark blurred background · dark tone · charcoal, blue grey, silver · calm area: top · native portrait · photo: Alejandro Escamilla
- `https://picsum.photos/id/535/1600/1000` — Colourful shirts on wooden hangers along a metal pipe rail · dark tone · charcoal, orange, green · native portrait · photo: Jeff Sheldon
- `https://picsum.photos/id/486/1600/1000` — Black vintage typewriter with blank paper seen from above on white · light tone · white, black · calm area: left · native portrait · photo: Florian Klauer
- `https://picsum.photos/id/80/1600/1000` — Pine cones resting on weathered wood in black and white · mid tone · grey, charcoal · black-and-white · calm area: top · native landscape · photo: Sonja Langford
- `https://picsum.photos/id/113/1600/1000` — Steam rising from a metal mug with blurred blue background · mid tone · steel blue, white, grey · calm area: top · native landscape · photo: Zugr
The last two path numbers are width and height: request the exact crop you render (`/1200/1500` for a 4:5 portrait, `/2400/1350` for a hero) and
add `?grayscale` to desaturate. Use three to six of them, not all eight. Always set `width`, `height`, `alt` and `loading="lazy"` (not on the hero image).
Other sets that fit this brief: hands-and-making, field-and-farm, interior-and-table, plants-and-flowers — `node draw.mjs --photos <set>` prints one in full; `--photos list` shows all sets. Taking photographs from another set is your call and is not a redraw; keep them to one light and one treatment.

## 6. Hero — Card over a dim room
A full-bleed, low-key photograph of the room fills the viewport, darkened with `filter: brightness(0.7)` so it reads as atmosphere. Centred over it is one square-cornered panel in a flat warm tone taken from the photograph: columns 4–10, about 55% of the width and 62% of the height, a filled programme card with 32px padding. Along its top edge the three words of the title are spread to the left, centre and right in bold condensed capitals at clamp(28px, 2.5vw, 38px); that line is the headline. Under it sit two left-aligned blocks in the same face and size, line-height 1.0: the facts (date, time, place) as three short lines, then one supporting sentence held to 30ch. Along the card's bottom edge: a credit at left in 14px, the single action as a solid rectangular button in the centre, one text link at right. There is no navigation outside the card. The card is `position: sticky`: as the page scrolls it shrinks with `transform: scale` toward the bottom-left corner and stays there as a ticket-sized stub while photographs of differing sizes pass on a flat ground.

On a phone: The photograph fills 100svh and the card sits centred at full width minus 16px margins, 70svh tall. The title words stack as a two-line heading at 9vw at the card's top-left. The facts and the supporting sentence follow at 5.2vw in the condensed face. The action button spans the card's bottom edge. On scroll the card shrinks to a 120px stub pinned bottom-left.
Headline: The event or venue name, three words at most and up to about 8 characters each, spread across the card's top edge; two lines on a phone.

Adjusted for this page:
- It names a kind of typeface: use the dealt faces (display Schibsted Grotesk, text Schibsted Grotesk) and their settings; capitals only where the type system sets them.
- It sets a sentence large over several lines: jurors read that as a long headline. Either cut it to a two-line headline at display size, or keep it a statement at 36px or less on three lines (24px, four lines on a phone).

## 7. Sections, in order
Each is a composition to rebuild with this project's content. Keep the geometry; change the subject. Re-order or drop a
section when the argument of the page needs it (see references/copy.md), never to fall back to a card grid.

### 1. showcase — Square plate, spare text (split)
One flat field split 50/50, at least 88svh tall. Left half: a single square photograph filling the half's width minus 40px margins, vertically centred, square corners. A large simple shape may be laid over it to turn the photograph into the object it stands for: a ring 86% of its width with a 6px stroke and a small solid dot at the centre makes a record; a notch cut by clip-path makes a ticket stub. Right half, a flex column with space-between: at the top a row of three plain text tabs at 18px (editions, years, variants), the active one in full ink and the others at 40%; in the middle the title, two to four words at 32–40px bold, with a 34ch description 48px below; along the bottom two filled rectangular cells side by side, each half the column wide and 72px tall, acting as the two actions, one in ink and one a tone off the field.
On a phone: The square photograph comes first at full width with 16px margins. The tabs sit under it as one row at 17px. Then the title at 28px, the description, and the two action cells stacked, each full width and 60px tall.

Adjusted for this page:
- It fades text: anything a visitor reads, inactive items of a list included, is `--ink` or `--muted` at full strength (contrast 4.5:1 or more). The active item is told apart by `--ink` against `--muted`, weight or the accent, not by fading the rest.

### 2. list — Cards that fold into spines (pinned)
For a journal, a run of notes or a list of chapters without pictures. A wrapper about 400svh tall holds a sticky stage of 100svh. The heading, two to four words at clamp(48px, 4.2vw, 64px), sits top-left on the 32px margin, 120px from the top. Under it a band 360px tall spans the content width and holds a horizontal deck of text cards, each about 620px wide, in three neighbouring flat tones of one hue taken in turn. On a card, with 32px padding: its title at 30px on up to two lines, leading 1.1; an excerpt of two lines at 16px; and along the bottom edge the date on the left and a text link to read it on the right, both at 16px. As the page scrolls, each step slides the next card in from the right edge and squeezes the earlier ones into slivers 120px wide stacked edge to edge at the left, like book spines, where only the first letters of their titles show, clipped by the sliver. Clicking a sliver brings its card back. 48px under the band, the number of entries and a link to the full list sit at 17px on the left margin, so the stage does not end on an empty floor.
On a phone: No pin and no slivers. The cards stack at full width with 12px gaps, each in its tone, the title at 24px, the excerpt at 16px, the date and link at the foot. The heading sits above them at 10vw.

Adjusted for this page:
- It pins something for three screens or more: hold a pin for two or three screens at most, give every screen under it its own content, and let nothing pass over the pinned words (the inspector checks all three).

### 3. how-it-works — Drag row of moments (carousel)
A story told left to right. Top row: the heading, two to four words at 28–36px, at the left margin; at the right margin two solid square buttons, 48px each, for back and forward. Directly beneath, a solid bar 6px tall spans the full width in a soft tone, with a full-ink segment showing how far the row has been scrolled. Then the row itself: six to nine columns, each 280px wide with 32px gaps, in a horizontally scrolling flex container with scroll-snap that bleeds off both viewport edges. Every column reads top to bottom: a one-line caption at 18px bold that carries the order in words ('We met', 'Two winters on', 'The move'), three lines at 15px in the soft ink, then 80–140px of empty space that varies per column, then a 4:5 portrait photograph. Because the spaces vary, the photographs' top edges rise and fall along the row.
On a phone: Columns are 72vw wide with 16px gaps, so the next one always shows at the right edge. The buttons are dropped; the 6px progress bar stays under the heading. The empty space inside columns shrinks to 32–64px but still varies from column to column.

### 4. features — Capabilities as a menu (table)
The capabilities are set as a printed menu or price list. One paper-coloured sheet, 520–600px wide and taller than it is wide, sits on a contrasting flat ground, centred or starting at column 2; its top and bottom edges are cut into shallow scallops or a zigzag with clip-path, its sides straight. On it, centred at the top, the heading: two or three words at 44–56px, then 40px of space. Below, items in two or three groups; each group opens with its name at 20px bold. Each item is a row: the name at 19px on the left, a short value on the right (a price, a time, a quantity, 'included'), and between them a leader of round 4px dots (border-bottom: 4px dotted, sitting on the baseline). A description at 15px in the soft ink sits under the name, at most 34ch. 18px between items, 44px between groups.
On a phone: The sheet fills the width minus 12px margins and keeps its cut top and bottom edges. Names stay left and values right on one line with the dot leader between; descriptions wrap beneath at 15px. Group names drop to 18px. Padding inside the sheet is 20px.

Adjusted for this page:
- It draws lines or borders: keep them only inside a table, a form or a `data-ui` fragment; elsewhere separate with space or a change of ground.

### 5. cta — Question at both edges (statement)
For a closing choice between two answers: book or ask, this date or that, the tasting or the tour. A flat field exactly 100svh tall in the darkest tone. The question is a two-line heading at clamp(110px, 11vw, 168px), leading 1.0, centred, about 54% of the width: line one with its cap line 32px under the field's top edge, line two with its baseline 24px above the bottom edge. The band of about 560px between them is empty except for one row at its optical centre: two solid rectangular buttons, each about 200×56px with its label at 18px in medium weight, their inner edges 120px either side of the centre axis, and between them, exactly on the axis, the word 'or' at 18px in the soft ink. 16px under the row, centred, one line at 16px in the soft ink says what happens after either choice. The type above and below closes the empty band, so it reads as held breath rather than a gap.
On a phone: The question drops to 18vw, still two centred lines, line one 32px from the top and line two 24px above the bottom. The buttons stack at the centre at 72% of the width, 12px apart, with 'or' between them and the line of explanation under the second.

### 6. footer — Photograph half, menu half (split)
A split footer one viewport tall. The left half is a single photograph filling columns 1–6 edge to edge, cropped hard by the left and bottom viewport edges: a close crop of the page's main subject, larger than it appeared anywhere above. The right half, on a flat field, is the site's menu set large: five or six section names stacked as links at about 2.6vw bold, 28px apart, starting at column 8 and 80px from the top. Rows are separated by space only; on hover a row's label shifts right by 12px and the others drop to the softer ink. Under the menu, 64px lower, two short blocks at 15px side by side: contact and social. The legal line runs along the very bottom of the right half at 12px. The wordmark sits small at the top of the right half, on the menu's left edge.
On a phone: The photograph leads at full width and 50svh, cropped tight. The menu follows on the flat field at 8vw per item with 20px between items, then contact and social stacked at 15px, then the legal line at 12px. The wordmark sits small above the menu.

Adjusted for this page:
- It sets text at 12px: use your small step (13px or more) instead.

## 8. Motion — Pinned story
One element holds its place with `position: sticky` (a title, a frame, a product fragment) while the items that belong to it scroll past or swap inside it. The page's ordinary scrolling does the work; nothing is hijacked. Hold it for about one screen per step and three screens at most, two held stages per page at most, with a line of text on every held screen. Recipe: 'Pinned story' in references/motion.md.
This is the signature move, the one loud moment. Around it the page still needs the rest of the motion layer (SKILL.md step 9): an entrance for the parts of every section, feedback on every control, and one moving picture. The inspector fails a page that barely moves. Recipes: references/motion.md.

## 10. Where the richness comes from
Recognition. The shaped edges, the print-like alignment and the limited inks make a familiar object out of plain HTML.

## 11. How this direction goes wrong
Choose an artefact that truly belongs to the subject, or it becomes costume. Shape the edges with fills and `clip-path`; an outlined rectangle with a thin border is not an object. Keep text sizes readable on a phone, where the object becomes full width with its shaped edge kept at top and bottom.

## 12. Real references
Studied sites that work this way. Take the principle, never the specifics: no names, copy, images or signature assets of theirs.
- **Sarah & Matt Wedding** (One Page Love, studied score 8) `opl-sarah-matt-wedding`
  Idea: The site is the invitation: a letterpress-style card rendered as a physical object opens the page, and its ornaments, rules and small typographic parts become the components for everything after it.
  Hero: A flat blush-pink field fills the viewport. Top-left sits a gold filigree monogram about 120px square; three plain nav links are centred on the same line; a solid gold rectangular RSVP button sits top-right. Below, centred, a portrait invitation card half the viewport wide starts 200px down and is cropped by the bottom edge, with a soft halo shadow and a debossed border with scalloped inner corners. On the card: the two names in a large italic swash serif, staggered left and right against two ornamental roundels, separated by hairline rules carrying tiny wide-tracked caps for date and time.
  Worth taking: Make a real-world object (an invitation, a ticket, a label) the hero and reuse its small typographic parts, such as a boxed address line with slashes, as recurring components down the page.
- **Mosby’s Files** (Awwwards Site of the Day, studied score 8) `aww-mosbys-files`
  Idea: An archive of architects presented as a physical stack of coloured index-tab file folders that you flip through.
  Hero: Charcoal background. A slim top bar over a hairline holds the condensed wordmark dead centre and one mono link far right. The headline is one centred line of heavy condensed uppercase at 10vw, about 71% of the width, in the upper quarter. Beneath it, a three-line centred serif paragraph in mid-grey, about 42% wide. From 51% down sits a stack of file folders 86% of the viewport wide: each is a flat colour band with one to three trapezoid tabs rising from its top-left edge, each tab a different colour holding a serif name. Mono category labels sit right-aligned. The front red folder is open, running off the bottom.
  Worth taking: Build navigation as stacked full-width colour bands with trapezoid tabs, each tab coloured to clash with the folder behind it.
- **Aardvark Book Club** (Awwwards Site of the Day, studied score 7.7) `aww-aardvark-book-club`
  Idea: A book club dressed as a sweet shop: fat black type, tumbling 3D books and boxes on wavy colour fields, annotated with handwritten asides.
  Hero: A saturated yellow field with two large wavy blobs, pale yellow then orange, rising from the bottom. A three-line headline in Champ Bold, black, at about 8.3vw with leading under 0.85, is flush to a 15px left margin and reaches 60% across. Beneath it: a four-line paragraph 310px wide and a magenta split button (label plus arrow square). Right of centre a 3D hardback in navy and pink tilts 20 degrees, 600px tall; another book is cropped by the top-left corner, a third by the bottom edge. A purple handwritten note sits rotated at far right. Nav: pale-yellow pill links centred, an orange login button, black round social icons.
  Worth taking: Give each section one flat saturated colour inside a large-radius inset panel and keep the type black across all of them.
Full notes on any of them: `node draw.mjs --site <id>`.

## Always
Headlines two lines or fewer at every width. No eyebrow labels, no monospace, no 01/02/03, no thin rules, no gradients, no shadows at rest,
no cream-and-terracotta, no violet. The frame: one h1 on the first screen that says what this is, equal outer margins, no
section huddled on one side with the other half empty, no blank stretch over half a screen, a heading on every section.
`inspect.mjs` measures all of it.

Saved to /Users/pedroszpak/workspace/checkout-pagamentos/.taste-skill/direction.json · reprint with `node draw.mjs --show`
