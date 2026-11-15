# Research: lists 36–70

Completed: 35 playable lists / 350 answers. Checked 2026-11-15. Every list has ten unique entity IDs, ranks 1–10, Arabic/English names, aliases, criterion and source date. Population list 47 also carries 185 out-of-list sovereign-country entities for ambiguity/fuzzy lookup; these are names, not ranked answers in that list.

## Method

- Read TasteAtlas source pages and copied the explicit published top-ten order. These are audience rankings, not universal judgments. The published order resolves displayed rounded-score ties.
- Downloaded and ranked World Bank API records for the specified single year, excluded regional aggregates using country metadata, and excluded dependent territories. No mixing latest observations from different years. Arabic metadata plus manually reviewed common aliases used for names. Indicator source links are included in JSON; extraction used the corresponding `https://api.worldbank.org/v2/country/all/indicator/{indicator}?format=json&date={year}&per_page=400` endpoint.
- Downloaded FAO/OWID and Energy Institute/OWID CSV data, filtered to sovereign country ISO codes and one common most recent year, and ranked the reported numerical values. FAO direct API failed (HTTP521), so FAO's data as republished by OWID is explicitly credited.
- Downloaded UNESCO's official XML feed; counted each transboundary property once for each participant country. Sorting is count descending, English name alphabetically for an exact tie (declared in criterion). The current top ten have no exact tie at the cutoff.
- Read the Indian Ministry of Tourism's 2026 compendium PDF page21, explicit Table1.1.2 rank2025. This reproduces that published ranking (which has missing arrival figures for some countries), not a newly estimated ranking. The publisher cites UN Tourism May2026 / revised July2026.
- Read ACI's 2025 total-passenger table, official current page.
- Read Brand Finance Global500 2026 PDF p37 to verify all ten brands and their order.
- Read WGC/IMF World Official Gold Holdings November2026 PDF (hosted by Goldreporter), excluded IMF from country ranking. Poland is tenth among countries. The table's Turkey methodology excludes commercial-sector gold; do not substitute rankings which mix different definitions.
- Read current CompaniesMarketCap list; froze its ten companies as of the check date.
- Read Pew's 2025 report PDF p4: YouTube84%, Facebook71%, Instagram50%, TikTok37%, WhatsApp32%, Reddit26%, Snapchat25%, X21%, Threads8%, Bluesky4%; TruthSocial3% is outside the top ten.
- For geographical compilations and airline groups, parsed the stated Wikipedia table and reproduced its ordering; the JSON credits Wikipedia rather than pretending every record was independently verified from the original agencies.

## Explicit substitutions / scope refinements

|ID|Original concept|Implemented content and reason|
|---|---|---|
|43|Tea production|Specifically green tea-leaf production, FAO2022 as reproduced by Tea article; processed dry tea has different weights.|
|48|Urban agglomerations|UN2025 harmonised city definition, not administrative-city populations.|
|52|Airlines by passengers|Airline **groups**, calendar2024 table; groups and individual carriers are different units.|
|60|Largest terrestrial national parks worldwide|Largest US national parks **with their preserves**, published NPS2018 snapshot. A fully comparable worldwide terrestrial-only ranking was not available. Date and preserve scope are explicit, so its LakeClark placement must not be replaced with a park-only acreage ranking.|
|65|Oil production|Energy Institute/OWID energy-equivalent total oil production, not an unstated crude-only measure.|
|67|Mine gold production|Official monetary gold reserves. Mine-production estimates have rounded ties around the tenth place; official-reserve ranking has a clear cutoff.|
|68|Manufacturer-group sales|Countries by total motor-vehicle production, OICA2025. This avoids combining inconsistent manufacturer-group reporting scopes.|
|69|Smartphone-vendor shipments|Countries by mobile subscriptions, WorldBank2024. Public vendor reports predominantly provide top-five plus Others, not ten source-supported individual vendors.|
|70|Global social-platform MAUs|Pew2025 use among US adults, a single survey with a consistent metric. Global platform totals combine incompatible dates/definitions and ties.|

