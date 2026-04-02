from dataclasses import dataclass


@dataclass
class Preferences:
    vegetarian: bool = False
    quick_only: bool = False
    max_prep_minutes: int = 45


RECIPE_CATALOG = [
    {
        "name": "Omelette du Chef",
        "ingredients": {"oeuf", "fromage", "oignon", "poivre"},
        "prep_minutes": 12,
        "difficulty": "easy",
        "vegetarian": True,
    },
    {
        "name": "Pates tomate basilic",
        "ingredients": {"pates", "tomate", "ail", "basilic", "huile"},
        "prep_minutes": 20,
        "difficulty": "easy",
        "vegetarian": True,
    },
    {
        "name": "Poulet grille citron",
        "ingredients": {"poulet", "citron", "ail", "huile", "sel"},
        "prep_minutes": 35,
        "difficulty": "medium",
        "vegetarian": False,
    },
    {
        "name": "Riz legumes sautes",
        "ingredients": {"riz", "carotte", "poivron", "oignon", "soja"},
        "prep_minutes": 25,
        "difficulty": "easy",
        "vegetarian": True,
    },
    {
        "name": "Salade proteinee",
        "ingredients": {"salade", "tomate", "concombre", "thon", "oeuf"},
        "prep_minutes": 15,
        "difficulty": "easy",
        "vegetarian": False,
    },
    {
        "name": "Soupe maison express",
        "ingredients": {"carotte", "oignon", "pomme de terre", "ail"},
        "prep_minutes": 30,
        "difficulty": "easy",
        "vegetarian": True,
    },
    {
        "name": "Tacos boeuf epice",
        "ingredients": {"boeuf", "oignon", "tomate", "epices", "galette"},
        "prep_minutes": 28,
        "difficulty": "medium",
        "vegetarian": False,
    },
    {
        "name": "Curry pois chiches",
        "ingredients": {"pois chiches", "tomate", "oignon", "curry", "lait coco"},
        "prep_minutes": 32,
        "difficulty": "medium",
        "vegetarian": True,
    },
]


SYNONYMS = {
    "oeufs": "oeuf",
    "spaghetti": "pates",
    "pasta": "pates",
    "tomates": "tomate",
    "onion": "oignon",
    "garlic": "ail",
    "chicken": "poulet",
    "beef": "boeuf",
    "pepper": "poivron",
}


def normalize_ingredients(raw_ingredients: list[str]) -> list[str]:
    normalized = []
    for ingredient in raw_ingredients:
        cleaned = ingredient.strip().lower()
        if not cleaned:
            continue
        normalized.append(SYNONYMS.get(cleaned, cleaned))
    # Keep order but remove duplicates
    return list(dict.fromkeys(normalized))


def recommend_recipes(ingredients: list[str], preferences: Preferences) -> list[dict]:
    ing_set = set(ingredients)
    scored = []

    for recipe in RECIPE_CATALOG:
        if preferences.vegetarian and not recipe["vegetarian"]:
            continue
        if preferences.quick_only and recipe["prep_minutes"] > 20:
            continue
        if recipe["prep_minutes"] > preferences.max_prep_minutes:
            continue

        overlap = ing_set.intersection(recipe["ingredients"])
        match_ratio = len(overlap) / max(len(recipe["ingredients"]), 1)

        # Weighted score: ingredient match + prep speed bonus
        speed_bonus = max(0.0, (45 - recipe["prep_minutes"]) / 100)
        score = round((match_ratio * 0.8 + speed_bonus * 0.2) * 100, 2)

        if score <= 5:
            continue

        missing = recipe["ingredients"] - ing_set
        reason = (
            f"Match {len(overlap)}/{len(recipe['ingredients'])} ingredients"
            f". Missing: {', '.join(sorted(missing)) if missing else 'none'}"
        )

        scored.append(
            {
                "recipe_name": recipe["name"],
                "score": score,
                "prep_minutes": recipe["prep_minutes"],
                "difficulty": recipe["difficulty"],
                "reason": reason,
            }
        )

    scored.sort(key=lambda item: item["score"], reverse=True)
    return scored[:6]


def extract_ingredients_from_photo_note(photo_note: str) -> list[str]:
    # MVP parser: user sends words from what appears in photo
    chunks = [chunk.strip() for chunk in photo_note.replace(";", ",").split(",")]
    return normalize_ingredients(chunks)
