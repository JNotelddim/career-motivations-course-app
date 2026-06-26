// ---- CONTENT model (static, committed, seeded here) ----
// The user's *answers* are a separate (localStorage) concern — not modelled here yet. See .scratch/TASKS.md.

type ResourceLink = {
    title: string;
    url?: string; // optional — books / internal docs may have no link
    price?: string; // optional approx cost, e.g. "free", "~$25", "paid (book)"
};

export enum ExerciseKind { 
    SHORT_TEXT = "shortText",
    LONG_TEXT = "longText",
    MATRIX = "matrix",
    ROW_LIST = "rowList"
};


// Optional, opt-in validation config per kind. Absent = no rules (the common case).
// Consumed by validateAnswer() (app/lib/validation.ts); advisory only — never blocks input.
export type TextValidation = { minLength?: number; maxLength?: number };
export type MatrixValidation = {
    cellType?: "text" | "number";
    min?: number; // numeric cells only
    max?: number; // numeric cells only
    uniqueCells?: boolean; // no two filled cells share a value (e.g. a forced ranking)
};
export type RowListValidation = { minRows?: number; maxRows?: number; requiredFields?: string[] };

// Fields common to every exercise, intersected with a per-kind variant.
// `id` is a STABLE string (never positional) so saved responses survive content edits/reordering.
export type Exercise = {
    id: string;
    prompt: string;
    guidance?: string; // the "question-specific prompt" — explanatory context distinct from the ask
    optional?: boolean; // absent/false = required. Required exercises define module completion;
                        // optional ones never count toward 100% (see app/lib/progress.ts).
} & (
    | { kind: ExerciseKind.SHORT_TEXT; validation?: TextValidation }
    | { kind: ExerciseKind.LONG_TEXT; validation?: TextValidation }
    | { kind: ExerciseKind.MATRIX; columns: { id: string; label: string }[]; rows: string[]; validation?: MatrixValidation } // fixed grid
    | { kind: ExerciseKind.ROW_LIST; fields: { id: string; label: string }[]; validation?: RowListValidation } // repeatable record rows (add/remove)
);

type Section = {
    title: string;
    description?: string;
    exercises: Exercise[];
};

export type WorksheetModule = {
    id: number;
    title: string;
    description: string;
    prereqs: number[]; // module ids to complete first; [] = none
    resources: ResourceLink[];
    sections: Section[];
};

const SCHEIN_ANCHORS = [
    "Technical / Functional Competence",
    "General Managerial Competence",
    "Autonomy / Independence",
    "Security / Stability",
    "Entrepreneurial Creativity",
    "Service / Dedication to a Cause",
    "Pure Challenge",
    "Lifestyle",
];

const MODULE_1: WorksheetModule = {
    id: 1,
    title: "Name the question",
    description:
        "Before diving into self-assessment, get clear on the actual question you're here to answer. This module is a contract with yourself: name the decision or uncertainty that actually matters to you, whether that's deepening your craft or broadening your scope, building or leading, or whether your current path still fits, and decide how you'll know the work paid off. A vague goal like 'figure out my career' produces vague answers; a sharp question gives every later module something concrete to aim at.\n\nThe two references frame the approach. The ICF coaching model calls this 'establishing the agreement,' the step good coaches never skip: settle up front on what you're working on and what success looks like, so the rest of the work stays honest to it. Designing Your Life sharpens it with a single question, 'what problem are you really trying to solve?', a guard against pouring months into the wrong one. You'll also name the question that's easy to circle without quite putting into words, and set the trigger for when it's worth revisiting this contract.",
    prereqs: [],
    resources: [
        { title: "ICF Core Competencies — Establishing the Coaching Agreement", url: "https://coachingfederation.org/credentialing/coaching-competencies/icf-core-competencies/", price: "free" },
        { title: "Designing Your Life (Burnett & Evans) — 'what problem are you really trying to solve?'", url: "http://lifedesignlab.stanford.edu/dyl", price: "free" },
    ],
    sections: [
        {
            title: "The contract",
            exercises: [
                { id: "m01-question", kind: ExerciseKind.SHORT_TEXT, prompt: "By the end of this curriculum, I want to be able to answer / decide / choose ___.", guidance: "One sentence — the actual question you're trying to answer." },
                { id: "m01-success", kind: ExerciseKind.SHORT_TEXT, prompt: "I'll know this worked when ___.", guidance: "One sentence — your success signal." },
                { id: "m01-avoiding", kind: ExerciseKind.SHORT_TEXT, prompt: "The question I'm circling but not naming is ___.", guidance: "Honest version: the IC-vs-management, depth-vs-breadth, or stay-vs-pivot question — or something else." },
                { id: "m01-retrigger", kind: ExerciseKind.LONG_TEXT, prompt: "At what point would I revisit and re-write this contract?", guidance: "Name the trigger and any review cadence." },
            ],
        },
    ],
};

