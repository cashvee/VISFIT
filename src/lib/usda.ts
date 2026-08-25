/**
 * USDA FoodData Central client — the single source of truth for nutrition
 * facts in VisFit. Photography for food items is resolved separately via
 * the ImageService (Unsplash/Pexels); it is never used as a nutrition
 * source.
 */

export interface UsdaFood {
  fdcId: number;
  name: string;
  servingSize: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

const NUTRIENT_IDS = {
  calories: 1008,
  protein: 1003,
  carbs: 1005,
  fat: 1004,
};

interface FdcNutrient {
  nutrientId: number;
  nutrientName?: string;
  value: number;
}

interface FdcFood {
  fdcId: number;
  description: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients: FdcNutrient[];
}

function nutrientValue(nutrients: FdcNutrient[], id: number): number {
  return nutrients.find((n) => n.nutrientId === id)?.value ?? 0;
}

/**
 * Searches USDA FoodData Central. Never throws — returns an empty array on
 * any failure (missing key, network error, rate limit) so the UI can show
 * a clean empty/error state instead of crashing.
 */
export async function searchUsdaFoods(query: string, limit = 10): Promise<UsdaFood[]> {
  const key = process.env.USDA_API_KEY;
  if (!key || !query.trim()) return [];

  try {
    const url = new URL("https://api.nal.usda.gov/fdc/v1/foods/search");
    url.searchParams.set("api_key", key);
    url.searchParams.set("query", query.trim());
    url.searchParams.set("pageSize", String(limit));
    url.searchParams.set("dataType", "Foundation,SR Legacy,Survey (FNDDS)");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return [];
    const data = (await res.json()) as { foods?: FdcFood[] };

    return (data.foods ?? []).map((f) => ({
      fdcId: f.fdcId,
      name: f.description,
      servingSize:
        f.servingSize && f.servingSizeUnit
          ? `${f.servingSize}${f.servingSizeUnit}`
          : "100g",
      calories: Math.round(nutrientValue(f.foodNutrients, NUTRIENT_IDS.calories)),
      proteinG: Math.round(nutrientValue(f.foodNutrients, NUTRIENT_IDS.protein)),
      carbsG: Math.round(nutrientValue(f.foodNutrients, NUTRIENT_IDS.carbs)),
      fatG: Math.round(nutrientValue(f.foodNutrients, NUTRIENT_IDS.fat)),
    }));
  } catch {
    return [];
  }
}
