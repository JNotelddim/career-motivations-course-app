import { useNavigate, useParams } from "react-router";
import { Button } from "../base/button";
import { MODULES } from "~/consts/modules";

const firstModuleId = 1;
const lastModuleId = 10;

const useModulePageData = () => {
  // get moduleId from route params, and load in module-specific content based on that. (For now, just display the moduleId.)
    const moduleId = parseInt(useParams().moduleId || "0", 10);

    const moduleData = MODULES[moduleId - 1]; // moduleId starts from 1 and corresponds to index in MODULES array
    return { moduleId, ...moduleData };
}

// TODO: consider how to communicate that answers are saved only in the user's browser?

export function Module() {
    const navigate = useNavigate();
    const { moduleId, title, description, resources, questions } = useModulePageData();

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

  return (
    <main className="flex flex-col items-start justify-center gap-4 p-8 max-w-3xl mx-auto">
    
    <div className="w-full flex justify-between mb-8">
        <Button onClick={() => navigate('/')}>🏠 Home </Button>
        <Button onClick={() => navigate('/account')}>Account 👤</Button>
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
    <ul className="list-disc list-inside">
        {resources.map((resource, index) => (
            <li key={index}> 
                <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {resource.title}
                </a>
            </li>
        ))}
    </ul>
    
    <h2 className="text-xl font-semibold mt-4"> Questions </h2>
    <ol className="list-decimal list-inside">
        {questions.map((question) => (
            <li key={question.id} className="mb-2">
                {question.text}
                {/** TODO: add text input with form events for saving response to local storage*/}
            </li>
        ))}
    </ol>

    </main>
  );
}
