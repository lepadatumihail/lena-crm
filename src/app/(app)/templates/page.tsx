import { getTemplates } from "@/lib/data/templates";
import { getActiveClientOptions } from "@/lib/data/clients";
import { TemplatesView } from "@/components/templates/templates-view";

export default async function TemplatesPage() {
  const [templates, clients] = await Promise.all([
    getTemplates(),
    getActiveClientOptions(),
  ]);
  return <TemplatesView templates={templates} clients={clients} />;
}
