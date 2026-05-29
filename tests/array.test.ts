import { describe, expect, it } from "vitest";
import { ArrayExtensions } from "../lib/array";

describe("ArrayExtensions", () => {
  const source = [1, 2, 3];

  it("extends Array and iterates over its values", () => {
    const items = new ArrayExtensions(...source);

    expect(items).toBeInstanceOf(Array);
    expect([...items]).toEqual(source);
  });

  describe("hasSome", () => {
    it("returns true when the arrays share a value", () => {
      expect(new ArrayExtensions(1, 2, 3).hasSome([3, 4])).toBe(true);
    });

    it("returns false when the arrays share no values", () => {
      expect(new ArrayExtensions(1, 2, 3).hasSome([4, 5])).toBe(false);
    });
  });

  describe("hasEvery", () => {
    it("returns true when every value from other is present", () => {
      expect(new ArrayExtensions(1, 2, 3).hasEvery([2, 3])).toBe(true);
    });

    it("returns false when a value from other is missing", () => {
      expect(new ArrayExtensions(1, 2, 3).hasEvery([2, 4])).toBe(false);
    });
  });

  describe("zipStrict", () => {
    it("pairs values by index", () => {
      expect([...new ArrayExtensions(1, 2).zipStrict(["a", "b"])]).toEqual([
        [1, "a"],
        [2, "b"],
      ]);
    });

    it("throws when the arrays have different lengths", () => {
      expect(() => [...new ArrayExtensions(1, 2).zipStrict(["a"])]).toThrow("Arrays must be the same length");
    });
  });

  describe("zip", () => {
    it("pairs values by index", () => {
      expect([...new ArrayExtensions(1, 2).zip(["a", "b"])]).toEqual([
        [1, "a"],
        [2, "b"],
      ]);
    });

    it("uses undefined when the other array is shorter", () => {
      expect([...new ArrayExtensions(1, 2).zip(["a"])]).toEqual([
        [1, "a"],
        [2, undefined],
      ]);
    });
  });

  describe("zipByStrict", () => {
    it("pairs values using the matcher", () => {
      const left = [{ id: 1 }, { id: 2 }];
      const right = [
        { id: 2, name: "b" },
        { id: 1, name: "a" },
      ];

      expect([...new ArrayExtensions(...left).zipByStrict(right, (a, b) => a.id === b.id)]).toEqual([
        [{ id: 1 }, { id: 1, name: "a" }],
        [{ id: 2 }, { id: 2, name: "b" }],
      ]);
    });

    it("throws when a value has no match", () => {
      const left = [{ id: 1 }];
      const right = [{ id: 2 }];

      expect(() => [...new ArrayExtensions(...left).zipByStrict(right, (a, b) => a.id === b.id)]).toThrow(
        "Iterables must match by key",
      );
    });
  });

  describe("zipBy", () => {
    it("pairs values using the matcher", () => {
      const left = [{ id: 1 }, { id: 2 }];
      const right = [
        { id: 2, name: "b" },
        { id: 1, name: "a" },
      ];

      expect([...new ArrayExtensions(...left).zipBy(right, (a, b) => a.id === b.id)]).toEqual([
        [{ id: 1 }, { id: 1, name: "a" }],
        [{ id: 2 }, { id: 2, name: "b" }],
      ]);
    });

    it("uses undefined when a value has no match", () => {
      const left = [{ id: 1 }];
      const right = [{ id: 2 }];

      expect([...new ArrayExtensions(...left).zipBy(right, (a, b) => a.id === b.id)]).toEqual([[{ id: 1 }, undefined]]);
    });
  });

  describe("indexBy", () => {
    it("indexes items by key", () => {
      const items = [
        { id: "a", value: 1 },
        { id: "b", value: 2 },
      ];

      expect(new ArrayExtensions(...items).indexBy((item) => item.id)).toEqual({
        a: { id: "a", value: 1 },
        b: { id: "b", value: 2 },
      });
    });

    it("overwrites earlier items with the same key", () => {
      const items = [
        { id: "a", value: 1 },
        { id: "a", value: 2 },
      ];

      expect(new ArrayExtensions(...items).indexBy((item) => item.id)).toEqual({
        a: { id: "a", value: 2 },
      });
    });
  });

  describe("enumerate", () => {
    it("returns each value with its index", () => {
      expect([...new ArrayExtensions("a", "b").enumerate()]).toEqual([
        [0, "a"],
        [1, "b"],
      ]);
    });
  });

  describe("unique", () => {
    it("removes duplicate values", () => {
      expect([...new ArrayExtensions(1, 2, 2, 3, 1).unique()]).toEqual([1, 2, 3]);
    });
  });

  describe("uniqueBy", () => {
    it("removes duplicate values by key", () => {
      const items = [
        { id: "a", value: 1 },
        { id: "a", value: 2 },
        { id: "b", value: 3 },
      ];

      expect([...new ArrayExtensions(...items).uniqueBy((item) => item.id)]).toEqual([
        { id: "a", value: 1 },
        { id: "b", value: 3 },
      ]);
    });
  });

  describe("groupBy", () => {
    it("groups items by key", () => {
      const items = [
        { type: "a" as const, value: 1 },
        { type: "b" as const, value: 2 },
        { type: "a" as const, value: 3 },
      ];

      const groups = new ArrayExtensions(...items).groupBy((item) => item.type);

      expect([...groups.a]).toEqual([
        { type: "a", value: 1 },
        { type: "a", value: 3 },
      ]);
      expect([...groups.b]).toEqual([{ type: "b", value: 2 }]);
    });
  });

  describe("windows", () => {
    it("splits the array into consecutive windows of the given size", () => {
      const windows = [...new ArrayExtensions(1, 2, 3, 4, 5).windows(2)].map((window) => [...window]);

      expect(windows).toEqual([[1, 2], [3, 4], [5]]);
    });

    it("returns a single window when the array fits in one chunk", () => {
      const windows = [...new ArrayExtensions(1, 2, 3).windows(3)].map((window) => [...window]);

      expect(windows).toEqual([[1, 2, 3]]);
    });

    it("returns one item per window when size is 1", () => {
      const windows = [...new ArrayExtensions("a", "b").windows(1)].map((window) => [...window]);

      expect(windows).toEqual([["a"], ["b"]]);
    });

    it("returns no windows for an empty array", () => {
      expect([...new ArrayExtensions<number>().windows(2)]).toEqual([]);
    });

    it("returns ArrayExtensions instances for each window", () => {
      const windows = new ArrayExtensions(1, 2, 3, 4, 5).windows(2);

      expect(Array.from(windows).map((window) => Array.from(window))).toEqual([[1, 2], [3, 4], [5]]);
      expect(windows[0]).toBeInstanceOf(ArrayExtensions);
    });
  });

  describe("range", () => {
    it("returns an array for the inclusive range from 1 to 5 with step 2", () => {
      expect(ArrayExtensions.range(1, 5, { step: 2, inclusive: true })).toEqual([1, 3, 5]);
    });
    it("returns an array for the exclusive range from 1 to 5", () => {
      expect(ArrayExtensions.range(1, 5)).toEqual([1, 2, 3, 4]);
    });
  });
});
