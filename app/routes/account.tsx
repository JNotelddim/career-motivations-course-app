import type { Route } from "./+types/home";
import { Account } from "~/components/page/account";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Career Worksheet - Account" },
    { name: "description", content: "" },
  ];
}

export default function ModulePage() {
  return <Account />;
}
