/**
 * Array subclass with helpers for zipping, grouping, deduplication, and set-like checks.
 */
export class ArrayExtensions<T> extends Array<T> {
  public constructor(...items: T[]) {
    super();
    this.push(...items);
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Returns whether at least one value from `other` is present in this array.
   *
   * @param other - The values to compare against.
   */
  public hasSome(other: Iterable<T>): boolean {
    const thisSet = new Set(this);
    for (const item of other) if (thisSet.has(item)) return true;
    return false;
  }

  /**
   * Returns whether every value from `other` is present in this array.
   *
   * @param other - The values that must be fully contained.
   */
  public hasEvery(other: Iterable<T>): boolean {
    const thisSet = new Set(this);
    for (const item of other) if (!thisSet.has(item)) return false;
    return true;
  }

  /**
   * Pairs values by index and throws when this array and `other` have different lengths.
   *
   * @param other - The values to zip with this array.
   */
  public zipStrict<TOther>(other: Iterable<TOther>): ArrayExtensions<[T, TOther]> {
    const otherArray = new ArrayExtensions(...other);
    const result = new ArrayExtensions<[T, TOther]>();
    for (const [index, item] of this.enumerate()) {
      const otherItem = otherArray[index];
      if (!otherItem) throw new Error("Arrays must be the same length");
      result.push([item, otherItem]);
    }
    return result;
  }

  /**
   * Pairs values by index. Missing values from `other` become `undefined`.
   *
   * @param other - The values to zip with this array.
   */
  public zip<TOther>(other: Iterable<TOther>): ArrayExtensions<[T, TOther | undefined]> {
    const otherArray = new ArrayExtensions(...other);
    const result = new ArrayExtensions<[T, TOther | undefined]>();
    for (const [index, item] of this.enumerate()) {
      result.push([item, otherArray[index] ?? undefined]);
    }
    return result;
  }

  /**
   * Pairs each value with the first match from `other` using the given matcher.
   * Throws when any value has no match.
   *
   * @param other - The values to match against.
   * @param key - Returns whether two values should be paired.
   */
  public zipByStrict<TOther>(
    other: Iterable<TOther>,
    key: (item1: T, item2: TOther) => boolean,
  ): ArrayExtensions<[T, TOther]> {
    const otherArray = new ArrayExtensions(...other);
    const result = new ArrayExtensions<[T, TOther]>();
    for (const item of this) {
      const otherItem = otherArray.find((item2) => key(item, item2));
      if (!otherItem) throw new Error("Iterables must match by key");
      result.push([item, otherItem]);
    }
    return result;
  }

  /**
   * Pairs each value with the first match from `other` using the given matcher.
   *
   * @param other - The values to match against.
   * @param key - Returns whether two values should be paired.
   */
  public zipBy<TOther>(
    other: Iterable<TOther>,
    key: (item1: T, item2: TOther) => boolean,
  ): ArrayExtensions<[T, TOther | undefined]> {
    const otherArray = new ArrayExtensions(...other);
    const result = new ArrayExtensions<[T, TOther | undefined]>();
    for (const item of this) {
      const otherItem = otherArray.find((item2) => key(item, item2));
      result.push([item, otherItem ?? undefined]);
    }
    return result;
  }

  /**
   * Builds a record keyed by the result of `key`, with later items overwriting earlier ones.
   *
   * @param key - Function that returns the record key for an item.
   */
  public indexBy<TKey extends string>(key: (item: T) => TKey): Record<TKey, T> {
    const result: Partial<Record<TKey, T>> = {};
    for (const item of this) {
      result[key(item)] = item;
    }
    return result as Record<TKey, T>;
  }

  /** Returns each value paired with its zero-based index. */
  public enumerate(): ArrayExtensions<[number, T]> {
    const result = new ArrayExtensions<[number, T]>();
    for (const item of this) {
      result.push([result.length, item]);
    }
    return result;
  }

  /** Returns a new array with duplicate values removed, preserving first occurrence order. */
  public unique(): ArrayExtensions<T> {
    const seen = new Set<T>();
    const result = new ArrayExtensions<T>();
    for (const item of this) {
      if (seen.has(item)) continue;
      seen.add(item);
      result.push(item);
    }
    return result;
  }

  /**
   * Returns a new array with duplicates removed by key, preserving first occurrence order.
   *
   * @param key - Function that returns the deduplication key for an item.
   */
  public uniqueBy(key: (item: T) => string): ArrayExtensions<T> {
    const seen = new Set<string>();
    const result = new ArrayExtensions<T>();
    for (const item of this) {
      const itemKey = key(item);
      if (seen.has(itemKey)) continue;
      seen.add(itemKey);
      result.push(item);
    }
    return result;
  }

  /**
   * Groups items into {@link ArrayExtensions} values keyed by `key`.
   *
   * @param key - Function that returns the group key for an item.
   */
  public groupBy<TKey extends string>(key: (item: T) => TKey): Record<TKey, ArrayExtensions<T>> {
    const result: Partial<Record<TKey, T[]>> = {};
    for (const item of this) {
      const itemKey = key(item);
      if (!result[itemKey]) result[itemKey] = new ArrayExtensions<T>();
      result[itemKey].push(item);
    }
    return result as Record<TKey, ArrayExtensions<T>>;
  }

  /**
   * Splits the array into consecutive windows of at most `size` items.
   * The last window may contain fewer items when the length is not evenly divisible.
   *
   * @param size - Maximum number of items in each window.
   * @returns An array of window arrays, one per chunk.
   *
   * @example
   * ```ts
   * [...new ArrayExtensions(1, 2, 3, 4, 5).windows(2).map((window) => [...window])];
   * // [[1, 2], [3, 4], [5]]
   * ```
   */
  public windows(size: number): ArrayExtensions<ArrayExtensions<T>> {
    const windows = new ArrayExtensions<ArrayExtensions<T>>();
    for (const item of this) {
      const lastWindow = windows.at(-1);
      if (!lastWindow || lastWindow.length === size) windows.push(new ArrayExtensions(item));
      else lastWindow.push(item);
    }
    return windows;
  }

  /**
   * Returns an array of numbers from start to end with the given step.
   *
   * @param start - The starting number.
   * @param end - The ending number.
   * @param config - The configuration for the range. Optional.
   * @param config.step - The step between numbers. Defaults to 1.
   * @param config.inclusive - Whether to include the end number in the range. Defaults to false.
   *
   * @example
   * ```ts
   * ArrayExtensions.range(1, 5, { step: 2, inclusive: true });
   * // [1, 3, 5]
   * ```
   */
  public static range(
    start: number,
    end: number,
    config?: { step?: number; inclusive?: boolean },
  ): ArrayExtensions<number> {
    const inclusive = config?.inclusive ?? false;
    const step = config?.step ?? 1;
    const result = new ArrayExtensions<number>();
    for (let i = start; inclusive ? i <= end : i < end; i += step) {
      result.push(i);
    }
    return result;
  }
}
