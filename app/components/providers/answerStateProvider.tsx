import React, { useEffect } from "react";

import { MODULES, type ExerciseKind } from "~/consts/modules";
import type { RowListRow } from "../base";

export type ShortTextAnswer = {
    value: string;
    kind: ExerciseKind.SHORT_TEXT;
    isComplete: boolean;
    created: Date;
    lastEdited: Date;
}

export type LongTextAnswer = {
    value: string;
    kind: ExerciseKind.LONG_TEXT;
    isComplete: boolean;
    created: Date;
    lastEdited: Date;
}

export type MatrixAnswer = {
    value: Record<string, string>;
    kind: ExerciseKind.MATRIX;
    isComplete: boolean;
    created: Date;
    lastEdited: Date;
}

export type RowListAnswer = {
    value: RowListRow[];
    kind: ExerciseKind.ROW_LIST;
    isComplete: boolean;
    created: Date;
    lastEdited: Date;
}

type AnswerValue = ShortTextAnswer | LongTextAnswer | MatrixAnswer | RowListAnswer;

type AnswerStateContextType = {
    answers: Record<string, AnswerValue>;
    save: (questionId: string, answer: AnswerValue) => void;
    getModuleState: (moduleId: number) => Record<string, AnswerValue>;
}

const AnswerStateContext = React.createContext<AnswerStateContextType | null>(null);


/**
 * Parse stored answers, reviving `created`/`lastEdited` back into `Date` objects.
 * JSON.stringify serializes Dates to ISO strings, so without this they'd rehydrate
 * as strings despite the `Date` type — breaking any later `.getTime()`/formatting.
 */
const parseStoredAnswers = (raw: string): Record<string, AnswerValue> =>
    JSON.parse(raw, (key, value) =>
        (key === "created" || key === "lastEdited") && typeof value === "string"
            ? new Date(value)
            : value,
    );

/**
 * Save an answer to localStorage.
 */
const saveToLocalStorage = (questionId: string, answer: AnswerValue) => {
    const storedAnswers = localStorage.getItem("answers");
    const parsedAnswers = storedAnswers ? JSON.parse(storedAnswers) : {};
    parsedAnswers[questionId] = answer;
    localStorage.setItem("answers", JSON.stringify(parsedAnswers));
}

/**
 * Manages the state of answers for all exercises in the app.
 * Provides methods to save answers and retrieve answers for a specific module.
 */
export const AnswerStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [answers, setAnswers] = React.useState<Record<string, AnswerValue>>({});

    useEffect(() => {
        // Load answers from localStorage on mount
        const storedAnswers = localStorage.getItem("answers");
        if (storedAnswers) {
            setAnswers(parseStoredAnswers(storedAnswers));
        }
    }, []);

    const save = (questionId: string, answer: AnswerValue) => {
        setAnswers((prevAnswers) => ({
            ...prevAnswers,
            [questionId]: answer,
        }));

        saveToLocalStorage(questionId, answer);
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