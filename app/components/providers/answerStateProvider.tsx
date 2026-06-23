import React from "react";

import { MODULES, type ExerciseKind } from "~/consts/modules";

type ShortTextAnswer = {
    value: string;
    kind: ExerciseKind
    isComplete: boolean;
    created: Date;
    lastEdited: Date;
}

type LongTextAnswer = {
    value: string;
    kind: ExerciseKind
    isComplete: boolean;
    created: Date;
    lastEdited: Date;
}

type GaugeAnswer = {
    value: number;
    kind: ExerciseKind;
    isComplete: boolean;
    created: Date;
    lastEdited: Date;
}

type MatrixAnswer = {
    value: Record<string, number>;
    kind: ExerciseKind;
    isComplete: boolean;
    created: Date;
    lastEdited: Date;
}

type RowListAnswer = {
    value: Record<string, boolean>;
    kind: ExerciseKind;
    isComplete: boolean;
    created: Date;
    lastEdited: Date;
}

type AnswerValue = ShortTextAnswer | LongTextAnswer | GaugeAnswer | MatrixAnswer | RowListAnswer;

type AnswerStateContextType = {
    answers: Record<string, AnswerValue>;
    save: (questionId: string, answer: AnswerValue) => void;
    getModuleState: (moduleId: number) => Record<string, AnswerValue>;
}

const AnswerStateContext = React.createContext<AnswerStateContextType | null>(null);

export const AnswerStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [answers, setAnswers] = React.useState<Record<string, AnswerValue>>({});

    console.log( answers )

    const save = (questionId: string, answer: AnswerValue) => {
        // TODO: eventually persist to localStorage and trigger a progress update to sync to db
        setAnswers((prevAnswers) => ({
            ...prevAnswers,
            [questionId]: answer,
        }));
    }

    const getModuleState = (moduleId: number) => {
        // for question in module, get question ids, then gather all answers for those question ids and return them as a record
        const module = MODULES.find((module) => module.id === moduleId);

        if(!module) {
            throw new Error(`Module with id ${moduleId} not found`);
        }

        const exerciseIds = module.sections.flatMap((section) => section.exercises.map((exercise) => exercise.id)) || [];
        return exerciseIds.reduce((acc, exerciseId) => {
            if(answers[exerciseId]) {
                acc[exerciseId] = answers[exerciseId];
            }
            return acc;
        }, {} as Record<string, AnswerValue>);
    }

    return (
        <AnswerStateContext.Provider value={{ answers, save, getModuleState }}>
            {children}
        </AnswerStateContext.Provider>
    );
};

export const useAnswerState = () => {
    const context = React.useContext(AnswerStateContext);
    if (!context) {
        throw new Error("useAnswerState must be used within an AnswerStateProvider");
    }
    return context;
}