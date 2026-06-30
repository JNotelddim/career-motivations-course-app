import type { Config } from "@react-router/dev/config";
// Reminder: no path aliases in this build config file.
import { ROUTES } from "./app/consts/routes";
import { MODULES } from "./app/consts/modules";

const getStaticPaths = () => {
  return [ROUTES.home, ROUTES.account, ROUTES.unauthenticated, ROUTES.dataFormat];
}

const getModuleSlugs = () => {
  const moduleSlugs = MODULES.map(module => module.id).map(id => ROUTES.module.replace(":moduleId", String(id)));
  return moduleSlugs;
}

export default {
  // Config options...
  // Server-side render by default, to enable SPA mode set this to `false`
  ssr: false,
  basename: "/jared/career-motivations-worksheet/",
  prerender: [
    ...getStaticPaths(),
    ...getModuleSlugs(),
  ],
  future: {
    v8_middleware: true,
    v8_passThroughRequests: true,
    v8_splitRouteModules: true,
    v8_trailingSlashAwareDataRequests: true,
    v8_viteEnvironmentApi: true,
  },
} satisfies Config;
