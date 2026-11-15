# Research notes — categories 1–35

Prepared and checked on 2026-11-15. 35 categories, exactly 10 answers each (350 total). The JSON stores a frozen snapshot; rankings must not be described as live.

## Verification method

- IMDb and BoardGameGeek blocked direct HTML access. Their ranks were read from indexed results on their original domains, using targeted rank queries to expose all first-ten positions. IMDb movie ranks were additionally consistent with the dated 4 November 2026 IMDb Top 250 History snapshot. Canonical source links are stored in the dataset.
- Metacritic and MyAnimeList pages were fetched directly with Python urllib and inspected as HTML. MyAnimeList's `type=tv` and `type=manga` filters were used explicitly. The manga filter excludes novels and manhwa.
- The remaining lists were extracted from the current rendered Wikipedia ranking tables. Wikipedia is labeled as the source; where it aggregates Netflix, FIFA, Forbes, or RIAA figures, the source title says so rather than claiming an independent direct verification of every publisher statement. These are reference tables with cited underlying sources, not live APIs.
- Data extraction used lxml and pandas to carry down HTML rowspan values correctly (especially Netflix seasons, sports ties, and Olympic totals).
- Arabic names are localized or transliterated. English names and common aliases are retained. Series/part/year metadata was provided for commonly ambiguous games, films, anime seasons and Netflix seasons.

## Category changes and scope

| IDs | Source/scope |
|---|---|
| 1 | IMDb Top 250 TV, including documentary/mini series. Original chart's published rank, not rounded score. |
| 2 | IMDb Top 250 movies. First ten verified via primary-domain indexed results. |
| 3 | Metacritic all-time games; distinct listed game titles, not duplicate platforms. Published display order resolves tied Metascores. |
| 4 | MyAnimeList TV-only. Seasons are separate works; Gintama punctuation variants use explicit years to prevent identity loss. |
| 5 | **Substitution:** animation uses directly accessible Metacritic instead of IMDb. Title and metric clearly say critic ranking. |
| 6 | MyAnimeList Manga-only (Japanese manga). |
| 7 | **Substitution:** documentaries use directly accessible Metacritic instead of IMDb. |
| 8 | BoardGameGeek overall Geek Rank (not Average Rating). All ranks 1–10 checked in indexed primary-domain table results. |
| 9 | Global game sales table, excluding aggregate Tetris. Mario Kart 8/Deluxe is counted as the source counts it. Tied reported copies use source row order; rule is displayed. |
| 10 | Worldwide nominal box office; no inflation adjustment. |
| 11 | Source-defined movie franchises/universes. Overlapping franchises are explicitly allowed, e.g. Avengers inside MCU. |
| 12 | Highest-grossing Japanese films table; first ten entries are anime. |
| 13 | **Scope change:** Netflix most-popular seasons, **all languages**, ranked by first-91-day views. The verified combined table is used instead of an incomplete English-only reconstruction. Rowspans for Squid Game and Stranger Things were resolved. |
| 14 | Lifetime Spotify song streams, frozen table snapshot. |
| 15 | **Substitution:** Spotify monthly listeners, replacing unavailable/unverified lifetime totals for artists. Title and metric state the difference. |
| 16 | RIAA album-equivalent certification units, not the physical sales estimates in the adjacent column. Certification counts collected across all four size-band tables. Album English title is the explicit secondary sorting rule. |
| 17 | Musical YouTube videos including nursery rhymes; non-musical ads are excluded. |
| 18 | Channel subscriber totals, frozen source snapshot. |
| 19 | Acting Oscar wins, then acting nominations, then earliest year reaching two wins. This deterministic tie rule uses source columns and is displayed. |
| 20 | Competitive Oscars only, then nominations, then English title. Numeric prefix before honorary/special awards is used. |
| 21 | FIFA men's ranking specifically dated 7 October 2026. |
| 22 | World Cup men's goals through 2026; fewer matches is explicit secondary metric at tied goals. |
| 23 | European Cup / Champions League goals, excluding qualifiers, source table scope. |
| 24 | European Cup / Champions League titles, then runners-up, then earliest title. |
| 25 | Historical Saudi league goals according to source table's shared historical scope. |
| 26 | Football stadium capacity table, not historical attendance records. |
| 27–28 | All-era men's/women's singles Grand Slam totals; earliest first title resolves ties. Includes amateur era. |
| 29 | NBA regular-season career points only. |
| 30 | BAA/NBA franchise championships including former city/name; runner-up count then earliest title resolves ties. |
| 31–32 | F1 race wins only, not sprint wins; earliest first win resolves ties. |
| 33 | Summer + Winter Olympic medals, then gold and silver. Through Milano Cortina 2026. |
| 34 | Summer Olympic totals through Paris 2024, sorted by total (not gold-first). Historical delegations remain separate (USSR is not Russia, East Germany not Germany). |
| 35 | Forbes annual 2026 athlete earnings estimate as reproduced in the cited table; before tax, not net worth. |

## Tie handling

The game requires ten numbered positions. Numerical ties therefore have a deterministic, visible rule instead of silently implying statistical superiority. Where a publication already provides an order (IMDb, MAL, BGG, Metacritic), preserve that source order. Other tie criteria are detailed in each category metric. A future content refresh must preserve or explicitly revise the rule before opening a new round.

## Limits

- No claim of direct publisher verification is made for all figures reproduced by Wikipedia; those source links are transparent in each category.
- Indexed primary pages may predate the verification date. In particular IMDb and BGG are frozen available snapshots rather than real-time data.
- Topic titles 5, 7, 13 and 15 changed to match accessible, verifiable content. No unverified answers were inserted to preserve an original title.
- This batch contains no distractor catalog. Parent application should match against a wider cross-category catalog and avoid using only a hidden top-ten list as a hint oracle.

## Local validation

All IDs 1–35 present once; each has exactly ten ranks 1–10; all have source links, Arabic/English names and checkedAt; 350 answers total. Common part/year aliases were manually supplied. Dynamic ranking data must be treated as versioned snapshots.
