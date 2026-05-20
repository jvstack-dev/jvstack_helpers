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

export class Matcher<TObject extends Record<string, unknown>, TDiscriminantKey extends string & keyof TObject> {
  public constructor(
    private readonly object: TObject,
    private readonly discriminantKey: TDiscriminantKey,
  ) {}

  public match<TReturn>(patterns: {
    [Value in string & TObject[TDiscriminantKey]]: MatchCallback<TObject, TDiscriminantKey, Value, TReturn>;
  }): TReturn {
    type Key = keyof typeof patterns;

    const value = this.object[this.discriminantKey] as Key;
    return patterns[value](this.object as Narrowed<TObject, TDiscriminantKey, typeof value & string>);
  }
}
