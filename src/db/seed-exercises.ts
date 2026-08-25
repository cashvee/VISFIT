import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

type Cat = "chest" | "back" | "legs" | "core" | "arms" | "shoulder" | "cardio" | "fullbody";

interface E {
  slug: string;
  nameEn: string;
  category: Cat;
  defaultRest?: number;
  bodyweight?: boolean;
}

// Keep bodyweight movements alongside common gym movements so sessions can track external load.
const CATALOG: E[] = [
  // Chest
  { slug: "push-up", nameEn: "Push-up", category: "chest" },
  { slug: "incline-push-up", nameEn: "Incline Push-up", category: "chest" },
  { slug: "decline-push-up", nameEn: "Decline Push-up", category: "chest" },
  { slug: "diamond-push-up", nameEn: "Diamond Push-up", category: "chest", defaultRest: 75 },
  { slug: "wide-push-up", nameEn: "Wide Push-up", category: "chest" },
  { slug: "bench-press", nameEn: "Barbell Bench Press", category: "chest", bodyweight: false, defaultRest: 120 },
  { slug: "incline-bench-press", nameEn: "Incline Bench Press", category: "chest", bodyweight: false, defaultRest: 120 },

  // Back
  { slug: "pull-up", nameEn: "Pull-up", category: "back", defaultRest: 90 },
  { slug: "inverted-row", nameEn: "Inverted Row (Table)", category: "back" },
  { slug: "superman", nameEn: "Superman", category: "back", defaultRest: 45 },
  { slug: "reverse-snow-angel", nameEn: "Reverse Snow Angel", category: "back", defaultRest: 45 },
  { slug: "deadlift", nameEn: "Barbell Deadlift", category: "back", bodyweight: false, defaultRest: 150 },
  { slug: "bent-over-row", nameEn: "Barbell Bent-over Row", category: "back", bodyweight: false, defaultRest: 120 },
  { slug: "lat-pulldown", nameEn: "Lat Pulldown", category: "back", bodyweight: false, defaultRest: 90 },

  // Legs
  { slug: "squat", nameEn: "Squat", category: "legs" },
  { slug: "lunge", nameEn: "Lunge", category: "legs" },
  { slug: "jump-squat", nameEn: "Jump Squat", category: "legs" },
  { slug: "wall-sit", nameEn: "Wall Sit", category: "legs", defaultRest: 45 },
  { slug: "bulgarian-split-squat", nameEn: "Bulgarian Split Squat (chair)", category: "legs", defaultRest: 75 },
  { slug: "pistol-squat", nameEn: "Pistol Squat", category: "legs", defaultRest: 90 },
  { slug: "glute-bridge", nameEn: "Glute Bridge", category: "legs", defaultRest: 45 },
  { slug: "single-leg-glute-bridge", nameEn: "Single-leg Glute Bridge", category: "legs", defaultRest: 45 },
  { slug: "calf-raise", nameEn: "Calf Raise", category: "legs", defaultRest: 30 },
  { slug: "step-up", nameEn: "Step-up (chair)", category: "legs", defaultRest: 60 },
  { slug: "barbell-squat", nameEn: "Barbell Back Squat", category: "legs", bodyweight: false, defaultRest: 150 },
  { slug: "leg-press", nameEn: "Leg Press", category: "legs", bodyweight: false, defaultRest: 120 },
  { slug: "romanian-deadlift", nameEn: "Romanian Deadlift", category: "legs", bodyweight: false, defaultRest: 120 },
  { slug: "hip-thrust", nameEn: "Barbell Hip Thrust", category: "legs", bodyweight: false, defaultRest: 120 },

  // Core
  { slug: "plank", nameEn: "Plank", category: "core", defaultRest: 45 },
  { slug: "side-plank", nameEn: "Side Plank", category: "core", defaultRest: 45 },
  { slug: "reverse-plank", nameEn: "Reverse Plank", category: "core", defaultRest: 45 },
  { slug: "crunch", nameEn: "Crunch", category: "core", defaultRest: 45 },
  { slug: "bicycle-crunch", nameEn: "Bicycle Crunch", category: "core", defaultRest: 45 },
  { slug: "leg-raise", nameEn: "Leg Raise", category: "core", defaultRest: 45 },
  { slug: "mountain-climber", nameEn: "Mountain Climber", category: "core", defaultRest: 45 },
  { slug: "russian-twist", nameEn: "Russian Twist", category: "core", defaultRest: 45 },
  { slug: "hollow-hold", nameEn: "Hollow Hold", category: "core", defaultRest: 45 },
  { slug: "v-up", nameEn: "V-up", category: "core", defaultRest: 45 },
  { slug: "bird-dog", nameEn: "Bird Dog", category: "core", defaultRest: 30 },

  // Arms
  { slug: "chair-tricep-dip", nameEn: "Chair Tricep Dip", category: "arms", defaultRest: 60 },
  { slug: "bicep-curl", nameEn: "Dumbbell Bicep Curl", category: "arms", bodyweight: false },
  { slug: "tricep-extension", nameEn: "Cable Tricep Extension", category: "arms", bodyweight: false },

  // Shoulder
  { slug: "pike-push-up", nameEn: "Pike Push-up", category: "shoulder", defaultRest: 75 },
  { slug: "wall-handstand-hold", nameEn: "Wall Handstand Hold", category: "shoulder", defaultRest: 60 },
  { slug: "shoulder-press", nameEn: "Dumbbell Shoulder Press", category: "shoulder", bodyweight: false, defaultRest: 90 },
  { slug: "lateral-raise", nameEn: "Dumbbell Lateral Raise", category: "shoulder", bodyweight: false },

  // Cardio
  { slug: "jumping-jack", nameEn: "Jumping Jack", category: "cardio", defaultRest: 30 },
  { slug: "burpee", nameEn: "Burpee", category: "cardio", defaultRest: 60 },
  { slug: "high-knee", nameEn: "High Knees", category: "cardio", defaultRest: 30 },

  // Fullbody
  { slug: "thruster", nameEn: "Bodyweight Thruster", category: "fullbody", defaultRest: 75 },
];

