import { describe, it, expect } from "vitest";
import { cleanSongTitle, isSameSong } from "./songMatch";

describe("cleanSongTitle", () => {
  it("drops label prefix", () => expect(cleanSongTitle("T-Series: O Maahi | Dunki | Shah Rukh Khan")).toBe("O Maahi"));
  it("drops film/cast parts", () => expect(cleanSongTitle("Kesariya - Brahmastra | Ranbir Kapoor")).toBe("Kesariya"));
  it("skips @artist part", () => expect(cleanSongTitle("@Sai Abhyankkar - Radhimaa (Music Video) | Think Indie")).toBe("Radhimaa"));
  it("removes tags", () => expect(cleanSongTitle("Parvati - Full Song | Hanuman Ansh")).toBe("Parvati"));
});

describe("isSameSong", () => {
  it("matches film suffix", () => expect(isSameSong("Shararat", 'Shararat (From "Dhurandhar")')).toBe(true));
  it("rejects different song", () => expect(isSameSong("Kesariya", "Tum Hi Ho")).toBe(false));
});

import { songCandidates as sc2 } from "./songMatch";
describe("bhojpuri titles", () => {
  it("skips #Video and picks song name", () => {
    expect(sc2("#Video | बर्बादी होई | #शिल्पी राज | Barbaadi Hoi | Bhojpuri Song 2026")[0]).toBe("Barbaadi Hoi");
    expect(sc2("#Video | Kamariya Me Dardiya | #Khesari Lal Yadav | New Bhojpuri Song")[0]).toBe("Kamariya Me Dardiya");
    expect(sc2("Khesari Lal Yadav New Song | Suit Lalka | Bhojpuri")[0]).toBe("Suit Lalka");
  });
});
