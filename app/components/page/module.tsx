import { useNavigate, useParams } from "react-router";
import { Button } from "../base/button";
import { ExerciseKind, MODULES } from "~/consts/modules";
import { useEffect } from "react";
import { ROUTES } from "~/consts/routes";
import { useAnswerState, type LongTextAnswer, type MatrixAnswer, type RowListAnswer, type ShortTextAnswer } from "../providers/answerStateProvider";
import { TextInput } from "../base/textInput";
import { Matrix, RowList, TextArea, type RowListRow } from "../base";

const firstModuleId = MODULES[0].id;
const lastModuleId = MODULES[MODULES.length - 1].id;

const useModulePageData = () => {
    const moduleId = parseInt(useParams().moduleId || "0", 10);

    const moduleData = MODULES[moduleId - 1]; // moduleId starts from 1 and corresponds to index in MODULES array
    return { moduleId, ...moduleData };
}

// TODO: consider how to communicate that answers are saved only in the user's browser?

export function Module() {
    const navigate = useNavigate();
    const { moduleId, title, description, resources, sections } = useModulePageData();
    const { answers, save, getModuleState } = useAnswerState();

    // TODO: consider performance implications of this - should it be memoized?
    const moduleAnswers = getModuleState(moduleId);

    const isNextModuleEnabled = moduleId !== undefined && moduleId < lastModuleId;
    const isPrevModuleEnabled = moduleId !== undefined && moduleId > firstModuleId;

    const handleNextModuleNav = () => {
        if (isNextModuleEnabled) {
            navigate(`/module/${Number(moduleId) + 1}`);
        }
    }

    const handlePrevModuleNav = () => {
        if (isPrevModuleEnabled) {
            navigate(`/module/${Number(moduleId) - 1}`);
        }
    }

    // TODO: this is a bit of a band-aid for invalid URLs — consider a more robust solution like a dedicated "not found" page, or handling this at the routing level instead of in the component
    useEffect(() => {
      if (isNaN(moduleId) || moduleId < firstModuleId || moduleId > lastModuleId || moduleId > MODULES.length) {
          console.error(`Invalid moduleId: ${moduleId}`);
          navigate(ROUTES.home); // TODO: consider a dedicated "not found" page instead of redirecting to home
      }
    }, [moduleId])

  return (
    <main className="flex flex-col items-start justify-center gap-4 p-8 max-w-3xl mx-auto">
    
    <div className="w-full flex justify-between mb-8">
        <Button onClick={() => navigate(ROUTES.home)}>🏠 Home </Button>
        <Button onClick={() => navigate(ROUTES.account)}>Account 👤</Button>
    </div>

    <h1 className="text-2xl font-bold sm:text-3xl">Module {moduleId}: {title} </h1>


    <div className="w-full flex justify-between">
        <Button onClick={handlePrevModuleNav} disabled={!isPrevModuleEnabled}>&larr; Previous</Button>
        <Button onClick={handleNextModuleNav} disabled={!isNextModuleEnabled}>Next &rarr;</Button>
    </div>

  <p className="text-md sm:text-lg">
    {description}
  </p>

    <h2 className="text-xl font-semibold mt-4"> Resources </h2>

    {!resources || resources.length === 0 ? (
        <p className="text-md sm:text-lg">No resources available for this module.</p>
    ) : (
      <ul className="list-disc list-inside">
          {resources.map((resource, index) => (
              <li key={index}> 
                  <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {resource.title}
                  </a>
              </li>
          ))}
      </ul>
    )}
    
    {!sections || sections.length === 0 ? (
        <p className="text-md sm:text-lg">No sections available for this module.</p>
    ) : (sections.map((section) => (
              <div key={section.title} className="mb-2 w-full">
                  <h3 className="text-lg font-semibold">{section.title}</h3>

                  {section.exercises.map((exercise) => (
                      <div key={exercise.id} className="mb-2">
                          <p>{exercise.prompt}</p>

                          {exercise.kind === ExerciseKind.SHORT_TEXT && (
                            <TextInput
                                value={(moduleAnswers[exercise.id]?.value as string) || ""}
                                onChange={(newValue) => {
                                    const newAnswer: ShortTextAnswer = {
                                        value: newValue,
                                        kind: ExerciseKind.SHORT_TEXT,
                                        isComplete: newValue.trim() !== "",
                                        created: moduleAnswers[exercise.id]?.created || new Date(),
                                        lastEdited: new Date(),
                                    };
                                    save(exercise.id, newAnswer);
                                }}
                                placeholder="Type your answer here..."
                            />
                          )}

                          {exercise.kind === ExerciseKind.LONG_TEXT && (
                            <TextArea
                                value={(moduleAnswers[exercise.id]?.value as string) || ""}
                                onChange={(newValue) => {
                                    const newAnswer: LongTextAnswer = {
                                        value: newValue,
                                        kind: ExerciseKind.LONG_TEXT,
                                        isComplete: newValue.trim() !== "",
                                        created: moduleAnswers[exercise.id]?.created || new Date(),
                                        lastEdited: new Date(),
                                    };
                                    save(exercise.id, newAnswer);
                                }}
                                placeholder="Type your answer here..."
                            />
                          )}

                          {exercise.kind === ExerciseKind.MATRIX && (
                            <Matrix
                                value={(moduleAnswers[exercise.id]?.value as Record<string, string>) || {}}
                                rows={exercise.rows || []}
                                columns={exercise.columns || []}
                                onChange={(newValue) => {
                                    const newAnswer: MatrixAnswer = {
                                        value: newValue,
                                        kind: ExerciseKind.MATRIX,
                                        // complete when every cell in the grid has content
                                        isComplete:
                                            exercise.rows.length > 0 &&
                                            exercise.columns.length > 0 &&
                                            Object.values(newValue).filter((cell) => cell.trim() !== "").length ===
                                                exercise.rows.length * exercise.columns.length,
                                        created: moduleAnswers[exercise.id]?.created || new Date(),
                                        lastEdited: new Date(),
                                    };
                                    save(exercise.id, newAnswer);
                                }}
                            />
                          )}

                        {exercise.kind === ExerciseKind.ROW_LIST && (
                            <RowList
                                value={(moduleAnswers[exercise.id]?.value as RowListRow[]) || []}
                                fields={exercise.fields || []}
                                onChange={(newValue) => {
                                    const newAnswer: RowListAnswer= {
                                        value: newValue,
                                        kind: ExerciseKind.ROW_LIST,
                                        // complete when there's at least one row and every row has all fields filled
                                        isComplete:
                                            newValue.length > 0 &&
                                            newValue.every((row) =>
                                                exercise.fields.every(
                                                    (field) => (row.values[field.id] ?? "").trim() !== "",
                                                ),
                                            ),
                                        created: moduleAnswers[exercise.id]?.created || new Date(),
                                        lastEdited: new Date(),
                                    };
                                    save(exercise.id, newAnswer);
                                }}
                            />
                        )}
                      </div>
                  ))}
              </div>
          ))
    )}

    </main>
  );
}
