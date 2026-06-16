import { type RouteConfig, route, index } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("module/:moduleId", "./routes/module_page.tsx"),
    route("account", "./routes/account.tsx"),

] satisfies RouteConfig;
