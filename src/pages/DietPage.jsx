import { DietPlanner } from "../components/DietPlanner";

export function DietPage({ detectedIngredients }) {
  return <DietPlanner ingredients={detectedIngredients} />;
}
