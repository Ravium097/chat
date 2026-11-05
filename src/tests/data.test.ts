import "fake-indexeddb/auto";
import { beforeEach, expect, it } from "vitest";
import {
  db,
  init,
  emptySet,
  id,
  volume,
  exportData,
  restore,
  type Workout,
} from "../data";
beforeEach(async () => {
  await db.workouts.clear();
  await db.exercises.clear();
  await db.settings.clear();
  await init();
});
const workout = (): Workout => ({
  id: id(),
  name: "Test",
  date: "2026-11-04",
  started: 1,
  duration: null,
  status: "active",
  exercises: [
    {
      id: id(),
      name: "Bankdrücken",
      exerciseId: "snapshot",
      sets: [
        { ...emptySet(), weight: 20, reps: 10, completed: true },
        { ...emptySet(), weight: 50, reps: 10 },
      ],
    },
  ],
});
it("starts without fabricated workouts", async () => {
  expect(await db.workouts.count()).toBe(0);
  expect(await db.exercises.count()).toBe(13);
});
it("counts only completed sets", () => expect(volume(workout())).toBe(200));
it("persists active workout across connection reopen", async () => {
  const w = workout();
  await db.workouts.add(w);
  db.close();
  await db.open();
  expect(await db.workouts.get(w.id)).toEqual(w);
});
it("roundtrips backup atomically", async () => {
  const w = workout();
  await db.workouts.add(w);
  const backup = await exportData();
  await db.workouts.clear();
  await restore(backup);
  expect(await db.workouts.get(w.id)).toEqual(w);
});
it("rejects malformed backup without deleting data", async () => {
  await db.workouts.add(workout());
  await expect(restore({ schemaVersion: 2 })).rejects.toThrow();
  expect(await db.workouts.count()).toBe(1);
});
it("preserves historical names when exercise is removed", async () => {
  const w = workout();
  await db.workouts.add(w);
  await db.exercises.clear();
  expect((await db.workouts.get(w.id))?.exercises[0].name).toBe("Bankdrücken");
});
