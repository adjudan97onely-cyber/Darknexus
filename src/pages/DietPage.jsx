import { DietPlanner } from "../components/DietPlanner";
import { FeatureGate } from "../components/FeatureGate";
import { getCurrentRole } from "../services/roleService";

export function DietPage({ detectedIngredients }) {
  const role = getCurrentRole();
  return (
    <div className="space-y-4">
      <FeatureGate feature="diet_planner">
        <DietPlanner ingredients={detectedIngredients} />
      </FeatureGate>
      {role === "standard" && (
        <FeatureGate feature="diet_planner_full" />
      )}
    </div>
  );
}
