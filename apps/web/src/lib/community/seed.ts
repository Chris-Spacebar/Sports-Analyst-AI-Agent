import type { CommunityThesis, ReactionKind, ThesisComment } from "./types";

export interface ReactionRecord {
  thesisId: string;
  authorId: string;
  kind: ReactionKind;
}

export interface CommunityData {
  theses: CommunityThesis[];
  reactions: ReactionRecord[];
  comments: ThesisComment[];
}

/**
 * Starter data so the floor and leaderboard read as a live room on first load.
 * Denormalized tail/fade/commentCount are placeholders here: the store always
 * recomputes them from the reactions and comments arrays on read. Every pick's
 * outcome names a real teamA/teamB from the report so grading resolves. Records
 * are tuned so @xg_maxi clearly beats the desk and @contrarian clearly trails.
 */
export function communitySeed(): CommunityData {
  const theses: CommunityThesis[] = [
    {
      id: "seed_th_spain_xg",
      eventKey: "wc2026-r16-spain-portugal",
      authorId: "dev_xg_maxi",
      handle: "@xg_maxi",
      title: "Spain are the most complete side left",
      body: "Four clean sheets, Rodri fit enough to anchor, Yamal off the right. Portugal's only route is dragging it to pens and Spain will not oblige. Backing Spain to advance in 90.",
      createdAt: "2026-07-06T09:15:00.000Z",
      pick: { eventKey: "wc2026-r16-spain-portugal", outcome: "Spain", side: "YES", probability: 0.7 },
      tail: 0,
      fade: 0,
      commentCount: 0
    },
    {
      id: "seed_th_morocco_xg",
      eventKey: "wc2026-r16-canada-morocco",
      authorId: "dev_xg_maxi",
      handle: "@xg_maxi",
      title: "Quality and a perfect shootout record beat home energy",
      body: "Canada's rest edge keeps it close for an hour, but Morocco have more in every line and never lose a shootout. Fatigue is the only doubt. Morocco advance.",
      createdAt: "2026-07-05T18:40:00.000Z",
      pick: { eventKey: "wc2026-r16-canada-morocco", outcome: "Morocco", side: "YES", probability: 0.65 },
      tail: 0,
      fade: 0,
      commentCount: 0
    },
    {
      id: "seed_th_france_xg",
      eventKey: "wc2026-r16-france-paraguay",
      authorId: "dev_xg_maxi",
      handle: "@xg_maxi",
      title: "Largest mismatch of the round",
      body: "Best attack in the field against the weakest, even in the heat. Paraguay's only path is a 0-0 into pens and France put up 3+ every game. France in regulation.",
      createdAt: "2026-07-05T12:05:00.000Z",
      pick: { eventKey: "wc2026-r16-france-paraguay", outcome: "France", side: "YES", probability: 0.8 },
      tail: 0,
      fade: 0,
      commentCount: 0
    },
    {
      id: "seed_th_brazil_con",
      eventKey: "wc2026-r16-brazil-norway",
      authorId: "dev_contrarian",
      handle: "@contrarian",
      title: "Rest and depth finally break the Norway hex",
      body: "Brazil have never beaten Norway, but they have two extra days of rest and the heat blunts Norway's running game. Backing the Selecao to grind it out.",
      createdAt: "2026-07-05T15:30:00.000Z",
      pick: { eventKey: "wc2026-r16-brazil-norway", outcome: "Brazil", side: "YES", probability: 0.7 },
      tail: 0,
      fade: 0,
      commentCount: 0
    },
    {
      id: "seed_th_mexico_con",
      eventKey: "wc2026-r16-mexico-england",
      authorId: "dev_contrarian",
      handle: "@contrarian",
      title: "Altitude and the Azteca fortress",
      body: "England arrive at 2,200m with a patched defense and one day less rest. Mexico have not conceded all tournament and never lose a World Cup game here. Upset pick.",
      createdAt: "2026-07-05T16:10:00.000Z",
      pick: { eventKey: "wc2026-r16-mexico-england", outcome: "Mexico", side: "YES", probability: 0.6 },
      tail: 0,
      fade: 0,
      commentCount: 0
    },
    {
      id: "seed_th_usa_con",
      eventKey: "wc2026-r16-belgium-usa",
      authorId: "dev_contrarian",
      handle: "@contrarian",
      title: "2014 revenge in Seattle",
      body: "The March friendly rout flatters Belgium. Knockout football at a roaring Lumen Field against extra-time legs is a different game. Host energy gets it done.",
      createdAt: "2026-07-06T11:45:00.000Z",
      pick: { eventKey: "wc2026-r16-belgium-usa", outcome: "USA", side: "YES", probability: 0.65 },
      tail: 0,
      fade: 0,
      commentCount: 0
    },
    {
      id: "seed_th_arg_edge",
      eventKey: "wc2026-r16-egypt-argentina",
      authorId: "dev_edgehunter",
      handle: "@edgehunter",
      title: "Messi only needs one moment",
      body: "Egypt's block keeps it tight for an hour, but Argentina's quality is relentless and they are on a 10-game World Cup win streak. One set piece decides it. Argentina to advance.",
      createdAt: "2026-07-07T08:20:00.000Z",
      pick: { eventKey: "wc2026-r16-egypt-argentina", outcome: "Argentina", side: "YES", probability: 0.78 },
      tail: 0,
      fade: 0,
      commentCount: 0
    },
    {
      id: "seed_th_por_laroja",
      eventKey: "wc2026-r16-spain-portugal",
      authorId: "dev_la_roja_9",
      handle: "@la_roja_9",
      title: "Ronaldo's last stand, but watch the set pieces",
      body: "No pick from me on this one, just a warning: Portugal's whole plan is Bruno deliveries onto Ronaldo and a late escape. If Spain switch off for one corner this gets ugly.",
      createdAt: "2026-07-06T10:05:00.000Z",
      tail: 0,
      fade: 0,
      commentCount: 0
    },
    {
      id: "seed_th_canada_sharpe",
      eventKey: "wc2026-r16-canada-morocco",
      authorId: "dev_sharpe_ratio",
      handle: "@sharpe_ratio",
      title: "Fading the home story",
      body: "Everyone is on the co-host fairytale. I am on Morocco: more quality in every line, a semi-home crowd in Houston, and a perfect shootout record. Morocco advance.",
      createdAt: "2026-07-05T17:25:00.000Z",
      pick: { eventKey: "wc2026-r16-canada-morocco", outcome: "Morocco", side: "YES", probability: 0.58 },
      tail: 0,
      fade: 0,
      commentCount: 0
    },
    {
      id: "seed_th_col_sharpe",
      eventKey: "wc2026-r16-switzerland-colombia",
      authorId: "dev_sharpe_ratio",
      handle: "@sharpe_ratio",
      title: "Colombia faced the tougher road",
      body: "Switzerland have the rest and venue edge, but they have not met a top-20 side yet. Colombia held Portugal, defend better, and have the two best attackers on the pitch.",
      createdAt: "2026-07-07T07:10:00.000Z",
      pick: { eventKey: "wc2026-r16-switzerland-colombia", outcome: "Colombia", side: "YES", probability: 0.55 },
      tail: 0,
      fade: 0,
      commentCount: 0
    }
  ];

  const reactions: ReactionRecord[] = [
    { thesisId: "seed_th_spain_xg", authorId: "dev_la_roja_9", kind: "tail" },
    { thesisId: "seed_th_spain_xg", authorId: "dev_guest_a", kind: "tail" },
    { thesisId: "seed_th_spain_xg", authorId: "dev_guest_b", kind: "tail" },
    { thesisId: "seed_th_spain_xg", authorId: "dev_contrarian", kind: "fade" },
    { thesisId: "seed_th_morocco_xg", authorId: "dev_guest_a", kind: "tail" },
    { thesisId: "seed_th_morocco_xg", authorId: "dev_guest_c", kind: "tail" },
    { thesisId: "seed_th_france_xg", authorId: "dev_guest_b", kind: "tail" },
    { thesisId: "seed_th_france_xg", authorId: "dev_edgehunter", kind: "tail" },
    { thesisId: "seed_th_france_xg", authorId: "dev_guest_d", kind: "tail" },
    { thesisId: "seed_th_france_xg", authorId: "dev_guest_a", kind: "tail" },
    { thesisId: "seed_th_brazil_con", authorId: "dev_xg_maxi", kind: "fade" },
    { thesisId: "seed_th_brazil_con", authorId: "dev_guest_b", kind: "fade" },
    { thesisId: "seed_th_brazil_con", authorId: "dev_guest_c", kind: "fade" },
    { thesisId: "seed_th_brazil_con", authorId: "dev_guest_a", kind: "tail" },
    { thesisId: "seed_th_mexico_con", authorId: "dev_guest_d", kind: "fade" },
    { thesisId: "seed_th_mexico_con", authorId: "dev_guest_a", kind: "fade" },
    { thesisId: "seed_th_usa_con", authorId: "dev_guest_c", kind: "tail" },
    { thesisId: "seed_th_usa_con", authorId: "dev_edgehunter", kind: "fade" },
    { thesisId: "seed_th_arg_edge", authorId: "dev_guest_a", kind: "tail" },
    { thesisId: "seed_th_arg_edge", authorId: "dev_guest_b", kind: "tail" },
    { thesisId: "seed_th_arg_edge", authorId: "dev_xg_maxi", kind: "tail" },
    { thesisId: "seed_th_arg_edge", authorId: "dev_contrarian", kind: "fade" },
    { thesisId: "seed_th_por_laroja", authorId: "dev_guest_c", kind: "tail" },
    { thesisId: "seed_th_canada_sharpe", authorId: "dev_guest_d", kind: "tail" },
    { thesisId: "seed_th_canada_sharpe", authorId: "dev_xg_maxi", kind: "tail" },
    { thesisId: "seed_th_col_sharpe", authorId: "dev_guest_a", kind: "fade" },
    { thesisId: "seed_th_col_sharpe", authorId: "dev_guest_b", kind: "tail" }
  ];

  const comments: ThesisComment[] = [
    {
      id: "seed_c_spain_1",
      thesisId: "seed_th_spain_xg",
      authorId: "dev_la_roja_9",
      handle: "@la_roja_9",
      body: "Rodri fit changes everything. Tailing without hesitation.",
      createdAt: "2026-07-06T09:40:00.000Z"
    },
    {
      id: "seed_c_spain_2",
      thesisId: "seed_th_spain_xg",
      authorId: "dev_contrarian",
      handle: "@contrarian",
      body: "Portugal on pens is very live though. They did it 13 months ago.",
      createdAt: "2026-07-06T10:12:00.000Z"
    },
    {
      id: "seed_c_france_1",
      thesisId: "seed_th_france_xg",
      authorId: "dev_edgehunter",
      handle: "@edgehunter",
      body: "No argument here. France in 90, book it.",
      createdAt: "2026-07-05T12:55:00.000Z"
    },
    {
      id: "seed_c_brazil_1",
      thesisId: "seed_th_brazil_con",
      authorId: "dev_xg_maxi",
      handle: "@xg_maxi",
      body: "Norway concede in every game, sure, but they also score in every game. Fading this one.",
      createdAt: "2026-07-05T16:05:00.000Z"
    },
    {
      id: "seed_c_arg_1",
      thesisId: "seed_th_arg_edge",
      authorId: "dev_sharpe_ratio",
      handle: "@sharpe_ratio",
      body: "78 feels rich with Messi on 120-minute legs and Egypt's block. I would want 70.",
      createdAt: "2026-07-07T08:45:00.000Z"
    }
  ];

  return { theses, reactions, comments };
}
