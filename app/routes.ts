import { type RouteConfig, route, index } from "@react-router/dev/routes";

// TODO: pre-render routes for each module page, for the sake of SPA fallback prevention

export default [
    index("routes/home.tsx"),
    route("module/:moduleId", "./routes/module_page.tsx"),
    route("account", "./routes/account.tsx"),

] satisfies RouteConfig;
