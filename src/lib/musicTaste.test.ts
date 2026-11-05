import { describe, it, expect } from "vitest";
import { applySignal, topPicks, WEIGHTS } from "./musicTaste";

describe("music taste", () => {
  it("like adds 10 points to category and artist", () => {
    const t = applySignal({ cat: {}, artist: {} }, "bhojpuri", "Khesari", WEIGHTS.like);
    expect(t.cat.bhojpuri).toBe(10);
    expect(t.artist.Khesari).toBe(10);
  });
  it("most liked category ranks first", () => {
    let t = { cat: {}, artist: {} } as any;
    t = applySignal(t, "hindi", "A", WEIGHTS.play);
    t = applySignal(t, "bhojpuri", "B", WEIGHTS.like);
    expect(topPicks(t).cats[0]).toBe("bhojpuri");
  });
  it("unlike never goes below zero", () => {
    const t = applySignal({ cat: {}, artist: {} }, "punjabi", "C", WEIGHTS.unlike);
    expect(t.cat.punjabi).toBe(0);
    expect(topPicks(t).cats).toEqual([]);
  });
});
