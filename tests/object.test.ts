import { describe, expect, it } from "vitest";
import { ObjectExtensions } from "../lib/object";

describe("ObjectExtensions", () => {
  const subject = new ObjectExtensions({ a: 1, b: 2, c: 3 });

  it("returns entries, keys, and values", () => {
    expect(subject.entries()).toEqual([
      ["a", 1],
      ["b", 2],
      ["c", 3],
    ]);
    expect(subject.keys()).toEqual(["a", "b", "c"]);
    expect(subject.values()).toEqual([1, 2, 3]);
  });

  it("unwrap returns the underlying object", () => {
    const obj = { a: 1, b: 2 };
    expect(new ObjectExtensions(obj).unwrap()).toBe(obj);
  });

  describe("fromEntries", () => {
    it("creates an ObjectExtensions instance from entries", () => {
      const result = ObjectExtensions.fromEntries([
        ["a", 1],
        ["b", true],
      ] as const);

      expect(result.unwrap()).toEqual({ a: 1, b: true });
    });
  });

  describe("omit", () => {
    it("removes the given keys", () => {
      const result = subject.omit("b").unwrap();

      expect(result).toEqual({ a: 1, c: 3 });
    });

    it("removes multiple keys", () => {
      const result = subject.omit("a", "c").unwrap();

      expect(result).toEqual({ b: 2 });
    });

    it("returns a new wrapper without mutating the original object", () => {
      const original = subject.unwrap();
      subject.omit("a");

      expect(original).toEqual({ a: 1, b: 2, c: 3 });
    });
  });
});
