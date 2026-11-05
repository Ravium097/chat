import {
  db,
  id,
  workoutSchema,
  exerciseSchema,
  type Exercise,
  type Workout,
} from "../data";
type PlanExercise = {
  name: string;
  muscle: string;
  equipment: string;
  sets: [number | null, number][];
  rest?: number;
  notes?: string;
};
const repeat = (
  weight: number | null,
  reps: number,
  count: number,
): [number | null, number][] =>
  Array.from({ length: count }, () => [weight, reps]);
export const personalPlans: {
  key: string;
  name: string;
  exercises: PlanExercise[];
}[] = [
  {
    key: "push",
    name: "Push Day",
    exercises: [
      {
        name: "Chest Press",
        muscle: "Brust",
        equipment: "Maschine",
        sets: [
          [45, 8],
          [50, 8],
          [50, 8],
          [50, 8],
        ],
        rest: 120,
      },
      {
        name: "Incline Bench Press",
        muscle: "Brust",
        equipment: "Langhantel",
        sets: repeat(35, 8, 4),
        rest: 120,
      },
      {
        name: "Military Press",
        muscle: "Schultern",
        equipment: "Langhantel",
        sets: [
          [23, 8],
          [23, 8],
          [28, 8],
          [28, 8],
        ],
        rest: 120,
      },
      {
        name: "Lateral Raise",
        muscle: "Schultern",
        equipment: "Kurzhantel",
        sets: repeat(9, 8, 3),
        rest: 90,
      },
      {
        name: "Overhead Triceps Extension",
        muscle: "Trizeps",
        equipment: "Kabelzug",
        sets: [
          [17.5, 12],
          [17.5, 10],
          [17.5, 10],
        ],
        rest: 90,
      },
      {
        name: "Reverse Fly",
        muscle: "Schultern",
        equipment: "Maschine",
        sets: [
          [30, 10],
          [25, 12],
          [25, 12],
        ],
        rest: 120,
      },
      {
        name: "Kneeling Crunch",
        muscle: "Bauch",
        equipment: "Kabelzug",
        sets: repeat(80, 12, 3),
        rest: 60,
      },
      {
        name: "Seated Wrist Curl",
        muscle: "Sonstige",
        equipment: "Langhantel",
        sets: [
          [13, 12],
          [18, 12],
        ],
        rest: 150,
      },
      {
        name: "Reverse Wrist Curl",
        muscle: "Sonstige",
        equipment: "Kurzhantel",
        sets: repeat(13, 12, 2),
        rest: 150,
      },
      {
        name: "Wide Push Up",
        muscle: "Brust",
        equipment: "Körpergewicht",
        sets: [[null, 20]],
      },
    ],
  },
  {
    key: "pull",
    name: "Pull Day",
    exercises: [
      {
        name: "Lat Pulldown",
        muscle: "Rücken",
        equipment: "Maschine",
        sets: repeat(30, 8, 3),
        rest: 120,
      },
      {
        name: "Wide Grip Seated Cable Row",
        muscle: "Rücken",
        equipment: "Kabelzug",
        sets: [
          [40, 8],
          [35, 10],
          [35, 10],
        ],
        rest: 120,
      },
      {
        name: "One arm seated cable row",
        muscle: "Rücken",
        equipment: "Maschine",
        sets: repeat(15, 10, 3),
        rest: 90,
      },
      {
        name: "Tricep Pushdown",
        muscle: "Trizeps",
        equipment: "Kabelzug",
        sets: repeat(35, 10, 3),
        notes:
          "Pausen laut Vorlage: Satz 1 02:20, Satz 2 und 3 01:30. Unterschiedliche Satzpausen bitte manuell beachten; der Timer verwendet die Standardpause.",
      },
      {
        name: "Bicep Curl",
        muscle: "Bizeps",
        equipment: "Langhantel",
        sets: repeat(30, 12, 3),
        notes:
          "SZ-Stange (EZ Bar). Pausen laut Vorlage: Satz 1 02:10, Satz 2 und 3 01:30. Unterschiedliche Satzpausen bitte manuell beachten; der Timer verwendet die Standardpause.",
      },
      {
        name: "Hammer Curl",
        muscle: "Bizeps",
        equipment: "Kurzhantel",
        sets: repeat(8, 10, 3),
        rest: 150,
      },
      {
        name: "Russian Twist",
        muscle: "Bauch",
        equipment: "Körpergewicht",
        sets: repeat(15, 20, 3),
        rest: 60,
      },
      {
        name: "Push Up",
        muscle: "Brust",
        equipment: "Körpergewicht",
        sets: [[null, 12]],
      },
    ],
  },
];
export const planId = (key: string) => `set-personal-${key}-2026-v1`;
/** Additive and idempotent: never replace existing workouts or exercise definitions. */
export async function addPersonalTemplates() {
  return db.transaction("rw", db.workouts, db.exercises, async () => {
    let added = 0;
    for (const plan of personalPlans) {
      const templateId = planId(plan.key);
      if (await db.workouts.get(templateId)) continue;
      const exercises: Exercise[] = plan.exercises.map((e) =>
        exerciseSchema.parse({
          id: id(),
          name: e.name,
          muscle: e.muscle,
          equipment: e.equipment,
          favorite: false,
          notes: e.notes ?? "Aus deiner Screenshot-Vorlage übernommen.",
          ...(e.rest === undefined ? {} : { rest: e.rest }),
        }),
      );
      const workout: Workout = workoutSchema.parse({
        id: templateId,
        name: plan.name,
        date: new Date().toISOString().slice(0, 10),
        started: null,
        duration: null,
        status: "template",
        exercises: plan.exercises.map((e, i) => ({
          id: id(),
          exerciseId: exercises[i].id,
          name: e.name,
          sets: e.sets.map(([weight, reps]) => ({
            id: id(),
            weight,
            reps,
            completed: false,
          })),
        })),
      });
      await db.exercises.bulkAdd(exercises);
      await db.workouts.add(workout);
      added++;
    }
    return added;
  });
}
