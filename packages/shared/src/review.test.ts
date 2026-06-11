import { describe, expect, it } from "vitest";
import { scoreToFsrsRating } from "./review";

describe("practice score to FSRS rating mapping", () => {
  it("maps weak answers to again", () => {
    expect(scoreToFsrsRating({ aiScore: 42 })).toBe("again");
  });

  it("maps partial answers to hard", () => {
    expect(scoreToFsrsRating({ aiScore: 62 })).toBe("hard");
  });

  it("maps solid answers to good", () => {
    expect(scoreToFsrsRating({ aiScore: 78 })).toBe("good");
  });

  it("maps excellent answers to easy", () => {
    expect(scoreToFsrsRating({ aiScore: 92 })).toBe("easy");
  });

  it("allows explicit user self rating to override the AI score", () => {
    expect(scoreToFsrsRating({ aiScore: 92, userRating: "hard" })).toBe("hard");
  });
});
