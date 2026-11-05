import "fake-indexeddb/auto";
import { beforeEach, expect, it } from "vitest";
import { db, init, exportData, restore } from "../data";
import { addPersonalTemplates, planId } from "../services/personalTemplates";
beforeEach(async () => {
  await db.workouts.clear();
  await db.exercises.clear();
  await db.settings.clear();
  await init();
});
it("adds exact screenshot templates without completed training", async () => {
  await addPersonalTemplates();
  const push = (await db.workouts.get(planId("push")))!;
  const pull = (await db.workouts.get(planId("pull")))!;
  expect(push.exercises).toHaveLength(10);
  expect(pull.exercises).toHaveLength(8);
  expect(push.exercises.flatMap((e) => e.sets)).toHaveLength(29);
  expect(pull.exercises.flatMap((e) => e.sets)).toHaveLength(22);
  expect(push.exercises[0].sets.map((s) => s.weight)).toEqual([45, 50, 50, 50]);
  expect(push.exercises[4].sets.map((s) => [s.weight, s.reps])).toEqual([
    [17.5, 12],
    [17.5, 10],
    [17.5, 10],
  ]);
  expect(pull.exercises[6].sets.map((s) => [s.weight, s.reps])).toEqual([
    [15, 20],
    [15, 20],
    [15, 20],
  ]);
  expect(push.exercises[9].sets[0].weight).toBeNull();
  expect(pull.exercises[7].sets[0].weight).toBeNull();
  expect(
    [push, pull].every(
      (w) =>
        w.status === "template" &&
        w.started === null &&
        w.exercises.every((e) => e.sets.every((s) => !s.completed)),
    ),
  ).toBe(true);
  const triceps = await db.exercises.get(pull.exercises[3].exerciseId);
  expect(triceps?.notes).toContain("02:20");
  expect(triceps?.rest).toBeUndefined();
});
it("is idempotent under concurrent requests and preserves edited templates", async () => {
  await Promise.all([addPersonalTemplates(), addPersonalTemplates()]);
  expect(await db.workouts.count()).toBe(2);
  expect(await db.exercises.count()).toBe(31);
  await db.workouts.update(planId("push"), { name: "Mein Push" });
  const before = await exportData();
  await addPersonalTemplates();
  expect((await exportData()).workouts).toEqual(before.workouts);
  expect((await exportData()).exercises).toEqual(before.exercises);
  await restore(before);
  expect((await db.workouts.get(planId("push")))?.name).toBe("Mein Push");
});
it("rolls back both templates and definitions when a write fails", async () => {
  const hook = () => {
    throw new Error("disk full");
  };
  db.workouts.hook("creating", hook);
  try {
    await expect(addPersonalTemplates()).rejects.toThrow("disk full");
  } finally {
    db.workouts.hook("creating").unsubscribe(hook);
  }
  expect(await db.workouts.count()).toBe(0);
  expect(await db.exercises.count()).toBe(13);
});
