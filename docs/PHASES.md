# Phase roadmap

The agent specializes in all types of sport over four phases. Each phase = new playbook files in `packages/agent/src/sports/` plus new keywords. The engine, market adapters, UI, and guardrails never change.

## Phase 1 — NOW (shipped in this scaffold)

| Sport | Competitions |
|---|---|
| Football (soccer) | World Cup (+ major leagues) |
| American football | NFL |
| Basketball | NBA, FIBA World Cup |
| Baseball | MLB, KBO |

## Phase 2 — Individual/racket + combat/strength

- Racket: tennis, badminton, squash, table tennis
- Precision/target: golf, archery, bowling
- Combat: boxing, wrestling, judo, karate, MMA
- Strength: weightlifting, powerlifting, bodybuilding

Notes: individual sports need different factor sets (H2H matters much more in tennis; weight cuts and reach in MMA; course fit in golf).

## Phase 3 — Athletics/gymnastics + mind/e-sports

- Track and field: marathons, sprinting, high jump, javelin, hurdles
- Acrobatics: gymnastics, trampolining
- Electronic: professional e-sports, fantasy leagues

Notes: e-sports have rich structured data (patch metas, map pools) — strong candidate for deeper statistical models.

## Phase 4 — Water/snow + motorsports/extreme

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
