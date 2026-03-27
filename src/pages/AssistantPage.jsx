import { AssistantPanel } from "../components/AssistantPanel";

export function AssistantPage({ detectedIngredients }) {
  return <AssistantPanel ingredients={detectedIngredients} />;
}
