import { describe, expect, it } from "vitest";

import { MIN_PASSWORD_LENGTH, passwordStrength } from "~/lib/backup/passwordStrength";

describe("passwordStrength", () => {
  it("rejects an empty password", () => {
    const result = passwordStrength("");
    expect(result.acceptable).toBe(false);
    expect(result.score).toBe(0);
  });

  it("rejects anything below the minimum length", () => {
    const result = passwordStrength("a".repeat(MIN_PASSWORD_LENGTH - 1));
    expect(result.acceptable).toBe(false);
  });

  it("accepts at exactly the minimum length (Fair baseline)", () => {
    const result = passwordStrength("a".repeat(MIN_PASSWORD_LENGTH));
    expect(result.acceptable).toBe(true);
    expect(result.label).toBe("Fair");
    expect(result.score).toBe(2);
  });

  it("rewards length or variety with a higher score", () => {
    expect(passwordStrength("abcdefghijklmnop").score).toBe(3); // 16 chars, one class
    expect(passwordStrength("Abcdef1ghijkl").score).toBe(3); // 13 chars, three classes
  });

  it("rates a long, varied password as Strong", () => {
    const result = passwordStrength("Tr0ubadour&3-correct-horse");
    expect(result.acceptable).toBe(true);
    expect(result.score).toBe(4);
    expect(result.label).toBe("Strong");
  });
});
