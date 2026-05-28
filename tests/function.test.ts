import { describe, expect, it } from "vitest";
import { functionUtils } from "../lib/function";

describe("functionUtils", () => {
  it("throws the given error with throwError", () => {
    const error = new Error("boom");

    expect(() => functionUtils.throwError(error)).toThrow(error);
  });

  it("does nothing with noop", () => {
    expect(() => {
      functionUtils.noop();
    }).not.toThrow();
  });

  it("resolves with asyncNoop", async () => {
    await expect(functionUtils.asyncNoop()).resolves.toBeUndefined();
  });

  it("returns the same value with identity", () => {
    const value = { id: 1 };

    expect(functionUtils.identity(value)).toBe(value);
    expect(functionUtils.identity(42)).toBe(42);
  });
});