const MODULE_2: WorksheetModule = {
    id: 2,
    title: "Know yourself",
    description:
        "With your question named, this module gathers the raw material to answer it: honest evidence about how you actually work and what you actually value. Most career thinking runs on assumptions and half-remembered highlights, and this module replaces those with something closer to data. You'll articulate what you believe work and life are for, then look for where those two beliefs reinforce each other and where they pull apart. The point isn't tidy answers, it's noticing the patterns you usually move too fast to see.\n\nTwo Designing Your Life tools do the work. The Workview and Lifeview essays ask you to write, independently, what work is for and what life is for, then read them side by side; the friction between them is often where the useful insight lives. The Good Time Journal turns attention to energy: a short daily note over two weeks surfaces which moments engage you and which drain you, in your own real week rather than in the abstract. A lifeline of career peaks and valleys rounds it out, with one honest annotation on what actually made the peaks peaks. Together they give the later modules something concrete to build on.",
    prereqs: [],
    resources: [
        { title: "Designing Your Life — Workview & Lifeview essays", url: "http://lifedesignlab.stanford.edu/dyl", price: "free" },
        { title: "Designing Your Life — Energy / Engagement / Flow audit ('Good Time Journal')", url: "http://lifedesignlab.stanford.edu/dyl", price: "free" },
    ],
    sections: [
        {
            title: "Workview & Lifeview",
            exercises: [
                { id: "m02-workview", kind: ExerciseKind.LONG_TEXT, prompt: "What is work for?", guidance: "250–500 words." },
                { id: "m02-lifeview", kind: ExerciseKind.LONG_TEXT, prompt: "What is life for?", guidance: "250–500 words. Write independently of the workview, then compare." },
                { id: "m02-coherence", kind: ExerciseKind.LONG_TEXT, prompt: "Where do your workview and lifeview reinforce each other, and where do they contradict?" },
            ],
        },
        {
            title: "Energy & history",
            exercises: [
                { id: "m02-energy", kind: ExerciseKind.LONG_TEXT, prompt: "2-week energy audit: what pattern surfaces from your daily high-energy and low-energy moments at work?", guidance: "A quick daily note for two weeks; the pattern is the output." },
                { id: "m02-lifeline", kind: ExerciseKind.LONG_TEXT, prompt: "Lifeline: map your career peaks and valleys, and annotate what made the peaks peaks." },
            ],
        },
    ],
};

