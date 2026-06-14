import { getDealAnalyses } from "@/lib/data/deals";
import { CalculatorScreen } from "@/components/calculator/calculator-screen";

export default async function CalculatorPage() {
  const analyses = await getDealAnalyses();
  const today = new Date().toISOString().slice(0, 10);
  return <CalculatorScreen analyses={analyses} today={today} />;
}
