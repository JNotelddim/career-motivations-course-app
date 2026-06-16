type WorksheetModule = {
    id: number;
    title: string;
    description: string;
    resources: { title: string; url: string }[];
    questions: { id: number; text: string }[]; // todo: additional prop: "savedResponse" ?
}

const MODULE_1: WorksheetModule = {
    id: 1,
    title: "Contracting",
    description: "Name your questions and what 'ideal' looks like.",
    resources: [
        { title: "ICF Core Competencies — Establishing the Coaching Agreement", url: "https://coachingfederation.org/credentialing/coaching-competencies/icf-core-competencies/" },
        { title: "Designing Your Life (Burnett & Evans) — 'what problem are you really trying to solve?'", url: "http://lifedesignlab.stanford.edu/dyl" },
    ],
    questions: [
        { id: 1, text: "The actual question — in one sentence: 'By the end of this curriculum, I want to be able to answer / decide / choose ___.'" },
        { id: 2, text: "Success signal — in one sentence: 'I'll know this worked when ___.'" },
        { id: 3, text: "What I'm avoiding — one sentence on the question I'm circling but not naming (e.g. IC-vs-management, depth-vs-breadth, stay-vs-pivot)." },
        { id: 4, text: "Re-contract trigger — at what point would I revisit and re-write this contract?" },
    ],
}

const MODULE_2: WorksheetModule = {
    id: 2,
    title: "Self-knowledge",
    description: "Energy/dread audit, lifeline, workview/lifeview.",
    resources: [
        { title: "Designing Your Life — Workview & Lifeview essays", url: "http://lifedesignlab.stanford.edu/dyl" },
        { title: "Designing Your Life — Energy / Engagement / Flow audit ('Good Time Journal')", url: "http://lifedesignlab.stanford.edu/dyl" },
    ],
    questions: [
        { id: 1, text: "Workview essay (250–500 words): what is work for?" },
        { id: 2, text: "Lifeview essay (250–500 words): what is life for?" },
        { id: 3, text: "Coherence check: where do your workview and lifeview reinforce each other, and where do they contradict?" },
        { id: 4, text: "2-week energy audit: a quick daily note of high-energy and low-energy moments at work. What pattern surfaces after two weeks?" },
        { id: 5, text: "Lifeline: map career peaks and valleys on a timeline, and annotate what made the peaks peaks." },
    ],
}

const MODULE_3: WorksheetModule = {
    id: 3,
    title: "Motivators & Anchors",
    description: "Schein anchors forced-rank + a strengths inventory — name what you'd refuse to trade away.",
    resources: [
        { title: "CliftonStrengths (Gallup) — 34 themes, top-5 ranking", url: "https://www.gallup.com/cliftonstrengths" },
        { title: "VIA Character Strengths — 24 strengths, free", url: "https://www.viacharacter.org/" },
        { title: "Reiss Motivation Profile — 16 basic desires (optional, tier-2)", url: "https://www.reissmotivationprofile.com/" },
    ],
    questions: [
        { id: 1, text: "Gut reactions: for each of Schein's 8 anchors, a one-line gut reaction — does it resonate, partially, or barely? No ranking yet, just calibration." },
        { id: 2, text: "Forced ranking: rank all 8 anchors from most (1) to least (8). No ties — the discomfort of differentiating adjacent ranks is the exercise." },
        { id: 3, text: "Top-2 defense: for each of your top 2 anchors, defend it against the next 2 ranks — the past decision/pattern that demonstrates it, the strongest counterargument, and why it still wins." },
        { id: 4, text: "Current role vs. top 4 anchors: does the role serve, neglect, or actively contradict each? Where does misalignment surface?" },
        { id: 5, text: "Anchor evidence from real decisions: pick 2–3 real career-shaping decisions and label which anchor(s) drove each. Do the inferred anchors match the ranking you just produced?" },
        { id: 6, text: "Strengths inventory: record your top results (CliftonStrengths or VIA). Which top strength is the role underusing? Which is it leveraging?" },
        { id: 7, text: "Synthesis: a one-sentence motivator statement, your non-negotiables, and the biggest surprise this exercise surfaced." },
        { id: 8, text: "(Optional differentiation aids, if ranking feels impossible) Paired comparison of all 28 pairs, 100-point allocation, sacrifice scenarios, or the official Schein Career Orientations Inventory." },
    ],
}