const MODULE_3: WorksheetModule = {
    id: 3,
    title: "What drives you",
    description:
        "This is the core of the whole sequence: getting clear on what actually drives you, and what you'd be reluctant to give up even under pressure. It's easy to say you value everything, so the work here is making the trade-offs that reveal what you truly prioritize. You'll rank your motivators against each other, pressure-test that ranking against decisions you've actually made, and check how much room your current role gives the ones that matter most. Your strengths get the same honest look: what you're genuinely good at, and where it's well used versus where it isn't yet.\n\nSchein's Career Anchors supplies the backbone. An 'anchor' is the thing you won't trade away when forced to choose, and the method is deliberately uncomfortable: rank all eight from most to least with no ties, because the friction of separating close calls is where the signal lives. You then test that ranking against real decisions, since what drives you shows up in behavior more honestly than in self-report. For strengths, CliftonStrengths or the free VIA inventory names your top themes. The module closes with a one-sentence statement of what drives you, plus the non-negotiables you'll carry into every later module.",
    prereqs: [],
    resources: [
        { title: "Schein — Career Anchors (self-administration workbook, Wiley)", price: "~$25" },
        { title: "CliftonStrengths (Gallup) — 34 themes, top-5 ranking", url: "https://www.gallup.com/cliftonstrengths", price: "~$25–60" },
        { title: "VIA Character Strengths — 24 strengths", url: "https://www.viacharacter.org/", price: "free" },
        { title: "Reiss Motivation Profile — 16 basic desires (optional, tier-2)", url: "https://www.reissmotivationprofile.com/", price: "~$200" },
    ],
    sections: [
        {
            title: "Calibration",
            exercises: [
                { id: "m03-gut", kind: ExerciseKind.MATRIX, prompt: "For each of Schein's 8 anchors, a one-line gut reaction: does it resonate, partially, or barely?", guidance: "No ranking yet — just calibration.", rows: SCHEIN_ANCHORS, columns: [{ id: "reaction", label: "Gut reaction (1 line)" }] },
            ],
        },
        {
            title: "Differentiation aids (optional)",
            description: "Use only if forced ranking feels impossible — surface cost through paired comparison, 100-point allocation, sacrifice scenarios, or the official Schein Career Orientations Inventory.",
            exercises: [
                { id: "m03-aids", optional: true, kind: ExerciseKind.LONG_TEXT, prompt: "Work through whichever differentiation aid(s) you need, and capture the result.", guidance: "Most decisive is the official COI; paired comparison (28 pairs) is the most thorough by hand. (A richer structured control for these is a future refinement.)" },
            ],
        },
        {
            title: "Ranking & defense",
            exercises: [
                { id: "m03-ranking", kind: ExerciseKind.MATRIX, prompt: "Forced ranking: rank all 8 anchors from most (1) to least (8).", guidance: "No ties — the discomfort of differentiating adjacent ranks is the exercise.", rows: SCHEIN_ANCHORS, columns: [{ id: "rank", label: "Rank (1 = most, 8 = least)" }], validation: { cellType: "number", min: 1, max: 8, uniqueCells: true } },
                { id: "m03-defense", kind: ExerciseKind.LONG_TEXT, prompt: "Top-2 defense: for each of your top 2 anchors, defend it against the next 2 ranks.", guidance: "The shape: 'I rank X above Y because [past decision/pattern]. The strongest counterargument is [Z], but [why X still wins].'" },
            ],
        },
        {
            title: "Alignment & evidence",
            exercises: [
                { id: "m03-role-fit", kind: ExerciseKind.LONG_TEXT, prompt: "Current role vs. your top 4 anchors: for each, does the role serve, neglect, or actively contradict it? Cite evidence." },
                { id: "m03-decisions", kind: ExerciseKind.ROW_LIST, prompt: "Anchor evidence from real decisions: label which anchor(s) drove each, and whether it matches your ranking.", guidance: "Anchors are inferred from pattern, not self-reported.", fields: [{ id: "decision", label: "Decision" }, { id: "year", label: "Year" }, { id: "anchors", label: "Anchor(s) that drove it" }, { id: "mismatch", label: "Mismatch with ranking?" }] },
            ],
        },
        {
            title: "Strengths & synthesis",
            exercises: [
                { id: "m03-strengths", kind: ExerciseKind.LONG_TEXT, prompt: "Record your top strengths (CliftonStrengths or VIA). Which top strength is the role underusing? Which is it leveraging?" },
                { id: "m03-synthesis", kind: ExerciseKind.LONG_TEXT, prompt: "Synthesis: a one-sentence motivator statement, your non-negotiables, and the biggest surprise this surfaced." },
            ],
        },
    ],
};

const planExercises = (plan: "a" | "b" | "c"): Exercise[] => [
    { id: `m04-${plan}-headline`, kind: ExerciseKind.SHORT_TEXT as const, prompt: "Headline — six words for this plan." },
    { id: `m04-${plan}-week`, kind: ExerciseKind.LONG_TEXT as const, prompt: "A typical week: 4–6 bullets — what's in the calendar, what am I making, who am I talking to?" },
    { id: `m04-${plan}-archetype`, kind: ExerciseKind.SHORT_TEXT as const, prompt: "Which Staff Engineer archetype (or manager-track equivalent) best describes this plan?" },
    { id: `m04-${plan}-gained`, kind: ExerciseKind.LONG_TEXT as const, prompt: "What gets gained." },
    { id: `m04-${plan}-lost`, kind: ExerciseKind.LONG_TEXT as const, prompt: "What gets lost / given up." },
    { id: `m04-${plan}-openqs`, kind: ExerciseKind.LONG_TEXT as const, prompt: "Three open questions — what would I need to learn, test, or find out to know if this plan is real?" },
    { id: `m04-${plan}-gauge`, kind: ExerciseKind.MATRIX as const, prompt: "Gauge this plan (1–10 each).", guidance: "High = more favorable.", rows: ["Confidence", "Resources required", "Like factor", "Coherence with top anchors"], columns: [{ id: "score", label: "Score (1–10)" }], validation: { cellType: "number", min: 1, max: 10 } },
];

