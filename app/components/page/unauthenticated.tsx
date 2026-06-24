// Placeholder UI — yours to style/word (Realm 4). Copy reflects your spec:
// explain auth didn't come through + who to contact for Okta support.
export function Unauthenticated() {
  // check if user IS authenticated, if so, redirect to home page (Realm 4)
  return (
    <main className="flex flex-col items-start justify-center gap-4 p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold sm:text-3xl">We couldn't sign you in</h1>

      <p className="text-base sm:text-lg leading-relaxed text-gray-700">
        Your authentication details didn't come through, so we can't let you into
        the app right now.
      </p>

      <p className="text-base sm:text-lg leading-relaxed text-gray-700">
        If you believe you should have access, reach out to Jared — or contact IT
        for Okta support if you need help signing in.
      </p>
    </main>
  );
}
