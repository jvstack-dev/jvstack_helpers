export class ObjectExtensions<T extends Record<PropertyKey, unknown>> {
  public constructor(private readonly obj: T) {}

  public entries(): [key: keyof T, value: T[keyof T]][] {
    return Object.entries(this.obj) as [key: keyof T, value: T[keyof T]][];
  }

  public static fromEntries<T extends (readonly [PropertyKey, unknown])[]>(
    obj: T,
  ): ObjectExtensions<Record<T[number][0], T[number][1]>> {
    return new ObjectExtensions(Object.fromEntries(obj) as Record<T[number][0], T[number][1]>);
  }

  public keys(): (keyof T)[] {
    return Object.keys(this.obj);
  }

  public values(): T[keyof T][] {
    return Object.values(this.obj) as T[keyof T][];
  }

  public omit<T extends Record<PropertyKey, unknown>, TKey extends keyof T>(
    ...ks: TKey[]
  ): ObjectExtensions<Omit<T, TKey>> {
    const omitted: (keyof T)[] = ks;
    const result = ObjectExtensions.fromEntries(this.entries().filter(([key]) => !omitted.includes(key)));
    return new ObjectExtensions(result as unknown as Omit<T, TKey>);
  }

  public unwrap(): T {
    return this.obj;
  }
}
