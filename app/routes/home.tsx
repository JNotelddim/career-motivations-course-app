import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Career Worksheet" },
    { name: "description", content: "A self-directed career-coaching workflow: a structured set of worksheets for answering 'what actually drives me, and where am I going?' — filled in at your own pace." },
  ];
}

export default function Home() {
  return <Welcome />;
}
