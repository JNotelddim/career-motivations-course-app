import type { Route } from "./+types/unauthenticated";
import { Unauthenticated } from "~/components/page/unauthenticated";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Career Worksheet - Unable to sign in" },
    { name: "description", content: "" },
  ];
}

export default function UnauthenticatedRoute() {
  return <Unauthenticated />;
}
