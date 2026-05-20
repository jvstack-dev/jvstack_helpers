/**
 * Mutable counter map keyed by any property key type.
 */
export class Counter<T extends PropertyKey> {
  private readonly map = new Map<T, number>();

  /**
   * Increments the count for the given key by one.
   *
   * @param key - The key whose count should increase.
   */
  public add(key: T): void {
    this.map.set(key, (this.map.get(key) ?? 0) + 1);
  }

  /**
   * Decrements the count for the given key by one.
   *
   * @param key - The key whose count should decrease.
   */
  public decrement(key: T): void {
    this.map.set(key, (this.map.get(key) ?? 0) - 1);
  }

  /**
   * Returns the current count for the given key, or `0` if it has never been set.
   *
   * @param key - The key to read.
   */
  public get(key: T): number {
    return this.map.get(key) ?? 0;
  }
}
