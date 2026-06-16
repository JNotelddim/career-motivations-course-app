import type { Route } from "./+types/home";
import { Module } from "~/components/page/module";

export function meta({}: Route.MetaArgs) {
  // TODO: make this dynamic based on the module, or at least have a different description
  return [
    { title: "Module Worksheet" },
    { name: "description", content: "A self-directed career-coaching workflow: a structured set of worksheets for answering 'what actually drives me, and where am I going?' — filled in at your own pace." },
  ];
}

export default function ModulePage() {
  return <Module />;
}
