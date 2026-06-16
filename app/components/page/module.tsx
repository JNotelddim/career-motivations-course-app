export function Module() {
  return (
    <main className="flex flex-col items-start justify-center gap-4 p-8 max-w-3xl mx-auto">

    <h1 className="text-2xl font-bold sm:text-3xl">Module X -- TODO: dynamic title</h1>

  <p className="text-md sm:text-lg">
    TODO: dynamic module-specific content based on moduleId param from route segment.
  </p>

    </main>
  );
}
