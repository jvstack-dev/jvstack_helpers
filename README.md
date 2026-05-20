# @jvstack/helpers

Collection of helpers I use in all my projects.

## Installation

```bash
npm install @jvstack/helpers
```

## Exports

| Export | Description |
| --- | --- |
| `ObjectExtensions` | Typed wrapper for object entries, keys, values, and omit |
| `Matcher` | Type-safe matcher for discriminated unions |
| `Policy` | Composable allow/deny rules |
| `PolicyResult` | Result of evaluating a policy |
| `PolicyResultType` | Enum with `allowed` and `denied` |

## ObjectExtensions

Wraps a plain object and returns typed helpers instead since the default ones are not properly typed.

```ts
import { ObjectExtensions } from "@jvstack/helpers";

const obj = new ObjectExtensions({ a: 1, b: 2, c: 3 });

obj.entries(); // [["a", 1], ["b", 2], ["c", 3]]
obj.keys(); // ["a", "b", "c"]
obj.values(); // [1, 2, 3]

obj.omit("b").unwrap(); // { a: 1, c: 3 }

ObjectExtensions.fromEntries([
  ["a", 1],
  ["b", true],
] as const).unwrap(); // { a: 1, b: true }
```

## Matcher

Matches on a discriminant field and narrows the union inside each branch callback.

```ts
import { Matcher } from "@jvstack/helpers";

type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; side: number };

const circle: Shape = { kind: "circle", radius: 5 };

const area = new Matcher(circle, "kind").match({
  circle: (value) => Math.PI * value.radius ** 2,
  square: (value) => value.side ** 2,
});
```

Event handling example:

```ts
type Event =
  | { type: "click"; x: number; y: number }
  | { type: "keydown"; key: string };

const label = new Matcher({ type: "click", x: 1, y: 2 }, "type").match({
  click: (event) => `${event.x},${event.y}`,
  keydown: (event) => event.key,
});
```

## Policy

Model validation or authorization as composable rules. Each policy returns a `PolicyResult` that is either allowed or denied with failure values.

```ts
import { Policy, PolicyResult, PolicyResultType } from "@jvstack/helpers";

class AllowWhenPositive extends Policy<number, string> {
  execute(value: number) {
    return value > 0
      ? PolicyResult.allowed()
      : PolicyResult.denied(["not positive"]);
  }
}

class AllowWhenEven extends Policy<number, string> {
  execute(value: number) {
    return value % 2 === 0
      ? PolicyResult.allowed()
      : PolicyResult.denied(["not even"]);
  }
}

const policy = Policy.and(new AllowWhenPositive(), new AllowWhenEven());

const result = policy.execute(4);

if (result.type === PolicyResultType.denied) {
  result.throw(); // throws with { failures: [...] }
}
```

Combine policies with static helpers or instance methods:

```ts
Policy.and(new AllowWhenPositive(), new AllowWhenEven());
Policy.or(new AllowWhenPositive(), new AllowWhenEven());
Policy.not(new AllowWhenPositive(), "denied by not");
Policy.noop<number, string>();

new AllowWhenPositive().and(new AllowWhenEven());
new AllowWhenPositive().or(new AllowWhenEven());
```

Behavior:

- `and` — all policies must allow; stops at the first denial
- `or` — any policy may allow; collects failures when all deny
- `not` — inverts a single policy
- `noop` — always allows

## License

MIT
