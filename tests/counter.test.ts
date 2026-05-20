import { describe, expect, it } from "vitest";
import { Counter } from "../lib/counter";

describe("Counter", () => {
  it("increments counts with add", () => {
    const counter = new Counter<string>();

    counter.add("a");
    counter.add("a");
    counter.add("b");

    expect(counter.get("a")).toBe(2);
    expect(counter.get("b")).toBe(1);
  });

  it("returns 0 for keys that have never been counted", () => {
    const counter = new Counter<string>();

    expect(counter.get("missing")).toBe(0);
  });

  it("decrements counts with decrement", () => {
    const counter = new Counter<string>();

    counter.add("a");
    counter.add("a");
    counter.decrement("a");

    expect(counter.get("a")).toBe(1);
  });

  it("decrements missing keys below zero", () => {
    const counter = new Counter<string>();

    counter.decrement("missing");

    expect(counter.get("missing")).toBe(-1);
  });
});
