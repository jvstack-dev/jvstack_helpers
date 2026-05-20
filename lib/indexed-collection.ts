/**
 * Key-indexed collection of items. Items with the same key overwrite earlier ones.
 */
export class IndexedCollection<T, K extends PropertyKey> implements Iterable<T> {
  protected readonly index = new Map<K, T>();

  /**
   * Creates a collection from the given items, indexed by the key function.
   *
   * @param items - Initial items to add to the collection.
   * @param key - Function that returns the unique key for an item.
   */
  public constructor(
    items: T[],
    protected readonly key: (item: T) => K,
  ) {
    items.forEach((item) => {
      this.index.set(this.key(item), item);
    });
  }

  /**
   * Returns the item with the given key, or `undefined` if it is not in the collection.
   *
   * @param key - The key to look up.
   */
  public get(key: K): T | undefined {
    return this.index.get(key);
  }

  public has(key: K): boolean {
    return this.index.has(key);
  }

  /** Iterates over the items in the collection. */
  public [Symbol.iterator](): IterableIterator<T> {
    return this.index.values();
  }

  /**
   * Adds or replaces an item, keyed by {@link key}.
   *
   * @param item - The item to add.
   */
  public add(item: T): void {
    this.index.set(this.key(item), item);
  }

  /**
   * Removes the item with the given key.
   *
   * @param key - The key of the item to remove.
   */
  public delete(key: K): void {
    this.index.delete(key);
  }

  /** Returns a set view of this collection with union, intersection, and difference. */
  public get set(): IndexedSet<T, K> {
    return new IndexedSet(Array.from(this.index.values()), this.key);
  }
}

/**
 * Set operations over {@link IndexedCollection}, comparing items by key.
 */
class IndexedSet<T, K extends PropertyKey> extends IndexedCollection<T, K> {
  /**
   * Calculates the difference between this set and the other collection.
   * This set's key function overrides the other collection's key function.
   *
   * @param other - The collection to subtract from this set.
   */
  public leftDifference(other: IndexedCollection<T, K>): IndexedSet<T, K> {
    return new IndexedSet(
      Array.from(this).filter((item) => !other.has(this.key(item))),
      this.key,
    );
  }

  /**
   * Calculates the difference between the other collection and this set.
   * This set's key function overrides the other collection's key function.
   *
   * @param other - The collection to subtract by this set.
   */
  public rightDifference(other: IndexedCollection<T, K>): IndexedSet<T, K> {
    return new IndexedSet(
      Array.from(other).filter((item) => !this.has(this.key(item))),
      this.key,
    );
  }

  /**
   * Calculates the symmetric difference between this set and the other collection.
   * This set's key function overrides the other collection's key function.
   *
   * @param other - The collection to symmetric difference with this set.
   */
  public symetricDifference(other: IndexedCollection<T, K>): IndexedSet<T, K> {
    return this.leftDifference(other).union(this.rightDifference(other));
  }

  /**
   * Calculates the intersection between this set and the other collection.
   * This set's key function overrides the other collection's key function.
   *
   * @param other - The collection to intersect with this set.
   */
  public intersection(other: IndexedCollection<T, K>): IndexedSet<T, K> {
    return new IndexedSet(
      Array.from(this).filter((item) => other.has(this.key(item))),
      this.key,
    );
  }

  /**
   * Calculates the union between this set and the other collection.
   * Items from the other collection overwrite items with the same key from this set.
   * This set's key function overrides the other collection's key function.
   *
   * @param other - The collection to union with this set.
   */
  public union(other: IndexedCollection<T, K>): IndexedSet<T, K> {
    const newCollection = new IndexedSet(Array.from(this.index.values()), this.key);
    for (const item of other) newCollection.add(item);
    return newCollection;
  }

  /** Returns a plain {@link IndexedCollection} view of this set. */
  public get collection(): IndexedCollection<T, K> {
    return new IndexedCollection(Array.from(this.index.values()), this.key);
  }
}