const MODULE_4: WorksheetModule = {
    id: 4,
    title: "Vision & Odyssey Plans",
    description: "Three divergent 5-year futures (Designing Your Life Odyssey Plans).",
    resources: [
        { title: "Designing Your Life — Odyssey Plans", url: "http://lifedesignlab.stanford.edu/dyl" },
        { title: "Tanya Reilly — The Staff Engineer's Path (archetype labels)", url: "https://www.oreilly.com/library/view/the-staff-engineers/9781098118723/" },
    ],
    questions: [
        { id: 1, text: "Draft three 5-year plans — Plan A (current trajectory, with intent), Plan B (credible adjacent pivot), Plan C (wild variant, if money/title/obligations were solved). Complete the prompts below for each." },
        { id: 2, text: "Headline — six words for the plan." },
        { id: 3, text: "A typical week — 4–6 bullets: what's in the calendar, what am I making, who am I talking to?" },
        { id: 4, text: "Staff Engineer archetype (or manager-track equivalent) — which best describes this plan?" },
        { id: 5, text: "What gets gained." },
        { id: 6, text: "What gets lost / given up." },
        { id: 7, text: "Three open questions — what would I need to learn, test, or find out to know if this plan is real?" },
        { id: 8, text: "Gauge (1–10 each): confidence, resources required, like factor, and coherence with your top anchors." },
        { id: 9, text: "Cross-plan synthesis: the common threads across all three, the surprises, and which plan's open questions are most worth chasing first." },
    ],
}

const MODULE_5: WorksheetModule = {
    id: 5,
    title: "Current-state audit",
    description: "A mini-360 + senior-IC archetype check on how the role actually works today.",
    resources: [
        { title: "Marshall Goldsmith — Stakeholder-Centered Coaching", url: "https://www.marshallgoldsmith.com/" },
        { title: "Lara Hogan — 'What kind of manager / lead are you?' templates", url: "https://larahogan.me/" },
    ],
    questions: [
        { id: 1, text: "Self-audit against the senior-IC archetypes (Tech Lead / Architect / Solver / Right Hand): for the last 4–8 weeks, what % of your work fell into each? Does that match the role's intended shape?" },
        { id: 2, text: "Mini-360: ask 3–5 trusted stakeholders the five Goldsmith questions — what should I keep doing? start doing? stop doing? where am I underusing a strength? and what do you think actually motivates me?" },
        { id: 3, text: "Reconcile: read all responses side-by-side. What's said by two or more people is signal; what only one person says is information, not conclusion." },
        { id: 4, text: "Mismatch map: where do your anchors (Module 03), self-audit, and stakeholder responses diverge? The divergence is the reflection." },
    ],
}

const MODULE_6: WorksheetModule = {
    id: 6,
    title: "Gap analysis",
    description: "Cross a competency model with your 360 + self-rating to pick 2–3 focus areas.",
    resources: [
        { title: "progression.fyi — public-company engineering ladders", url: "https://www.progression.fyi/" },
    ],
    questions: [
        { id: 1, text: "Pick the reference ladder: your current role's official ladder, or the closest published equivalent for an Odyssey target role." },
        { id: 2, text: "Self-rate against the ladder: for each competency, below / at / above expected." },
        { id: 3, text: "Layer in the 360 (Module 05): where do stakeholders disagree with your self-rating?" },
        { id: 4, text: "Layer in anchors (Module 03): which competency gaps actually matter given your top anchors, and which are real but irrelevant to where you want to go?" },
        { id: 5, text: "Trio selection: choose 2–3 competencies that have a real gap (self + 360 agree), matter (anchors + Odyssey say so), and are developable in the next 6–12 months." },
    ],
}

const MODULE_7: WorksheetModule = {
    id: 7,
    title: "Development plan",
    description: "Turn focus competencies into 1–2 declared behaviors, with feedforward (Goldsmith).",
    resources: [
        { title: "Marshall Goldsmith — Stakeholder-Centered Coaching, the 9 steps", url: "https://knowledgebank.mgscc.net/9-steps-in-marshall-goldsmiths-coaching-process/" },
    ],
    questions: [
        { id: 1, text: "Translate competency to behavior: competency is the what (e.g. 'strategic communication'); behavior is the act (e.g. 'open every status update with one sentence on stakeholder impact'). Specific, observable, addressable." },
        { id: 2, text: "Pick 1–2 behaviors total — not one per competency. The trio gets served by 1–2 behaviors." },
        { id: 3, text: "Declare to 3–5 stakeholders: 'I'm working on becoming better at X. Could you tell me 1–2 things I could do differently next time?'" },
        { id: 4, text: "Monthly check-ins (2–5 min per stakeholder): how am I doing on X? what's one thing for next month?" },
        { id: 5, text: "Daily self-questions: end of day, rate yourself 1–10 on 'did I do my best to ___ today?' for each behavior. Trend matters, not score." },
        { id: 6, text: "5-month and 11-month mini-surveys with the stakeholder set." },
    ],
}

