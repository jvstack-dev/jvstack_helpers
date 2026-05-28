import { describe, expect, it } from "vitest";
import { IterableExtensions } from "../lib/iterable";

describe("IterableExtensions", () => {
  const source = [1, 2, 3];

  it("iterates over wrapped values", () => {
    expect([...new IterableExtensions(source)]).toEqual(source);
  });

  it("returns the underlying iterable with unwrap", () => {
    const iterable = source.values();
    expect(new IterableExtensions(iterable).unwrap()).toBe(iterable);
  });

  describe("hasSome", () => {
    it("returns true when the iterables share a value", () => {
      expect(new IterableExtensions([1, 2, 3]).hasSome([3, 4])).toBe(true);
    });

    it("returns false when the iterables share no values", () => {
      expect(new IterableExtensions([1, 2, 3]).hasSome([4, 5])).toBe(false);
    });
  });

  describe("hasEvery", () => {
    it("returns true when every value from other is present", () => {
      expect(new IterableExtensions([1, 2, 3]).hasEvery([2, 3])).toBe(true);
    });

    it("returns false when a value from other is missing", () => {
      expect(new IterableExtensions([1, 2, 3]).hasEvery([2, 4])).toBe(false);
    });
  });

  describe("zipStrict", () => {
    it("pairs values by index", () => {
      expect([...new IterableExtensions([1, 2]).zipStrict(["a", "b"])]).toEqual([
        [1, "a"],
        [2, "b"],
      ]);
    });

    it("throws when the iterables have different lengths", () => {
      expect(() => [...new IterableExtensions([1, 2]).zipStrict(["a"])]).toThrow("Iterables must be the same length");
    });
  });

  describe("zip", () => {
    it("pairs values by index", () => {
      expect([...new IterableExtensions([1, 2]).zip(["a", "b"])]).toEqual([
        [1, "a"],
        [2, "b"],
      ]);
    });

    it("uses undefined when the other iterable is shorter", () => {
      expect([...new IterableExtensions([1, 2]).zip(["a"])]).toEqual([
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

      expect([...new IterableExtensions(left).zipByStrict(right, (a, b) => a.id === b.id)]).toEqual([
        [{ id: 1 }, { id: 1, name: "a" }],
        [{ id: 2 }, { id: 2, name: "b" }],
      ]);
    });

    it("throws when a value has no match", () => {
      const left = [{ id: 1 }];
      const right = [{ id: 2 }];

      expect(() => [...new IterableExtensions(left).zipByStrict(right, (a, b) => a.id === b.id)]).toThrow(
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

      expect([...new IterableExtensions(left).zipBy(right, (a, b) => a.id === b.id)]).toEqual([
        [{ id: 1 }, { id: 1, name: "a" }],
        [{ id: 2 }, { id: 2, name: "b" }],
      ]);
    });

    it("uses undefined when a value has no match", () => {
      const left = [{ id: 1 }];
      const right = [{ id: 2 }];

      expect([...new IterableExtensions(left).zipBy(right, (a, b) => a.id === b.id)]).toEqual([[{ id: 1 }, undefined]]);
    });
  });

  describe("indexBy", () => {
    it("indexes items by key", () => {
      const items = [
        { id: "a", value: 1 },
        { id: "b", value: 2 },
      ];

      expect(new IterableExtensions(items).indexBy((item) => item.id)).toEqual({
        a: { id: "a", value: 1 },
        b: { id: "b", value: 2 },
      });
    });

    it("overwrites earlier items with the same key", () => {
      const items = [
        { id: "a", value: 1 },
        { id: "a", value: 2 },
      ];

      expect(new IterableExtensions(items).indexBy((item) => item.id)).toEqual({
        a: { id: "a", value: 2 },
      });
    });
  });

  describe("enumerate", () => {
    it("returns each value with its index", () => {
      expect([...new IterableExtensions(["a", "b"]).enumerate()]).toEqual([
        [0, "a"],
        [1, "b"],
      ]);
    });
  });

  describe("unique", () => {
    it("removes duplicate values", () => {
      expect([...new IterableExtensions([1, 2, 2, 3, 1]).unique()]).toEqual([1, 2, 3]);
    });
  });

  describe("uniqueBy", () => {
    it("removes duplicate values by key", () => {
      const items = [
        { id: "a", value: 1 },
        { id: "a", value: 2 },
        { id: "b", value: 3 },
      ];

      expect([...new IterableExtensions(items).uniqueBy((item) => item.id)]).toEqual([
        { id: "a", value: 1 },
        { id: "b", value: 3 },
      ]);
    });
  });

  describe("groupBy", () => {
    it("groups items by key", () => {
      const items = [
        { type: "a", value: 1 },
        { type: "b", value: 2 },
        { type: "a", value: 3 },
      ] as const;

      const groups = new IterableExtensions(items).groupBy((item) => item.type);

      expect([...groups.a]).toEqual([
        { type: "a", value: 1 },
        { type: "a", value: 3 },
      ]);
      expect([...groups.b]).toEqual([{ type: "b", value: 2 }]);
    });
  });

  describe("windows", () => {
    it("splits the iterable into consecutive windows of the given size", () => {
      const windows = [...new IterableExtensions([1, 2, 3, 4, 5]).windows(2)].map((window) => [...window]);

      expect(windows).toEqual([[1, 2], [3, 4], [5]]);
    });

    it("returns a single window when the iterable fits in one chunk", () => {
      const windows = [...new IterableExtensions([1, 2, 3]).windows(3)].map((window) => [...window]);

      expect(windows).toEqual([[1, 2, 3]]);
    });

    it("returns one item per window when size is 1", () => {
      const windows = [...new IterableExtensions(["a", "b"]).windows(1)].map((window) => [...window]);

      expect(windows).toEqual([["a"], ["b"]]);
    });

    it("returns no windows for an empty iterable", () => {
      expect([...new IterableExtensions([]).windows(2)]).toEqual([]);
    });

    it("returns IterableExtensions instances for each window", () => {
      const windows = new IterableExtensions([1, 2, 3, 4, 5]).windows(2);
      expect(Array.from(windows).map((window) => Array.from(window))).toEqual([[1, 2], [3, 4], [5]]);
    });
  });
});
