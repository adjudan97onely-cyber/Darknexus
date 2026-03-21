import { getPersonalizedRecommendationSections } from "../services/userMemoryService";
import { getCurrentRole, hasAccess } from "../services/roleService";
import { FeatureGate } from "./FeatureGate";
import { RecommendationSection } from "./RecommendationSection";

export function PersonalizedFeed({ detectedIngredients, favoriteIds, onToggleFavorite, onOpenRecipe }) {
  const role = getCurrentRole();
  const sections = getPersonalizedRecommendationSections(detectedIngredients);

  if (!hasAccess("feed_recommended", role)) {
    return <FeatureGate feature="feed_recommended" />;
  }

  return (
    <div className="space-y-4">
      <RecommendationSection
        title="Recommande pour toi"
        subtitle="Selection priorisee selon ton profil, tes habitudes et tes ingredients frequents."
        recipes={sections.recommendedForYou}
        favoriteIds={favoriteIds || new Set()}
        onToggleFavorite={onToggleFavorite}
        onOpenRecipe={onOpenRecipe}
      />
      {hasAccess("feed_because_liked", role) ? (
        <RecommendationSection
          title="Parce que tu as aime..."
          subtitle="Inspirations proches de tes preferences memorisees."
          recipes={sections.becauseYouLiked}
          favoriteIds={favoriteIds || new Set()}
          onToggleFavorite={onToggleFavorite}
          onOpenRecipe={onOpenRecipe}
        />
      ) : (
        <FeatureGate feature="feed_because_liked" />
      )}
      {hasAccess("feed_you_could_like", role) ? (
        <RecommendationSection
          title="Tu pourrais aussi aimer..."
          subtitle="Suggestions plus larges, mais toujours coherentes avec ton profil."
          recipes={sections.youCouldAlsoLike}
          favoriteIds={favoriteIds || new Set()}
          onToggleFavorite={onToggleFavorite}
          onOpenRecipe={onOpenRecipe}
        />
      ) : null}
    </div>
  );
}