const MODULE_4: WorksheetModule = {
    id: 4,
    title: "Imagine possible futures",
    description:
        "Self-knowledge in hand, this module widens the aperture: instead of optimizing the one path you're already on, you sketch several you could plausibly take. Imagining real alternatives loosens the grip of the default and makes the eventual choice an actual choice rather than a drift. You'll build three five-year futures that genuinely diverge, give each a headline and a typical week, and weigh what each one gains and gives up. The aim isn't to crown a winner yet; it's to see your options clearly enough to know which are worth testing.\n\nDesigning Your Life's Odyssey Plans provide the structure: three parallel lives, not three variations on one. Plan A is your current trajectory pursued with intent, Plan B a credible adjacent shift, and Plan C the version you'd chase if money and title were no object. To keep these concrete rather than daydreams, you'll name the senior-engineer or manager-track archetype each plan points to (drawing on Reilly's The Staff Engineer's Path and Fournier's The Manager's Path) and gauge each on confidence, resources, appeal, and fit with your top anchors. A short synthesis pulls out the common threads and the open questions most worth chasing first.",
    prereqs: [2, 3],
    resources: [
        { title: "Designing Your Life — Odyssey Plans", url: "http://lifedesignlab.stanford.edu/dyl", price: "free" },
        { title: "Tanya Reilly — The Staff Engineer's Path (archetype labels)", url: "https://www.oreilly.com/library/view/the-staff-engineers/9781098118723/", price: "paid (book)" },
        { title: "Camille Fournier — The Manager's Path (manager-track futures)", price: "paid (book)" },
    ],
    sections: [
        { title: "Plan A — Current trajectory", description: "What if I keep doing what I'm doing, but with intent?", exercises: planExercises("a") },
        { title: "Plan B — Credible adjacent pivot", description: "What if the role / shape / specialty shifts in a plausible way?", exercises: planExercises("b") },
        { title: "Plan C — Wild variant", description: "What if money / title / current obligations were solved?", exercises: planExercises("c") },
        {
            title: "Cross-plan synthesis",
            exercises: [
                { id: "m04-synthesis", kind: ExerciseKind.LONG_TEXT, prompt: "Across all three plans: the common threads, the surprises, and which plan's open questions are most worth chasing first." },
            ],
        },
    ],
};

const MODULE_5: WorksheetModule = {
    id: 5,
    title: "Where you are now",
    description:
        "The earlier modules looked inward; this one gets an outside read. Before planning where to go, you need an honest, evidence-based picture of where you actually are and how your role really works day to day. Your own view and other people's rarely match exactly, and the gap between them is some of the most useful information you'll get. You'll estimate how your time actually splits across the shapes of senior work, then gather candid input from a handful of people who see you in action.\n\nTwo tools structure it. A light self-audit borrows the senior-engineer archetypes (Tech Lead, Architect, Solver, Right Hand) to ask what your work actually consists of versus what the role intends. Then a mini-360, built on Marshall Goldsmith's stakeholder-centered approach, asks three to five trusted colleagues a short, consistent set of questions: what to keep doing, start, and stop, plus a strength they think you underuse. The closing step reconciles it all: what two or more people independently flag is signal; a lone comment is information, not a verdict; and any divergence from your anchors and self-read is exactly where the reflection lives.",
    prereqs: [3],
    resources: [
        { title: "Marshall Goldsmith — Stakeholder-Centered Coaching", url: "https://www.marshallgoldsmith.com/", price: "free" },
        { title: "Lara Hogan — 'What kind of manager / lead are you?' templates", url: "https://larahogan.me/", price: "free" },
    ],
    sections: [
        {
            title: "Self-audit",
            exercises: [
                { id: "m05-archetype", kind: ExerciseKind.MATRIX, prompt: "For the last 4–8 weeks, what % of your work fell into each senior-IC archetype? Does that match the role's intended shape?", rows: ["Tech Lead", "Architect", "Solver", "Right Hand"], columns: [{ id: "pct", label: "Est. %" }, { id: "examples", label: "Examples" }] },
            ],
        },
        {
            title: "Mini-360",
            description: "Ask 3–5 trusted stakeholders the five Goldsmith questions. Add a row per stakeholder.",
            exercises: [
                { id: "m05-stakeholders", kind: ExerciseKind.ROW_LIST, prompt: "Stakeholder responses.", fields: [{ id: "who", label: "Stakeholder & relationship" }, { id: "keep", label: "Keep doing" }, { id: "start", label: "Start doing" }, { id: "stop", label: "Stop doing" }, { id: "underused", label: "Underused strength" }, { id: "motivates", label: "What actually motivates me" }] },
            ],
        },
        {
            title: "Reconcile",
            exercises: [
                { id: "m05-reconcile", kind: ExerciseKind.LONG_TEXT, prompt: "Read all responses side-by-side. What's said by 2+ people (signal)? What did only one person say (information, not conclusion)?" },
                { id: "m05-mismatch", kind: ExerciseKind.LONG_TEXT, prompt: "Mismatch map: where do your anchors (Module 03), self-audit, and stakeholder responses diverge? The divergence is the reflection." },
            ],
        },
    ],
};

