# Phase roadmap

The platform's primary axis is the **community research loop**: the founder publishes research → readers discuss on event pages → users publish their own theses → every pick is graded against settled markets into public track records. New sports are added when the founder actually covers an event in them, not speculatively.

## Community-loop phases

1. **Publish (now)**: founder reports as a content collection (`apps/web/src/content/reports/`, converted from the founder's workbook); event hub pages; picks graded as markets settle.
2. **Contribute (now, local preview)**: thesis composer and per-event discussion shipped against a local store; the `ThesisRepository` interface in `apps/web/src/lib/thesisStore.ts` is the seam where Supabase lands.
3. **Accounts + track records**: auth, cloud persistence, immutable timestamped picks, author profiles with auto-graded scorecards, settlement detection in the cron scan.
4. **Community depth**: follows, digests, counter-theses, referencing/citation, leaderboards.

## Sport-coverage phases (secondary axis)

Each sport = a playbook file in `packages/agent/src/sports/` plus keywords. The engine, market adapters, and UI never change.

## Phase 1: NOW (shipped in this scaffold)

| Sport | Competitions |
|---|---|
| Football (soccer) | World Cup (+ major leagues) |
| American football | NFL |
| Basketball | NBA, FIBA World Cup |
| Baseball | MLB, KBO |

## Phase 2: Individual/racket + combat/strength

- Racket: tennis, badminton, squash, table tennis
- Precision/target: golf, archery, bowling
- Combat: boxing, wrestling, judo, karate, MMA
- Strength: weightlifting, powerlifting, bodybuilding

Notes: individual sports need different factor sets (H2H matters much more in tennis; weight cuts and reach in MMA; course fit in golf).

## Phase 3: Athletics/gymnastics + mind/e-sports

- Track and field: marathons, sprinting, high jump, javelin, hurdles
- Acrobatics: gymnastics, trampolining
- Electronic: professional e-sports, fantasy leagues

Notes: e-sports have rich structured data (patch metas, map pools), a strong candidate for deeper statistical models.

## Phase 4: Water/snow + motorsports/extreme

- Water: swimming, water polo, surfing, rowing, sailing
- Snow/ice: alpine skiing, snowboarding, figure skating, ice hockey
- Motorsport: Formula 1, auto racing, motorcycle racing
- Extreme: skateboarding, BMX racing, rock climbing

Notes: F1 factor set = car/team development, quali vs race pace, track characteristics, weather, tire strategy, reliability.

## Full catalog (target end state)

Team sports (ball/field: soccer, American football, basketball, cricket, rugby; net/wall: volleyball, field hockey) · Individual and racket sports · Combat and strength sports · Water and snow sports · Athletics and gymnastics · Motorsports and extreme sports · Mind sports (chess, bridge, poker) and e-sports

## How to add a sport

1. Copy `packages/agent/src/sports/soccer.ts` as a template
2. Define factors (with weights), keywords, and a research checklist for the sport
3. Register it in `packages/agent/src/sports/index.ts` and add the sport to the `Sport` type in `types.ts`
4. Add it to `ALL_SPORTS` in `apps/web/src/app/settings/page.tsx`