## Interpretation / review limits

These are source-backed frozen quiz lists. They are not a claim that each publisher's estimates are independently audited or that rankings are identical across sources. Some source snapshots are deliberately older and identified by date. Do not market the entire catalog as "live rankings".

Particularly: river lengths vary by definition; lake list counts Caspian and separates Michigan/Huron; island list excludes continents; desert list includes polar deserts and groups the GreatAustralianDesert. These scopes are in each metric. WorldBank and FAO figures are used as reported rather than silently replacing a record with a remembered value.

## Catalog sources

|ID|Title|Data as of|Source|
|---|---|---|---|
|36|أفضل 10 مطابخ في العالم|2025/2026|[TasteAtlas Awards 25/26 — Best Cuisines](https://www.tasteatlas.com/best/cuisines/)|
|37|أفضل 10 أطباق تقليدية|2025/2026|[TasteAtlas Awards 25/26 — Best Dishes](https://www.tasteatlas.com/best/dishes/)|
|38|أفضل 10 حلويات|2025/2026|[TasteAtlas Awards 25/26 — Best Desserts](https://www.tasteatlas.com/best/desserts/)|
|39|أفضل 10 أنواع جبن|2026-11-11|[TasteAtlas — Top 100 Cheeses](https://www.tasteatlas.com/best-rated-cheeses-in-the-world)|
|40|أفضل 10 مدن للطعام|2025/2026|[TasteAtlas Awards 25/26 — Best Food Cities](https://www.tasteatlas.com/best/cities/)|
|41|أكثر 10 دول إنتاجًا للفواكه|2020|[FAOSTAT عبر ويكيبيديا — Fruit production](https://en.wikipedia.org/wiki/List_of_countries_by_fruit_production)|
|42|أكثر 10 دول إنتاجًا للبن|2024|[Our World in Data — FAO](https://ourworldindata.org/grapher/coffee-bean-production)|
|43|أكثر 10 دول إنتاجًا لأوراق الشاي|2022|[FAO عبر ويكيبيديا — Tea, Production](https://en.wikipedia.org/wiki/Tea#Production)|
|44|أكثر 10 دول إنتاجًا للكاكاو|2024|[Our World in Data — FAO](https://ourworldindata.org/grapher/cocoa-bean-production)|
|45|أكثر 10 دول إنتاجًا للأرز|2024|[Our World in Data — FAO](https://ourworldindata.org/grapher/rice-production)|
|46|أكبر 10 دول مساحةً|2024|[البنك الدولي — AG.SRF.TOTL.K2](https://data.worldbank.org/indicator/AG.SRF.TOTL.K2)|
|47|أكثر 10 دول سكانًا|2024|[البنك الدولي — SP.POP.TOTL](https://data.worldbank.org/indicator/SP.POP.TOTL)|
|48|أكبر 10 تجمعات حضرية سكانًا|2025|[UN World Urbanization Prospects 2025 عبر ويكيبيديا](https://en.wikipedia.org/wiki/List_of_largest_cities)|
|49|أكثر 10 دول استقبالًا للسياح|2025|[وزارة السياحة الهندية — Tourism Data Compendium 2026، جدول 1.1.2](https://www.tourism.gov.in/static/uploads/2026/09/a1ff37713ad3922f69778dca13aa65ab.pdf#page=21)|
|50|أكثر 10 مدن استقبالًا للزوار الدوليين|2025|[Euromonitor 2025 عبر ويكيبيديا — Cities by international visitors](https://en.wikipedia.org/wiki/List_of_cities_by_international_visitors)|
|51|أكثر 10 مطارات ازدحامًا بالمسافرين|2025|[ACI World — Busiest airports 2025](https://aci.aero/resources/busiest-airports-in-the-world/)|
|52|أكبر 10 مجموعات طيران بالمسافرين|2024|[ويكيبيديا — Largest airlines, airline groups by passengers](https://en.wikipedia.org/wiki/Largest_airlines_in_the_world#Airline_groups_by_passengers_(millions))|
|53|أكثر 10 دول في مواقع التراث العالمي|2026-11-15|[UNESCO World Heritage List — Official XML feed](https://whc.unesco.org/en/list/xml/)|
|54|أكبر 10 جزر في العالم|2026-11-15|[ويكيبيديا — Islands by area](https://en.wikipedia.org/wiki/List_of_islands_by_area)|
|55|أكبر 10 بحيرات مساحةً|2026-11-15|[ويكيبيديا — Lakes by area](https://en.wikipedia.org/wiki/List_of_lakes_by_area)|
|56|أطول 10 أنظمة أنهار|2026-11-15|[ويكيبيديا — River systems by length](https://en.wikipedia.org/wiki/List_of_river_systems_by_length)|
|57|أعلى 10 قمم جبلية|2026-11-15|[ويكيبيديا — Highest mountains on Earth](https://en.wikipedia.org/wiki/List_of_highest_mountains_on_Earth)|
|58|أكبر 10 صحارى في العالم|2026-11-15|[ويكيبيديا — Deserts by area](https://en.wikipedia.org/wiki/List_of_deserts_by_area)|
|59|أكثر 10 دول امتلاكًا للغابات|2023|[البنك الدولي — AG.LND.FRST.K2](https://data.worldbank.org/indicator/AG.LND.FRST.K2)|
|60|أكبر 10 متنزهات وطنية أمريكية ومحمياتها|2018-12-14|[U.S. National Park Service — How Big Is It?](https://home.nps.gov/bibe/learn/management/park_sizes.htm)|
|61|أكبر 10 اقتصادات في العالم|2024|[البنك الدولي — NY.GDP.MKTP.CD](https://data.worldbank.org/indicator/NY.GDP.MKTP.CD)|
|62|أعلى 10 دول في نصيب الفرد من الناتج المحلي|2024|[البنك الدولي — NY.GDP.PCAP.CD](https://data.worldbank.org/indicator/NY.GDP.PCAP.CD)|
|63|أكبر 10 شركات بالقيمة السوقية|2026-11-15|[CompaniesMarketCap — Largest companies](https://companiesmarketcap.com/)|
|64|أعلى 10 علامات تجارية قيمةً|2026|[Brand Finance Global 500 2026](https://static.brandirectory.com/reports/brand-finance-global-500-2026-preview.pdf#page=37)|
|65|أكثر 10 دول إنتاجًا للنفط|2025|[Our World in Data — Energy Institute](https://ourworldindata.org/grapher/oil-production-by-country)|
|66|أكثر 10 دول إنتاجًا للغاز الطبيعي|2025|[Our World in Data — Energy Institute](https://ourworldindata.org/grapher/gas-production-by-country)|
|67|أكثر 10 دول في احتياطي الذهب الرسمي|2026-11 (بيانات معظم الدول 2026-09)|[World Gold Council عبر Goldreporter — World Official Gold Holdings Nov 2026](https://www.goldreporter.de/wp-content/uploads/2026/11/Weltweite-Goldreserven-11-2026.pdf)|
|68|أكثر 10 دول تصنيعًا للسيارات|2025|[OICA عبر ويكيبيديا — Motor vehicle production](https://en.wikipedia.org/wiki/List_of_countries_by_motor_vehicle_production)|
|69|أكثر 10 دول في اشتراكات الجوال|2024|[البنك الدولي — IT.CEL.SETS](https://data.worldbank.org/indicator/IT.CEL.SETS)|
|70|أكثر 10 منصات تواصل استخدامًا في أمريكا|2025|[Pew Research Center — Americans’ Social Media Use 2025](https://www.pewresearch.org/internet/2025/11/20/americans-social-media-use-2025/)|
