import { ObjectExtensions } from "./object";

/**
 * Wrapper around iterables with helpers for zipping, grouping, and set-like checks.
 */
export class IterableExtensions<T> implements Iterable<T> {
  /**
   * Creates a wrapper for the given iterable.
   *
   * @param iterable - The iterable to wrap.
   */
  public constructor(private readonly iterable: Iterable<T>) {}

  /** Iterates over the wrapped values. */
  public [Symbol.iterator](): IterableIterator<T> {
    return Array.from(this.iterable)[Symbol.iterator]();
  }

  /** Returns the underlying iterable. */
  public unwrap(): Iterable<T> {
    return this.iterable;
  }

  /**
   * Returns whether at least one value from `other` is present in this iterable.
   *
   * @param other - The iterable to compare against.
   */
  public hasSome(other: Iterable<T>): boolean {
    const thisSet = new Set(this.iterable);
    for (const item of other) if (thisSet.has(item)) return true;
    return false;
  }

  /**
   * Returns whether every value from `other` is present in this iterable.
   *
   * @param other - The iterable that must be fully contained.
   */
  public hasEvery(other: Iterable<T>): boolean {
    const thisSet = new Set(this.iterable);
    for (const item of other) if (!thisSet.has(item)) return false;
    return true;
  }

  /**
   * Pairs values by index and throws when the iterables have different lengths.
   *
   * @param other - The iterable to zip with this one.
   */
  public zipStrict<TOther>(other: Iterable<TOther>): IterableExtensions<[T, TOther]> {
    const otherArray = Array.from(other);
    const result: [T, TOther][] = [];
    for (const [index, item] of this.enumerate()) {
      const otherItem = otherArray[index];
      if (!otherItem) throw new Error("Iterables must be the same length");
      result.push([item, otherItem]);
    }
    return new IterableExtensions(result);
  }

  /**
   * Pairs values by index. Missing values from `other` become `undefined`.
   *
   * @param other - The iterable to zip with this one.
   */
  public zip<TOther>(other: Iterable<TOther>): IterableExtensions<[T, TOther | undefined]> {
    const otherArray = Array.from(other);
    const result: [T, TOther | undefined][] = [];
    for (const [index, item] of this.enumerate()) {
      result.push([item, otherArray[index] ?? undefined]);
    }
    return new IterableExtensions(result);
  }

  /**
   * Pairs each value with the first match from `other` using the given matcher.
   * Throws when any value has no match.
   *
   * @param other - The iterable to match against.
   * @param key - Returns whether two values should be paired.
   */
  public zipByStrict<TOther>(
    other: Iterable<TOther>,
    key: (item1: T, item2: TOther) => boolean,
  ): IterableExtensions<[T, TOther]> {
    const otherArray = Array.from(other);
    const result: [T, TOther][] = [];
    for (const item of this.iterable) {
      const otherItem = otherArray.find((item2) => key(item, item2));
      if (!otherItem) throw new Error("Iterables must match by key");
      result.push([item, otherItem]);
    }
    return new IterableExtensions(result);
  }

  /**
   * Pairs each value with the first match from `other` using the given matcher.
   *
   * @param other - The iterable to match against.
   * @param key - Returns whether two values should be paired.
   */
  public zipBy<TOther>(
    other: Iterable<TOther>,
    key: (item1: T, item2: TOther) => boolean,
  ): IterableExtensions<[T, TOther | undefined]> {
    const otherArray = Array.from(other);
    const result: [T, TOther | undefined][] = [];
    for (const item of this.iterable) {
      const otherItem = otherArray.find((item2) => key(item, item2));
      result.push([item, otherItem ?? undefined]);
    }
    return new IterableExtensions(result);
  }

  /**
   * Builds a record keyed by the result of `key`, with later items overwriting earlier ones.
   *
   * @param key - Function that returns the record key for an item.
   */
  public indexBy<TKey extends string>(key: (item: T) => TKey): Record<TKey, T> {
    const result: Partial<Record<TKey, T>> = {};
    for (const item of this.iterable) {
      result[key(item)] = item;
    }
    return result as Record<TKey, T>;
  }

  /** Returns each value paired with its zero-based index. */
  public enumerate(): IterableExtensions<[number, T]> {
    const result: [number, T][] = [];
    for (const item of this.iterable) {
      result.push([result.length, item]);
    }
    return new IterableExtensions(result);
  }

  /** Returns a new iterable with duplicate values removed, preserving first occurrence order. */
  public unique(): IterableExtensions<T> {
    const seen = new Set<T>();
    const result: T[] = [];
    for (const item of this.iterable) {
      if (seen.has(item)) continue;
      seen.add(item);
      result.push(item);
    }
    return new IterableExtensions(result);
  }

  /**
   * Returns a new iterable with duplicates removed by key, preserving first occurrence order.
   *
   * @param key - Function that returns the deduplication key for an item.
   */
  public uniqueBy(key: (item: T) => string): IterableExtensions<T> {
    const seen = new Set<string>();
    const result: T[] = [];
    for (const item of this.iterable) {
      const itemKey = key(item);
      if (seen.has(itemKey)) continue;
      seen.add(itemKey);
      result.push(item);
    }
    return new IterableExtensions(result);
  }

  /**
   * Groups items into {@link IterableExtensions} values keyed by `key`.
   *
   * @param key - Function that returns the group key for an item.
   */
  public groupBy<TKey extends string>(key: (item: T) => TKey): Record<TKey, IterableExtensions<T>> {
    const result: Partial<Record<TKey, T[]>> = {};
    for (const item of this.iterable) {
      const itemKey = key(item);
      if (!result[itemKey]) result[itemKey] = [];
      result[itemKey].push(item);
    }
    return ObjectExtensions.fromEntries(
      new ObjectExtensions(result).entries().map(([key, value]) => {
        /* v8 ignore next -- unreachable */
        if (!value) throw new Error("unreachable");
        return [key, new IterableExtensions(value)];
      }),
    ).unwrap();
  }

  /**
   * Splits the iterable into consecutive windows of at most `size` items.
   * The last window may contain fewer items when the length is not evenly divisible.
   *
   * @param size - Maximum number of items in each window.
   * @returns An iterable of window wrappers, one per chunk.
   *
   * @example
   * ```ts
   * [...new IterableExtensions([1, 2, 3, 4, 5]).windows(2).map((window) => [...window])];
   * // [[1, 2], [3, 4], [5]]
   * ```
   */
  public windows(size: number): IterableExtensions<IterableExtensions<T>> {
    const windows: T[][] = [];
    for (const item of this.iterable) {
      const lastWindow = windows.at(-1);
      if (!lastWindow || lastWindow.length === size) windows.push([item]);
      else lastWindow.push(item);
    }
    return new IterableExtensions(windows.map((window) => new IterableExtensions(window)));
  }
}