const MODULE_6: WorksheetModule = {
    id: 6,
    title: "Find the gaps",
    description:
        "Now the inward picture (what drives you, what you're good at) meets the outward one (how others see you) against a concrete standard. This module turns all of that into focus: a short list of areas genuinely worth developing. The discipline here is filtering. Plenty of things could be improved; the goal is the two or three that actually matter for where you want to go and are realistically developable in the next several months.\n\nYou'll anchor the comparison to a real competency ladder, either your role's official one or the closest public equivalent (progression.fyi collects many). Rate yourself against it, reconcile that with the 360 from the previous module, and you have your candidate gaps. Then comes the filter that makes this useful: for each gap, does it matter given your anchors and the Odyssey path you're aiming at? The output is a deliberately small set, two or three competencies where the gap is real, the importance is clear, and meaningful progress is achievable in six to twelve months.",
    prereqs: [3, 4, 5],
    resources: [
        { title: "progression.fyi — public-company engineering ladders", url: "https://www.progression.fyi/", price: "free" },
        { title: "Metalab Lead engineering ladder (internal docs)" },
    ],
    sections: [
        {
            title: "Gap analysis",
            exercises: [
                { id: "m06-ladder", kind: ExerciseKind.SHORT_TEXT, prompt: "Reference ladder chosen — and why this one?", guidance: "Your current role's official ladder, or the closest published equivalent for an Odyssey target role." },
                { id: "m06-selfrate", kind: ExerciseKind.ROW_LIST, prompt: "Self-rate against the ladder, then reconcile with the 360. Add a row per competency.", fields: [{ id: "competency", label: "Competency" }, { id: "self", label: "Self-rating (below / at / above)" }, { id: "view360", label: "360 view" }, { id: "agreement", label: "Agreement / divergence" }] },
                { id: "m06-filter", kind: ExerciseKind.ROW_LIST, prompt: "For each gap, does it actually matter given your anchors and target plan?", fields: [{ id: "gap", label: "Competency gap" }, { id: "anchor", label: "Anchor relevance" }, { id: "odyssey", label: "Odyssey relevance" }, { id: "matters", label: "Matters?" }] },
                { id: "m06-trio", kind: ExerciseKind.LONG_TEXT, prompt: "The trio: 2–3 competencies with a real gap (self + 360 agree), that matter (anchors + Odyssey), and are developable in 6–12 months. For each, why it matters and what 'developed' looks like." },
            ],
        },
    ],
};

