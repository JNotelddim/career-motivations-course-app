import { useNavigate } from "react-router";
import { Button, Link, ModuleStatusBadge } from "../base";
import { ROUTES } from "~/consts/routes";
import { MODULES } from "~/consts/modules";
import { useAnswerState } from "../providers/answerStateProvider";
import { moduleProgress } from "~/lib/progress";

// Bespoke one-line blurbs for the overview : punchier than each module's own
// `description`, kept as view copy and keyed to the real module ids.
const MODULE_BLURBS: Record<number, React.ReactNode> = {
  1: <><strong>Name the question</strong> : your real question, and what good looks like</>,
  2: <><strong>Know yourself</strong> : energy, history, and how you see work</>,
  3: <><strong>What drives you</strong> : your non-negotiables and strengths</>,
  4: <><strong>Imagine possible futures</strong> : three divergent five-year paths</>,
  5: <><strong>Where you are now</strong> : an honest self-read plus peer feedback</>,
  6: <><strong>Find the gaps</strong> : current vs. target, a few focus areas</>,
  7: <><strong>Make a plan</strong> : focus areas into concrete behaviors</>,
  8: <><strong>Build visibility &amp; influence</strong> : key stakeholders and your impact</>,
  9: <><strong>Test your big questions</strong> : big questions into small experiments</>,
  10: <><strong>Sustain your energy</strong> : recovery, warning signs, non-negotiables</>,
  11: <><strong>Review &amp; adjust</strong> : what holds up, what changes</>,
};

export function Welcome() {
  const navigate = useNavigate();
  const { answers } = useAnswerState();

  return (
    <main className="flex flex-col items-start justify-center gap-4 p-8 max-w-3xl mx-auto">
    <div className="flex w-full flex-row-reverse">
      <Button onClick={() => navigate(ROUTES.account)}> Account 👤</Button>
    </div>

    <h1 className="text-2xl font-bold sm:text-3xl">Career Self-Reflection & Motivations App</h1>

  <p className="text-base sm:text-lg leading-relaxed text-gray-700">
    Get clear on what actually drives you at work. Turn that clarity into a
    concrete sense of where you're headed and how to get there.
    This is a structured set of reflective worksheets you fill in privately,
     at your own pace.
  </p>

  <p className="text-base sm:text-lg leading-relaxed text-gray-700">
    It's not a test or a performance review, and nobody else sees your answers.
    There are no scores and no right answers. Just better questions.
  </p>

  <p className="text-base sm:text-lg leading-relaxed text-gray-700">
    It's currently oriented toward senior engineers, given the resources and the
    shape of the questions. But anyone is welcome to work through it.
  </p>

  <h2 className="text-xl font-bold sm:text-2xl mt-8">The modules</h2>

  <ol className="list-decimal pl-5 space-y-1.5 leading-relaxed w-full">
    {MODULES.map((module) => (
      <li key={module.id}>
        <div className="flex items-baseline justify-between gap-3">
          <Link to={`/module/${module.id}`}>{MODULE_BLURBS[module.id]}</Link>
          <ModuleStatusBadge
            state={moduleProgress(module, answers).state}
            className="shrink-0 self-center"
          />
        </div>
      </li>
    ))}
  </ol>

  <div className="mt-4">
    <Button onClick={() => navigate("/module/1")}>Start with Module 1 &rarr;</Button>
  </div>

    </main>
  );
}
