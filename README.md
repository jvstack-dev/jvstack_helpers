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
| `IndexedCollection` | Key-indexed collection of items |
| `IndexedSet` | Set operations over indexed collections |
| `Counter` | Mutable counts keyed by property keys |

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

## IndexedCollection

Stores items in a collection keyed by a function. Duplicate keys overwrite earlier items.

```ts
import { IndexedCollection } from "@jvstack/helpers";

type User = { id: number; name: string };

const users = new IndexedCollection(
  [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
  ],
  (user) => user.id,
);

users.get(1); // { id: 1, name: "Alice" }
users.add({ id: 3, name: "Carol" });
[...users]; // all items

const admins = users.set.leftDifference(otherUsers);
const shared = users.set.intersection(otherUsers);
const everyone = users.set.union(otherUsers);
```

Use `.set` to get an `IndexedSet` with `leftDifference`, `rightDifference`, `symmetricDifferenec`, `intersection`, and `union`. Operations compare items by key, not reference.

## Counter

Tracks numeric counts for arbitrary keys. Missing keys read as `0`.

```ts
import { Counter } from "@jvstack/helpers";

const counter = new Counter<string>();

counter.add("click");
counter.add("click");
counter.add("view");

counter.get("click"); // 2
counter.get("view"); // 1
counter.get("missing"); // 0

counter.decrement("click");
counter.get("click"); // 1
```

## License

MIT
