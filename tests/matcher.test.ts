import { describe, expect, it } from "vitest";
import { Matcher } from "../lib/matcher";

describe("Matcher", () => {
  it("returns the matched branch result", () => {
    type Shape = { kind: "circle"; radius: number } | { kind: "square"; side: number };

    const circle: Shape = { kind: "circle", radius: 5 };
    const square: Shape = { kind: "square", side: 4 };

    expect(
      new Matcher<Shape, "kind">(circle, "kind").match({
        circle: (value: Extract<Shape, { kind: "circle" }>) => value.radius * 2,
        square: (value: Extract<Shape, { kind: "square" }>) => value.side * 4,
      }),
    ).toBe(10);

    expect(
      new Matcher<Shape, "kind">(square, "kind").match({
        circle: (value: Extract<Shape, { kind: "circle" }>) => value.radius * 2,
        square: (value: Extract<Shape, { kind: "square" }>) => value.side * 4,
      }),
    ).toBe(16);
  });

  it("passes the narrowed object to the callback", () => {
    type Event = { type: "click"; x: number; y: number } | { type: "keydown"; key: string };

    const result = new Matcher<Event, "type">({ type: "click", x: 1, y: 2 }, "type").match({
      click: (event) => [event.x, event.y].join(","),
      keydown: (event) => event.key,
    });

    expect(result).toBe("1,2");
  });

  it("throws when the discriminant value has no matching pattern", () => {
    const value = { status: "pending" as const, id: 1 };

    expect(() =>
      new Matcher(value, "status").match({
        // @ts-expect-error - this is a test
        active: () => "active",
        archived: () => "archived",
      }),
    ).toThrow();
  });
});
