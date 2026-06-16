import { useNavigate, useParams } from "react-router";
import { Button } from "../base/button";

const firstModuleId = 1;
const lastModuleId = 10;

export function Module() {
  // get moduleId from route params, and load in module-specific content based on that. (For now, just display the moduleId.)
    const moduleId = parseInt(useParams().moduleId || "0", 10);
    const navigate = useNavigate();

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

    <h1 className="text-2xl font-bold sm:text-3xl">Module {moduleId} -- TODO: dynamic title</h1>


    <div className="w-full flex justify-between">
        <Button onClick={handlePrevModuleNav} disabled={!isPrevModuleEnabled}>&larr; Previous</Button>
        <Button onClick={handleNextModuleNav} disabled={!isNextModuleEnabled}>Next &rarr;</Button>
    </div>

  <p className="text-md sm:text-lg">
    TODO: dynamic module-specific content based on moduleId param from route segment.
  </p>

    </main>
  );
}