const MODULE_7: WorksheetModule = {
    id: 7,
    title: "Make a plan",
    description:
        "Focus areas are still abstractions; this module turns them into something you can actually practice and be seen improving at. The shift is from competency to behavior: not 'get better at strategic communication' but a specific, observable thing you'll do differently, in a real context, that others would notice. Plans fail when they stay vague, so the work here is making yours concrete and small enough to sustain.\n\nThe method is Marshall Goldsmith's stakeholder-centered coaching. You'll translate each focus area into one or two observable behaviors, then declare them to the few colleagues positioned to notice, asking not for feedback on the past but feedforward: one or two things you could do differently next time. Lightweight check-ins keep it honest over the following months, a quick daily self-rating tracks the trend rather than the score, and a couple of short pulse-checks with the same group confirm whether the change is landing. Declaring it out loud is a lot of what makes it stick.",
    prereqs: [6],
    resources: [
        { title: "Marshall Goldsmith — Stakeholder-Centered Coaching, the 9 steps", url: "https://knowledgebank.mgscc.net/9-steps-in-marshall-goldsmiths-coaching-process/", price: "free" },
    ],
    sections: [
        {
            title: "Behaviors",
            exercises: [
                { id: "m07-translate", kind: ExerciseKind.ROW_LIST, prompt: "Translate each focus competency into an observable behavior.", guidance: "Competency is the what ('strategic communication'); behavior is the act ('open every status update with one sentence on stakeholder impact').", fields: [{ id: "competency", label: "Competency (from M06)" }, { id: "behavior", label: "Behavior (what I'll do)" }, { id: "observable", label: "Observable by whom" }] },
                { id: "m07-selected", kind: ExerciseKind.LONG_TEXT, prompt: "Pick 1–2 behaviors total (not one per competency). For each: why it serves the trio, the trigger/context, and what doing it well looks like." },
            ],
        },
        {
            title: "Declare & track",
            exercises: [
                { id: "m07-declare", kind: ExerciseKind.ROW_LIST, prompt: "Declare to 3–5 stakeholders: 'I'm working on becoming better at X. Could you tell me 1–2 things I could do differently next time?'", fields: [{ id: "stakeholder", label: "Stakeholder" }, { id: "declaredOn", label: "Declared on" }, { id: "notes", label: "Notes" }] },
                { id: "m07-checkins", kind: ExerciseKind.ROW_LIST, prompt: "Monthly check-ins (2–5 min each): how am I doing on X, and what's one thing for next month?", fields: [{ id: "month", label: "Month" }, { id: "stakeholder", label: "Stakeholder" }, { id: "howdoing", label: "How am I doing?" }, { id: "onething", label: "One thing for next month" }] },
                { id: "m07-daily", kind: ExerciseKind.LONG_TEXT, prompt: "Daily self-rating trend: end of day, rate yourself 1–10 on 'did I do my best to ___ today?' for each behavior. Summarize the trend (not the score).", guidance: "Trend matters, not score." },
                { id: "m07-surveys", kind: ExerciseKind.ROW_LIST, prompt: "5-month and 11-month mini-surveys with the stakeholder set.", fields: [{ id: "month", label: "Month (5 / 11)" }, { id: "stakeholder", label: "Stakeholder" }, { id: "improvement", label: "Improvement noticed? (1–5)" }, { id: "specifics", label: "Specifics" }] },
            ],
        },
    ],
};

const MODULE_8: WorksheetModule = {
    id: 8,
    title: "Build visibility & influence",
    description:
        "Good work doesn't speak for itself, and senior impact depends as much on relationships and reach as on the work itself. This module maps the human system around your role: who shapes your next six months, who you can call when something's strange, and where you're spending energy on things you can't actually move. The aim is to invest your attention where it has leverage and stop pouring it where it doesn't.\n\nThe frame comes from Lara Hogan. A stakeholder map names the people who matter to your work (the buyers, blockers, beneficiaries, and skip-levels) and where each relationship needs attention. A 'manager Voltron' audit checks whether you've built the cross-functional set of peers you can lean on when things get strange. Sphere mapping sorts your current concerns into control, influence, and merely concern, so you can act on the first two and let go of the third. A final pass on radiating intent makes sure the people who should hear about your in-flight work hear it from you first.",
    prereqs: [],
    resources: [
        { title: "Lara Hogan — Manager Voltron", url: "https://larahogan.me/voltron/", price: "free" },
        { title: "Lara Hogan — Sphere of influence / control / concern", url: "https://larahogan.me/", price: "free" },
    ],
    sections: [
        {
            title: "Visibility & influence",
            exercises: [
                { id: "m08-stakeholdermap", kind: ExerciseKind.ROW_LIST, prompt: "Stakeholder map: everyone who is a buyer, blocker, beneficiary, or boss-of-boss for your next 6 months.", fields: [{ id: "person", label: "Person" }, { id: "role", label: "Role" }, { id: "importance", label: "Importance (H/M/L)" }, { id: "relationship", label: "Relationship (H/M/L)" }, { id: "gap", label: "Gap to close" }] },
                { id: "m08-voltron", kind: ExerciseKind.ROW_LIST, prompt: "Manager-Voltron audit: your 3–5 cross-functional peers you can call when something's strange. Where are the gaps?", fields: [{ id: "person", label: "Person" }, { id: "function", label: "Function" }, { id: "lastWent", label: "When did I last go to them?" }, { id: "gap", label: "Gap?" }] },
                { id: "m08-spheres", kind: ExerciseKind.ROW_LIST, prompt: "Sphere mapping: for each current concern, is it in your sphere of control, influence, or concern (can't act on)?", guidance: "Stop spending energy on sphere-of-concern items.", fields: [{ id: "concern", label: "Concern" }, { id: "sphere", label: "Sphere (control / influence / concern)" }, { id: "action", label: "Action or release" }] },
                { id: "m08-intent", kind: ExerciseKind.ROW_LIST, prompt: "Radiating intent: for your top in-flight work, who needs to know what's happening before they hear it elsewhere?", fields: [{ id: "work", label: "In-flight work" }, { id: "who", label: "Who needs to know" }, { id: "what", label: "What they need to know" }, { id: "when", label: "When / how" }] },
            ],
        },
    ],
};

