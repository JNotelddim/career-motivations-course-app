import type { Route } from "./+types/data_format";
import { DataFormat } from "~/components/page/dataFormat";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Career Worksheet - Answers file format" },
    { name: "description", content: "The JSON format for importing and exporting answers." },
  ];
}

export default function DataFormatPage() {
  return <DataFormat />;
}
