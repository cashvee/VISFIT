import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  real,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import type { AdapterAccountType } from "next-auth/adapters";

// ---------- Auth.js core tables (DrizzleAdapter compatible) ----------

export const users = sqliteTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  passwordHash: text("password_hash"),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),

  // VisFit profile extension
  username: text("username").unique(),
  sex: text("sex", { enum: ["male", "female"] }),
  birthYear: integer("birth_year"),
  heightCm: real("height_cm"),
  weightKg: real("weight_kg"),
  activityLevel: text("activity_level", {
    enum: ["sedentary", "light", "moderate", "active", "very_active"],
  }),
  goal: text("goal", { enum: ["lose", "maintain", "gain"] }),
  goalCalorieDelta: integer("goal_calorie_delta").default(0),
  waterTargetMl: integer("water_target_ml").default(2500),

  // VisFit goal setter — explicit target + countdown (independent of the
  // auto-detected BMI-based `goal` above, which still drives calorie math).
  goalType: text("goal_type", {
    enum: ["fat_loss", "muscle_gain", "maintenance", "general_fitness", "endurance"],
  }),
  goalStartWeightKg: real("goal_start_weight_kg"),
  targetWeightKg: real("target_weight_kg"),
  targetDate: integer("target_date", { mode: "timestamp_ms" }),
  goalSetAt: integer("goal_set_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const accounts = sqliteTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

export const sessions = sqliteTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const verificationTokens = sqliteTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

export const siteStats = sqliteTable("site_stat", {
  key: text("key").primaryKey(),
  value: integer("value").notNull().default(0),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

// ---------- VisFit domain tables ----------

export const meals = sqliteTable(
  "meal",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    eatenAt: integer("eaten_at", { mode: "timestamp_ms" }).notNull(),
    rawText: text("raw_text").notNull(),
    totalCalories: real("total_calories").notNull().default(0),
    proteinG: real("protein_g").notNull().default(0),
    carbsG: real("carbs_g").notNull().default(0),
    fatG: real("fat_g").notNull().default(0),
    notes: text("notes"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => [
    index("meal_user_eaten_idx").on(t.userId, t.eatenAt),
  ],
);

export const mealItems = sqliteTable("meal_item", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  mealId: text("meal_id")
    .notNull()
    .references(() => meals.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  quantity: real("quantity"),
  unit: text("unit"),
  calories: real("calories").notNull().default(0),
  proteinG: real("protein_g").notNull().default(0),
  carbsG: real("carbs_g").notNull().default(0),
  fatG: real("fat_g").notNull().default(0),
  // USDA FoodData Central fdcId — lets a logged item be traced back to its
  // source record. USDA remains the source of truth; we only keep the id.
  externalFoodId: text("external_food_id"),
});

export const dailyGoals = sqliteTable(
  "daily_goal",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: text("date").notNull(), // YYYY-MM-DD in user local
    calorieTarget: real("calorie_target").notNull(),
    proteinTargetG: real("protein_target_g"),
    carbsTargetG: real("carbs_target_g"),
    fatTargetG: real("fat_target_g"),
    waterTargetMl: integer("water_target_ml"),
    overridden: integer("overridden", { mode: "boolean" }).notNull().default(false),
  },
  (t) => [index("daily_goal_user_date_idx").on(t.userId, t.date)],
);

// ---------- Goal history ----------
// The user's *current* goal is also denormalized onto `users` (goalType,
// goalStartWeightKg, targetWeightKg, targetDate, goalSetAt) for fast
// dashboard reads. This table keeps the full history + status so past
// goals aren't lost when a new one is set.

export const goals = sqliteTable(
  "goal",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type", {
      enum: ["fat_loss", "muscle_gain", "maintenance", "general_fitness", "endurance"],
    }).notNull(),
    startingValue: real("starting_value").notNull(),
    targetValue: real("target_value").notNull(),
    targetDate: integer("target_date", { mode: "timestamp_ms" }).notNull(),
    status: text("status", { enum: ["active", "completed", "abandoned"] })
      .notNull()
      .default("active"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => [index("goal_user_idx").on(t.userId)],
);

// ---------- Activities (running / cycling / walking) ----------

export const activities = sqliteTable(
  "activity",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["running", "cycling", "walking", "other"] }).notNull(),
    distanceKm: real("distance_km").notNull().default(0),
    durationSec: integer("duration_sec").notNull().default(0),
    paceSecPerKm: real("pace_sec_per_km"),
    startedAt: integer("started_at", { mode: "timestamp_ms" }).notNull(),
    // Compact, optional route payload (e.g. a simplified coordinate list).
    // Never used to store map tiles — OpenStreetMap remains the map provider.
    routeData: text("route_data"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => [index("activity_user_started_idx").on(t.userId, t.startedAt)],
);

// ---------- Challenges ----------
// Challenge definitions are small and static (see src/components/challenges.tsx)
// so they live in code, not the database. Only per-user participation — the
// part that's actually user state — is persisted here.

export const challengeParticipants = sqliteTable(
  "challenge_participant",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    challengeSlug: text("challenge_slug").notNull(),
    joinedAt: integer("joined_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => [
    index("challenge_participant_user_idx").on(t.userId),
    uniqueIndex("challenge_participant_unique_idx").on(t.userId, t.challengeSlug),
  ],
);

// ---------- Water tracking ----------

export const waterLogs = sqliteTable(
  "water_log",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amountMl: integer("amount_ml").notNull(),
    loggedAt: integer("logged_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => [index("water_user_logged_idx").on(t.userId, t.loggedAt)],
);

// ---------- Exercise / Workout ----------

export const exercises = sqliteTable("exercise", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  nameEn: text("name_en").notNull(),
  category: text("category", {
    enum: ["chest", "back", "legs", "core", "arms", "shoulder", "cardio", "fullbody"],
  }).notNull(),
  bodyweight: integer("bodyweight", { mode: "boolean" }).notNull().default(true),
  defaultRest: integer("default_rest").notNull().default(60),
});

export const workoutSessions = sqliteTable(
  "workout_session",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    startedAt: integer("started_at", { mode: "timestamp_ms" }).notNull(),
    endedAt: integer("ended_at", { mode: "timestamp_ms" }),
    totalDurationSec: integer("total_duration_sec"),
    notes: text("notes"),
  },
  (t) => [index("workout_user_started_idx").on(t.userId, t.startedAt)],
);