const MODULE_8: WorksheetModule = {
    id: 8,
    title: "Visibility & influence",
    description: "Map stakeholders, sphere of influence, and your manager-Voltron.",
    resources: [
        { title: "Lara Hogan — Manager Voltron", url: "https://larahogan.me/voltron/" },
    ],
    questions: [
        { id: 1, text: "Stakeholder map: list everyone who is a buyer, blocker, beneficiary, or boss-of-boss for your next 6 months of work. Rate each on importance (H/M/L) and current relationship strength (H/M/L). Which 2–3 relationships are most worth investing in next quarter?" },
        { id: 2, text: "Manager-Voltron audit: who are your 3–5 cross-functional peers you can call when something's strange? Where are the gaps?" },
        { id: 3, text: "Sphere mapping: for each current concern, is it in your sphere of control, influence, or concern (can't act on)? What will you stop spending energy on?" },
        { id: 4, text: "Radiating intent: for your top 2 in-flight pieces of work, who needs to know what's happening before they hear it from someone else — and when/how?" },
    ],
}

const MODULE_9: WorksheetModule = {
    id: 9,
    title: "Decision-making under ambiguity",
    description: "Shrink big career questions into the smallest belief-updating experiments.",
    resources: [
        { title: "Designing Your Life — Prototype Conversations & Prototype Experiences", url: "http://lifedesignlab.stanford.edu/dyl" },
    ],
    questions: [
        { id: 1, text: "Inventory the open questions: pull every open question from your three Odyssey Plans, plus any career-shaped questions hovering in the background." },
        { id: 2, text: "Categorize each: Type 1 (irreversible) or Type 2 (reversible). Most are Type 2 even when they feel like Type 1." },
        { id: 3, text: "For each Type 2 question, design a prototype — a conversation (who has done this thing? what 3 questions would update your belief?) or an experience (the smallest embedded version you could do in 2–8 weeks)." },
        { id: 4, text: "Schedule the first two prototypes: two specific dates, two specific people or experiments. The exercise is worthless without this step." },
        { id: 5, text: "Decision criteria: before running the prototypes, write down what evidence would change your mind. Pre-committed criteria resist post-hoc rationalization." },
    ],
}

const MODULE_10: WorksheetModule = {
    id: 10,
    title: "Sustainment & energy",
    description: "Design recovery, early-warning signals, and non-negotiables to sustain the plan.",
    resources: [
        { title: "Lara Hogan — Resilience funding & energy stewardship", url: "https://larahogan.me/" },
    ],
    questions: [
        { id: 1, text: "Early-warning signal library: what does your depletion look like, specifically (sleep, irritability, code quality, communication, what you dread)? Be precise — vague signals don't catch in time." },
        { id: 2, text: "Recovery design: what actually restores you, and how much / how often? Distinguish passive rest from active recovery (activities that put energy back)." },
        { id: 3, text: "Non-negotiables: the 2–3 things that, if you drop them, you're not OK (likely a mix of physical, relational, creative)." },
        { id: 4, text: "Resource map (Demand-Resource model): for the current role, list the high-demand axes and the resources (autonomy / support / recovery) that offset them. Which resources are thin?" },
        { id: 5, text: "Recovery agreements: things you commit to — and to whom — that protect the non-negotiables, including with yourself." },
    ],
}

const MODULE_11: WorksheetModule = {
    id: 11,
    title: "Review & re-contract",
    description: "Review the arc against your contract — what evidence pivots vs. persists?",
    resources: [
        { title: "ICF Core Competencies — Evaluating Progress & Concluding the Coaching Process", url: "https://coachingfederation.org/credentialing/coaching-competencies/icf-core-competencies/" },
    ],
    questions: [
        { id: 1, text: "Re-read your Module 01 contract: is the question still the right question? Has the success signal happened, partially happened, or shifted?" },
        { id: 2, text: "Walk the arc: for each completed module, write one line on the actual output and whether it's holding up." },
        { id: 3, text: "Persist or pivot, per focus area: for each focus competency (Module 06) and behavior (Module 07) — persist, pivot, or quit?" },
        { id: 4, text: "Re-contract: re-write your Module 01 contract with current understanding. Date it; archive the old one." },
    ],
}

export const MODULES = [
    MODULE_1,
    MODULE_2,
    MODULE_3,
    MODULE_4,
    MODULE_5,
    MODULE_6,
    MODULE_7,
    MODULE_8,
    MODULE_9,
    MODULE_10,
    MODULE_11,
];
