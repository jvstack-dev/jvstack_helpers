import { describe, expect, it } from "vitest";
import { IndexedCollection } from "../lib/indexed-collection";

interface User {
  id: number;
  name: string;
}

const key = (user: User) => user.id;

describe("IndexedCollection", () => {
  it("indexes items by key and deduplicates on construction", () => {
    const collection = new IndexedCollection(
      [
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
        { id: 1, name: "Alice duplicate" },
      ],
      key,
    );

    expect(collection.get(1)).toEqual({ id: 1, name: "Alice duplicate" });
    expect([...collection]).toHaveLength(2);
  });

  it("adds, deletes, and iterates items", () => {
    const collection = new IndexedCollection<User, number>([], key);

    collection.add({ id: 1, name: "Alice" });
    collection.add({ id: 2, name: "Bob" });
    expect([...collection]).toEqual([
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ]);

    collection.delete(1);
    expect(collection.get(1)).toBeUndefined();
    expect([...collection]).toEqual([{ id: 2, name: "Bob" }]);
  });

  it("returns a set view", () => {
    const collection = new IndexedCollection([{ id: 1, name: "Alice" }], key);

    expect([...collection.set]).toEqual([{ id: 1, name: "Alice" }]);
  });
});

describe("IndexedSet", () => {
  const left = new IndexedCollection(
    [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ],
    key,
  ).set;

  const right = new IndexedCollection(
    [
      { id: 2, name: "Bob updated" },
      { id: 3, name: "Carol" },
    ],
    key,
  );

  describe("leftDifference", () => {
    it("returns items in this set whose keys are not in the other collection", () => {
      expect([...left.leftDifference(right)]).toEqual([{ id: 1, name: "Alice" }]);
    });

    it("returns an empty set when every key is shared", () => {
      const onlyShared = new IndexedCollection(
        [
          { id: 1, name: "Alice" },
          { id: 2, name: "Bob" },
        ],
        key,
      );

      expect([...left.leftDifference(onlyShared)]).toEqual([]);
    });

    it("returns all items when the other collection is empty", () => {
      const empty = new IndexedCollection<User, number>([], key);

      expect([...left.leftDifference(empty)]).toEqual([
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
      ]);
    });
  });

  describe("rightDifference", () => {
    it("returns items in the other collection whose keys are not in this set", () => {
      expect([...left.rightDifference(right)]).toEqual([{ id: 3, name: "Carol" }]);
    });

    it("returns an empty set when every key is shared", () => {
      const onlyShared = new IndexedCollection(
        [
          { id: 1, name: "Alice" },
          { id: 2, name: "Bob" },
        ],
        key,
      );

      expect([...left.rightDifference(onlyShared)]).toEqual([]);
    });

    it("returns all items from the other collection when this set is empty", () => {
      const empty = new IndexedCollection<User, number>([], key).set;

      expect([...empty.rightDifference(right)]).toEqual([
        { id: 2, name: "Bob updated" },
        { id: 3, name: "Carol" },
      ]);
    });
  });

  describe("symetricDifference", () => {
    it("returns items present in either collection but not both", () => {
      expect([...left.symetricDifference(right)]).toEqual([
        { id: 1, name: "Alice" },
        { id: 3, name: "Carol" },
      ]);
    });

    it("returns an empty set when both collections share the same keys", () => {
      const onlyShared = new IndexedCollection(
        [
          { id: 1, name: "Alice" },
          { id: 2, name: "Bob" },
        ],
        key,
      );

      expect([...left.symetricDifference(onlyShared)]).toEqual([]);
    });

    it("returns all items when the collections share no keys", () => {
      const disjoint = new IndexedCollection(
        [
          { id: 3, name: "Carol" },
          { id: 4, name: "Dan" },
        ],
        key,
      );

      expect([...left.symetricDifference(disjoint)]).toEqual([
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
        { id: 3, name: "Carol" },
        { id: 4, name: "Dan" },
      ]);
    });
  });

  it("returns the intersection by key", () => {
    expect([...left.intersection(right)]).toEqual([{ id: 2, name: "Bob" }]);
  });

  it("returns the union by key, preferring items from the other collection", () => {
    expect([...left.union(right)]).toEqual([
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob updated" },
      { id: 3, name: "Carol" },
    ]);
  });

  it("returns a plain collection view", () => {
    expect([...left.collection]).toEqual([
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ]);
  });
});