// ---------- Weight tracking ----------

export const weightLogs = sqliteTable(
  "weight_log",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    weightKg: real("weight_kg").notNull(),
    loggedAt: integer("logged_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => [index("weight_user_logged_idx").on(t.userId, t.loggedAt)],
);

// ---------- Friendships + Privacy ----------

export const friendships = sqliteTable(
  "friendship",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    requesterId: text("requester_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    addresseeId: text("addressee_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status", { enum: ["pending", "accepted", "blocked"] })
      .notNull()
      .default("pending"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => [
    index("friendship_requester_idx").on(t.requesterId),
    index("friendship_addressee_idx").on(t.addresseeId),
  ],
);

export const friendPrivacy = sqliteTable("friend_privacy", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  shareWeeklySummary: integer("share_weekly_summary", { mode: "boolean" })
    .notNull()
    .default(true),
  shareWeight: integer("share_weight", { mode: "boolean" }).notNull().default(false),
  shareMeals: integer("share_meals", { mode: "boolean" }).notNull().default(false),
  shareWater: integer("share_water", { mode: "boolean" }).notNull().default(false),
});

export const workoutEntries = sqliteTable("workout_entry", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  sessionId: text("session_id")
    .notNull()
    .references(() => workoutSessions.id, { onDelete: "cascade" }),
  exerciseId: text("exercise_id")
    .notNull()
    .references(() => exercises.id),
  sets: integer("sets").notNull(),
  reps: integer("reps"),
  weightKg: real("weight_kg"),
  durationSec: integer("duration_sec"),
  orderIdx: integer("order_idx").notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type SiteStat = typeof siteStats.$inferSelect;
export type Meal = typeof meals.$inferSelect;
export type NewMeal = typeof meals.$inferInsert;
export type MealItem = typeof mealItems.$inferSelect;
export type NewMealItem = typeof mealItems.$inferInsert;
export type DailyGoal = typeof dailyGoals.$inferSelect;
export type WaterLog = typeof waterLogs.$inferSelect;
export type NewWaterLog = typeof waterLogs.$inferInsert;
export type Exercise = typeof exercises.$inferSelect;
export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type NewWorkoutSession = typeof workoutSessions.$inferInsert;
export type WorkoutEntry = typeof workoutEntries.$inferSelect;
export type NewWorkoutEntry = typeof workoutEntries.$inferInsert;
export type WeightLog = typeof weightLogs.$inferSelect;
export type NewWeightLog = typeof weightLogs.$inferInsert;
export type Friendship = typeof friendships.$inferSelect;
export type NewFriendship = typeof friendships.$inferInsert;
export type FriendPrivacy = typeof friendPrivacy.$inferSelect;
export type Goal = typeof goals.$inferSelect;
export type NewGoal = typeof goals.$inferInsert;
export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;
export type ChallengeParticipant = typeof challengeParticipants.$inferSelect;
export type NewChallengeParticipant = typeof challengeParticipants.$inferInsert;
