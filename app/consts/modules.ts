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
    resources: [],
    questions: [],
}

const MODULE_2: WorksheetModule = {
    id: 2,
    title: "Self-knowledge",
    description: "Energy/dread audit, lifeline, workview/lifeview.",
    resources: [],
    questions: [],
}


export const MODULES = [MODULE_1, MODULE_2 /* TODO: fill in the rest of the modules */];