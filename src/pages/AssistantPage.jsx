import { AssistantPanel } from "../components/AssistantPanel";
import { FeatureGate } from "../components/FeatureGate";

export function AssistantPage({ detectedIngredients }) {
  return (
    <FeatureGate feature="assistant_basic">
      <AssistantPanel ingredients={detectedIngredients} />
    </FeatureGate>
  );
}
