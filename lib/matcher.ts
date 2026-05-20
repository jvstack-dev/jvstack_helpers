type Narrowed<
  TObject extends Record<string, unknown>,
  TDiscriminantKey extends string & keyof TObject,
  TDiscriminantValue extends string & TObject[TDiscriminantKey],
> = Extract<TObject, Record<TDiscriminantKey, TDiscriminantValue>>;

type MatchCallback<
  TObject extends Record<string, unknown>,
  TDiscriminantKey extends string & keyof TObject,
  TDiscriminantValue extends string & TObject[TDiscriminantKey],
  TReturn,
> = (value: Narrowed<TObject, TDiscriminantKey, TDiscriminantValue>) => TReturn;

/**
 * Type-safe discriminated union matcher, similar to a `switch` on a union's discriminant field.
 */
export class Matcher<TObject extends Record<string, unknown>, TDiscriminantKey extends string & keyof TObject> {
  /**
   * Creates a matcher for the given object and discriminant key.
   *
   * @param object - The union value to match against.
   * @param discriminantKey - The property used to select the matching branch.
   */
  public constructor(
    private readonly object: TObject,
    private readonly discriminantKey: TDiscriminantKey,
  ) {}

  /**
   * Runs the callback for the branch that matches the object's discriminant value.
   *
   * @param patterns - A map from discriminant values to handlers. Each handler receives
   * the object narrowed to the corresponding union member.
   * @returns The value returned by the matched handler.
   */
  public match<TReturn>(patterns: {
    [Value in string & TObject[TDiscriminantKey]]: MatchCallback<TObject, TDiscriminantKey, Value, TReturn>;
  }): TReturn {
    type Key = keyof typeof patterns;

    const value = this.object[this.discriminantKey] as Key;
    return patterns[value](this.object as Narrowed<TObject, TDiscriminantKey, typeof value & string>);
  }
}
