import { describe, it, expect, beforeEach } from "vitest";
import { resetStore, updateTaskStatus, getTasksByProject } from "../src/lib/store";

describe("Hard-block enforcement", () => {
  beforeEach(() => resetStore());

  it("allows moving to TODO always", () => {
    const r = updateTaskStatus("t3", "TODO");
    expect(r.ok).toBe(true);
    expect(r.task?.status).toBe("TODO");
  });

  it("allows moving to IN_PROGRESS if deps DONE", () => {
    // t2 depends on t1 which is DONE in seed
    const r = updateTaskStatus("t2", "IN_PROGRESS");
    expect(r.ok).toBe(true);
    expect(r.task?.status).toBe("IN_PROGRESS");
  });

  it("blocks moving to IN_PROGRESS if deps NOT DONE", () => {
    // t3 depends on t2 which is TODO in seed
    const r = updateTaskStatus("t3", "IN_PROGRESS");
    expect(r.ok).toBe(false);
    expect(r.error?.startsWith("Blocked:")).toBe(true);
  });

  it("blocks moving to DONE if deps NOT DONE", () => {
    const r = updateTaskStatus("t3", "DONE");
    expect(r.ok).toBe(false);
    expect(r.error?.startsWith("Blocked:")).toBe(true);
  });

  it("allows moving to DONE once deps are DONE", () => {
    // Make t2 DONE first (allowed because t1 is DONE)
    const r1 = updateTaskStatus("t2", "DONE");
    expect(r1.ok).toBe(true);

    // Now t3 deps are met
    const r2 = updateTaskStatus("t3", "DONE");
    expect(r2.ok).toBe(true);
  });

  it("returns tasks by project correctly", () => {
    const tasks = getTasksByProject("p1");
    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks.every((t) => t.projectId === "p1")).toBe(true);
  });
});
