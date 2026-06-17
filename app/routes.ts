import { type RouteConfig, route, index } from "@react-router/dev/routes";
import { ROUTES } from "./consts/routes";

export default [
    index("routes/home.tsx"),
    route(ROUTES.module, "./routes/module_page.tsx"),
    route(ROUTES.account, "./routes/account.tsx"),

] satisfies RouteConfig;
