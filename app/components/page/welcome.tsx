import { useNavigate } from "react-router";
import { Button, Link } from "../base";
import { ROUTES } from "~/consts/routes";

export function Welcome() {
  const navigate = useNavigate();

  return (
    <main className="flex flex-col items-start justify-center gap-4 p-8 max-w-3xl mx-auto">
    <div className="flex w-full flex-row-reverse">
      <Button onClick={() => navigate(ROUTES.account)}> Account 👤</Button>
    </div>

    <h1 className="text-2xl font-bold sm:text-3xl">Career Self-Reflection & Motivations App</h1>

  <p className="text-base sm:text-lg leading-relaxed text-gray-700">
    A self-directed career-coaching workflow: a structured set of worksheets for
    answering "what actually drives me, and where am I going?" — filled in at your
    own pace.
  </p>

  <p className="text-base sm:text-lg leading-relaxed text-gray-700">
    Currently oriented towards Senior Engineers, given the resources and the
    structure of the questions. Each person fills in their own private copy: the
    framework ships empty, and your answers stay yours.
  </p>

  <h2 className="text-xl font-bold sm:text-2xl mt-8">The modules</h2>

  <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
    {/** TODO: map from modules const */}
    <li><Link to="/module/1"><strong>Contracting</strong> — name the actual question, and what "better" looks like.</Link></li>
    <li><Link to="/module/2"><strong>Self-knowledge</strong> — energy/dread audit, lifeline, workview/lifeview.</Link></li>
    <li><Link to="/module/3"><strong>Motivators &amp; Anchors</strong> — what you won't trade away (Schein) + strengths.</Link></li>
    <li><Link to="/module/4"><strong>Vision &amp; Odyssey Plans</strong> — three divergent 5-year futures.</Link></li>
    <li><Link to="/module/5"><strong>Current-state audit</strong> — a mini-360 + an honest read of where you are now.</Link></li>
    <li><Link to="/module/6"><strong>Gap analysis</strong> — current vs. target, crossed with feedback.</Link></li>
    <li><Link to="/module/7"><strong>Development plan</strong> — a few declared behaviors, with feedforward.</Link></li>
    <li><Link to="/module/8"><strong>Visibility &amp; influence</strong> — stakeholder map, sphere of influence.</Link></li>
    <li><Link to="/module/9"><strong>Decision-making under ambiguity</strong> — prototype conversations &amp; experiences.</Link></li>
    <li><Link to="/module/10"><strong>Sustainment &amp; energy</strong> — recovery design, early-warning signals, non-negotiables.</Link></li>
    <li><Link to="/module/11"><strong>Review &amp; re-contract</strong> — what evidence pivots vs. persists.</Link></li>
  </ol>

  <div className="mt-4">
    <Button onClick={() => navigate("/module/1")}>Start with Module 1 &rarr;</Button>
  </div>

    </main>
  );
}
