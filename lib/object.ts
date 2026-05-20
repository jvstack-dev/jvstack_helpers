/**
 * Typed wrapper around plain objects with helpers for entries, keys, values, and omit.
 */
export class ObjectExtensions<T extends Record<PropertyKey, unknown>> {
  /**
   * Creates a wrapper for the given object.
   *
   * @param obj - The object to wrap.
   */
  public constructor(private readonly obj: T) {}

  /**
   * Returns the object's entries with keys and values preserved in the wrapper's type.
   */
  public entries(): [key: keyof T, value: T[keyof T]][] {
    return Object.entries(this.obj) as [key: keyof T, value: T[keyof T]][];
  }

  /**
   * Creates an {@link ObjectExtensions} instance from an array of key-value pairs.
   *
   * @param obj - The entries used to build the object.
   */
  public static fromEntries<T extends (readonly [PropertyKey, unknown])[]>(
    obj: T,
  ): ObjectExtensions<Record<T[number][0], T[number][1]>> {
    return new ObjectExtensions(Object.fromEntries(obj) as Record<T[number][0], T[number][1]>);
  }

  /**
   * Returns the object's keys with the wrapper's key type.
   */
  public keys(): (keyof T)[] {
    return Object.keys(this.obj);
  }

  /**
   * Returns the object's values with the wrapper's value type.
   */
  public values(): T[keyof T][] {
    return Object.values(this.obj) as T[keyof T][];
  }

  /**
   * Returns a new wrapper with the given keys removed.
   *
   * @param ks - The keys to omit from the object.
   */
  public omit<TKey extends keyof T>(...ks: TKey[]): ObjectExtensions<Omit<T, TKey>> {
    const omitted = new Set<PropertyKey>(ks);
    const entries = this.entries().filter(([key]) => !omitted.has(key));
    return new ObjectExtensions(Object.fromEntries(entries) as Omit<T, TKey>);
  }

  /**
   * Returns the underlying object.
   */
  public unwrap(): T {
    return this.obj;
  }
}