const MODULE_9: WorksheetModule = {
    id: 9,
    title: "Test your big questions",
    description:
        "By now you've surfaced a pile of open questions, the kind that feel too big to answer from the armchair. This module shrinks them. Instead of agonizing toward a perfect decision, you turn each question into a small, low-cost test that nudges your belief one way or the other. Most career questions feel irreversible and momentous; most are neither, and treating them as experiments takes a lot of the paralysis out.\n\nTwo ideas drive it. From Annie Duke's decision work, you sort each question into genuinely irreversible (rare) versus reversible (most), which changes how much deliberation it really deserves. From Designing Your Life, you prototype: a conversation with someone already living the thing, or the smallest real version of the experience you can run in a few weeks. The key discipline is deciding in advance what evidence would actually change your mind, written down before you run the test, so the result informs you rather than getting explained away after the fact.",
    prereqs: [4],
    resources: [
        { title: "Designing Your Life — Prototype Conversations & Prototype Experiences", url: "http://lifedesignlab.stanford.edu/dyl", price: "free" },
        { title: "Annie Duke — Thinking in Bets / How to Decide", price: "paid (book)" },
    ],
    sections: [
        {
            title: "Decision-making",
            exercises: [
                { id: "m09-inventory", kind: ExerciseKind.ROW_LIST, prompt: "Inventory the open questions: pull every open question from your three Odyssey Plans, plus any hovering in the background.", fields: [{ id: "question", label: "Question" }, { id: "origin", label: "Origin (module / Odyssey plan)" }] },
                { id: "m09-categorize", kind: ExerciseKind.ROW_LIST, prompt: "Categorize each: Type 1 (irreversible) or Type 2 (reversible). Most are Type 2 even when they feel like Type 1.", fields: [{ id: "question", label: "Question" }, { id: "type", label: "Type (1 / 2)" }, { id: "reasoning", label: "Reasoning" }] },
                { id: "m09-prototypes", kind: ExerciseKind.ROW_LIST, prompt: "For each Type 2 question, design a prototype conversation or experience.", guidance: "Conversation: who's done it + 3 belief-updating questions. Experience: the smallest embedded version (2–8 weeks).", fields: [{ id: "question", label: "Question" }, { id: "conversation", label: "Conversation (who, 3 questions)" }, { id: "experience", label: "Experience (smallest version)" }] },
                { id: "m09-schedule", kind: ExerciseKind.LONG_TEXT, prompt: "Schedule the first two prototypes: two specific dates, two specific people/experiments, and — before running them — what evidence would change your mind.", guidance: "Pre-committed criteria resist post-hoc rationalization. The exercise is worthless without scheduling." },
                { id: "m09-results", kind: ExerciseKind.ROW_LIST, prompt: "Prototype results (fill in after each).", fields: [{ id: "prototype", label: "Prototype" }, { id: "date", label: "Date run" }, { id: "before", label: "Belief before" }, { id: "after", label: "Belief after" }, { id: "decision", label: "Decision" }] },
            ],
        },
    ],
};