// Slugs that are no longer part of the catalog — remove from DB.
const OBSOLETE_SLUGS = [
  "kettlebell-swing",
  "turkish-getup",
  "dip", // requires parallel bars; replaced with chair-tricep-dip
];

async function main() {
  const { db } = await import("./client");
  const { exercises, workoutEntries } = await import("./schema");
  const { inArray } = await import("drizzle-orm");

  // Upsert new catalog
  for (const e of CATALOG) {
    const row = {
      id: e.slug,
      slug: e.slug,
      nameEn: e.nameEn,
      category: e.category,
      bodyweight: e.bodyweight ?? true,
      defaultRest: e.defaultRest ?? 60,
    };
    await db
      .insert(exercises)
      .values(row)
      .onConflictDoUpdate({
        target: exercises.id,
        set: {
          slug: row.slug,
          nameEn: row.nameEn,
          category: row.category,
          bodyweight: row.bodyweight,
          defaultRest: row.defaultRest,
        },
      });
  }
  console.log(`Upserted ${CATALOG.length} exercises.`);

  // Remove obsolete exercises — but only if not referenced.
  const referenced = await db
    .select({ exerciseId: workoutEntries.exerciseId })
    .from(workoutEntries);
  const referencedIds = new Set(referenced.map((r) => r.exerciseId));
  const safeToDelete = OBSOLETE_SLUGS.filter((s) => !referencedIds.has(s));
  if (safeToDelete.length > 0) {
    await db.delete(exercises).where(inArray(exercises.id, safeToDelete));
    console.log(`Deleted ${safeToDelete.length} obsolete: ${safeToDelete.join(", ")}`);
  } else {
    console.log("No obsolete exercises to delete (some referenced or absent).");
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
