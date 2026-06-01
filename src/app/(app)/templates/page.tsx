import { getTemplates } from "@/lib/data/templates";
import { TemplatesView } from "@/components/templates/templates-view";

export default async function TemplatesPage() {
  const templates = await getTemplates();
  return <TemplatesView templates={templates} />;
}
