# Research notes — categories 71–100

Checked on 2026-11-15. Output: `lists-71-100.json`, 30 playable lists, 300 answers, 10 sequential slots in every list. All lists include Arabic and English names, aliases, a source URL, a visible metric, and an explicit snapshot or edition.

## Verification method

Downloaded and parsed the cited HTML tables with Python `urllib`, `pandas.read_html`, and `lxml`. Raw source HTML/table extracts remain outside the app checkout under `work/science-sources/`. Read Wikimedia Foundation and Similarweb directly through browsing. Downloaded the primary AnAge tab-delimited data ZIP and sorted actual records after filtering on its quality field. Confirmed the QS 2026 table in a QS-branded PDF hosted by Masaryk University, corroborated by the official QS China 2026 ranking page.

“Verified” here means that the selected answers and their order can be traced to the specified source and the declared transformation; it does **not** mean every numerical estimate was independently remeasured. Most physical/historical lists use a referenced encyclopedia compilation rather than a new primary-source audit of every underlying measurement. The UI must preserve the shown source, date, and scope, especially for estimates and changing lists.

## Per-list definitions and changes

| ID | Source and exact selection |
|---|---|
| 71 | Wikimedia Foundation's final 2024 annual most-read list, updated 15 January 2025; ranks 1–10. This is the full-year list, not the original November partial-year release. |
| 72 | Similarweb October 2026 monthly worldwide website visits; ranks 1–10 in its full article. Does not include app usage. |
| 73 | Ethnologue 2026 total-speaker table as transcribed in Wikipedia; first ten. Language categories follow the source, including Modern Standard Arabic and Mandarin as separate named languages. |
| 74 | Ethnologue 2026 first-language table as transcribed in Wikipedia; first ten. Turkish and Vietnamese both show rounded 86 million; the game's source-order tie rule is explicitly stated. |
| 75 | Ember 2025 renewable generation table as transcribed in Wikipedia; exclude World and rank country TWh values. The first ten all have 2025 data. |
| 76 | **Scope revised** from all fastest production cars to the ten fastest **historical speed-record holders listed in the verified record-holder table**. Excludes the separate unverified/controversial claim table. Sorted by stated top speed descending. |
| 77 | **Scope revised** to distinct named car models at their highest nominal auction sale in the source. Repeated Ferrari 250 GTO transactions collapse into one. Differently named variants remain separate, so W196R and W196 are different answers. No inflation adjustment. |
| 78 | **Scope revised** from annual best-selling car models to source's best-selling nameplates over their lifetimes. Follow its explicit table order for rounded Camry/Fiesta tie. |
| 79 | **Substitution**: largest operating high-speed rail networks by country, instead of ambiguous fastest train models. Parse operational km column, sort descending, do not include planned/construction km. Definitions include upgraded routes as in the source. |
| 80 | Largest operating cruise ships by GT. Icon, Star, and Legend share the stated GT; tie is resolved by first-service year ascending, matching the source row sequence. |
| 81 | Largest container ships by maximum TEU, then GT, then Latin name ascending. This explicit rule resolves the many sister-ship ties and the cutoff at ten; Abu Dhabi and Felixstowe precede other OOCL sisters. |
| 82 | **Substitution**: heaviest produced wide-body passenger-aircraft families by maximum takeoff weight (MTOW), instead of inconsistent seating configurations. Use upper limit where table gives a range; exclude unproduced C929 project. |
| 83 | Highest **road** bridges by deck height. Filter source's pipeline bridges and its dismantled Hegigio entry; select ten remaining road bridges. |
| 84 | Source's longest completed bridge structures by total length, including long viaducts and the listed bridge/tunnel system. Not main-span length. |
| 85 | First ten in source's open road-tunnel table, including the connected WestConnex system under its table definition. Excludes under-construction table. |
| 86 | Largest terrestrial animals table, average mass rather than maximum individual. All ten listed are living terrestrial mammal species. |
| 87 | **Substitution**: heaviest living reptiles by average mass instead of a scientifically inconsistent fastest-land-animal ranking. Source's explicit ranked reptile table, first ten. Some source mass estimates have weaker underlying citation coverage; it remains a source-defined trivia list. |
| 88 | **Substitution**: heaviest living birds by average mass instead of wingspan. Follow source's exact species/subspecies labels and ranks, including separate North African and Somali ostriches. |
| 89 | Primary AnAge stable data build. Filter Kingdom=Animalia and Data quality in acceptable/high; sort Maximum longevity descending, then scientific genus/species ascending for ties. Excludes questionable sponge records. Ages are recorded maxima, some estimated by researchers, not a statement of every individual's lifespan. |
| 90 | First ten species in List of tallest trees by species table. Use the visible current/source-snapshot height, not speculative historical felled-tree reports. Scientific aliases disambiguate related tree names. |
| 91 | Brightest-star table, exclude Sun, collapse duplicate Alpha Centauri component rows into one combined source entry, then retain source ranks 1–10. Variable-star ranking uses its nominal source magnitude. |
| 92 | Systems containing a star, ranked by distance of closest member. Exclude Solar System and brown-dwarf-only Luhman 16/WISE 0855 systems; collapse each multiple system into one. Ten closest are Alpha Centauri through Gliese 887. |
| 93 | Sort natural satellite table by numerical mean radius descending. Same nominal order as diameter. Includes Earth's Moon. |
| 94 | First ten largest main-belt bodies by geometric-mean diameter in source table. Ceres included although also a dwarf planet; Trojan Hektor excluded. Scientific serial numbers are aliases rather than mandatory inputs. |
| 95 | First ten of source's mass-abundance-in-crust table. This is CRC-style crust composition, not composition of the entire Earth. |
| 96 | First ten in source's maximum-empire-area table. **Source definition includes United States** in tenth position. Abbasid/Umayyad area tie follows stated source order; metric calls this out. |
| 97 | The Art Newspaper's 2025 attendance ranking as transcribed in source; first ten **art museums**. Some institutional totals include branches per original survey scope. |
| 98 | Ten tallest completed buildings by architectural height. Guangzhou/Tianjin CTF share 530m; second metric is floor count descending (111 vs 97). Includes current Merdeka Maybank Tower name plus Merdeka 118 alias. |
| 99 | First ten reservoirs by nominal volume in source. Accept matching dam names as aliases, since title concerns reservoirs of dams. Not dam height or power capacity. |
| 100 | **Substitution**: QS World University Rankings **2026 edition**, rather than disputed “oldest continuously operating universities.” Uses the ten unambiguously ordered published QS positions. Explicit edition avoids claiming this is the newest 2027 table. |

## Validation

`work/validate_science_lists.py` passed:

- exactly IDs 71–100;
- exactly 30 lists and 300 answers;
- exactly ranks 1–10 for every list;
- unique answer IDs within each list;
- absolute HTTPS source URLs;
- no normalized alias collisions between different answers in the same list.

No app source, deployment configuration, or publication tools were modified by this research task.
