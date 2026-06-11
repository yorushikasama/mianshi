export const fsrsRatingNames = ["again", "hard", "good", "easy"] as const;

export type FsrsRatingName = (typeof fsrsRatingNames)[number];

export interface ScoreToFsrsRatingInput {
  aiScore: number;
  userRating?: FsrsRatingName;
}

export function scoreToFsrsRating(input: ScoreToFsrsRatingInput): FsrsRatingName {
  if (input.userRating) {
    return input.userRating;
  }

  if (input.aiScore < 50) {
    return "again";
  }

  if (input.aiScore < 70) {
    return "hard";
  }

  if (input.aiScore < 85) {
    return "good";
  }

  return "easy";
}