const MODULE_10: WorksheetModule = {
    id: 10,
    title: "Sustain your energy",
    description:
        "A plan you can't sustain isn't a plan. This module is about durability: making sure the direction you've set survives contact with real workload, stress, and the long arc of months. It's less about pushing harder and more about protecting the conditions that let you keep showing up well. You'll get specific about your own early signs of depletion, what genuinely restores you, and the few things you can't let slide without paying for it later.\n\nTwo references ground it. Lara Hogan's work on energy and resilience treats recovery as something you design and fund deliberately, distinguishing passive rest from the active recovery that actually puts energy back. The Demand-Resource model (Bakker and Demerouti) frames burnout as a chronic gap between what a role demands and the resources that offset it, so you'll map your high-demand axes against the autonomy, support, and recovery available to balance them. The module ends in commitments: your non-negotiables, named, and the agreements and people that will help protect them.",
    prereqs: [],
    resources: [
        { title: "Lara Hogan — Resilience funding & energy stewardship", url: "https://larahogan.me/", price: "free" },
        { title: "Demand-Resource model (Bakker & Demerouti) — burnout as chronic demand/resource gap" },
    ],
    sections: [
        {
            title: "Sustainment & energy",
            exercises: [
                { id: "m10-signals", kind: ExerciseKind.ROW_LIST, prompt: "Early-warning signal library: what does your depletion look like, specifically?", guidance: "Sleep, irritability, code quality, communication, what you dread — be precise; vague signals don't catch in time.", fields: [{ id: "signal", label: "Signal" }, { id: "looksLike", label: "What it specifically looks like" }, { id: "action", label: "At this point I should…" }] },
                { id: "m10-recovery", kind: ExerciseKind.ROW_LIST, prompt: "Recovery design: what restores you, and how much / how often?", guidance: "Distinguish passive rest from active recovery (activities that put energy back).", fields: [{ id: "activity", label: "Restorative activity" }, { id: "type", label: "Type (passive / active)" }, { id: "cadence", label: "Cadence required" }, { id: "doing", label: "Currently doing?" }] },
                { id: "m10-nonneg", kind: ExerciseKind.LONG_TEXT, prompt: "Non-negotiables: the 2–3 things that, if you drop them, you're not OK. Last time you dropped one, what happened?" },
                { id: "m10-resourcemap", kind: ExerciseKind.ROW_LIST, prompt: "Resource map (Demand-Resource): the high-demand axes of the current role, and the resources that offset them.", fields: [{ id: "demand", label: "High-demand axis" }, { id: "resource", label: "Available resource (autonomy / support / recovery)" }, { id: "gap", label: "Resource gap?" }] },
                { id: "m10-agreements", kind: ExerciseKind.ROW_LIST, prompt: "Recovery agreements: things you commit to — and to whom — that protect the non-negotiables.", fields: [{ id: "agreement", label: "Agreement" }, { id: "withWhom", label: "With whom" }, { id: "cadence", label: "Review cadence" }] },
            ],
        },
    ],
};

const MODULE_11: WorksheetModule = {
    id: 11,
    title: "Review & adjust",
    description:
        "This isn't a one-time exercise, and the final module makes it a loop. You return to the contract you wrote at the start and check the whole arc against it: is the question you set out to answer still the right one, and has the work actually moved you? Careers don't hold still, so the value is in revisiting deliberately rather than letting the plan quietly go stale. You can run this lightly each quarter and more fully once a year.\n\nThe framing draws on the ICF's practice of evaluating progress and, when the time is right, closing out a piece of work. You'll re-read your original contract and judge whether its success signal has arrived, partly arrived, or shifted; walk each completed module and note whether its output is holding up; and for each focus area decide whether to keep going, adjust, or set it down. That last call leans on Annie Duke's work on knowing when to stop: persistence is a virtue only while the thing is still worth pursuing, and recognizing when it isn't is its own skill.",
    prereqs: [1],
    resources: [
        { title: "ICF Core Competencies — Evaluating Progress & Concluding the Coaching Process", url: "https://coachingfederation.org/credentialing/coaching-competencies/icf-core-competencies/", price: "free" },
        { title: "Annie Duke — Quit (when to walk away)", price: "paid (book)" },
    ],
    sections: [
        {
            title: "Review pass",
            description: "Add a new dated entry for each review pass — quarterly (lightweight) or annual / major inflection (full pass incl. re-contract).",
            exercises: [
                { id: "m11-contract", kind: ExerciseKind.LONG_TEXT, prompt: "Re-read your Module 01 contract: is the question still right? Has the success signal happened, partially happened, or shifted?" },
                { id: "m11-arc", kind: ExerciseKind.ROW_LIST, prompt: "Walk the arc: for each completed module, one line on the actual output and whether it's holding up.", fields: [{ id: "module", label: "Module" }, { id: "output", label: "Output" }, { id: "holding", label: "Holding up?" }, { id: "notes", label: "Notes" }] },
                { id: "m11-persist", kind: ExerciseKind.ROW_LIST, prompt: "Persist / pivot / quit, per focus area (each competency from M06 and behavior from M07).", fields: [{ id: "focus", label: "Focus area" }, { id: "verdict", label: "Persist / Pivot / Quit" }, { id: "why", label: "Why" }] },
                { id: "m11-recontract", kind: ExerciseKind.LONG_TEXT, prompt: "(Full pass only) Re-write your Module 01 contract with current understanding — question, success signal, avoidance, re-contract trigger. Date it; archive the old one." },
            ],
        },
    ],
};

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
