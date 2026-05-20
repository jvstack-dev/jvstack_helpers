import { describe, expect, it } from "vitest";
import { Policy, PolicyResult, PolicyResultType } from "../lib/policy";

class AllowWhenPositive extends Policy<number, string> {
  public override execute(value: number): PolicyResult<string> {
    return value > 0 ? PolicyResult.allowed() : PolicyResult.denied(["not positive"]);
  }
}

class AllowWhenEven extends Policy<number, string> {
  public override execute(value: number): PolicyResult<string> {
    return value % 2 === 0 ? PolicyResult.allowed() : PolicyResult.denied(["not even"]);
  }
}

describe("PolicyResult", () => {
  it("creates allowed results", () => {
    const result = PolicyResult.allowed();

    expect(result.type).toBe(PolicyResultType.allowed);
    expect(result.failures).toEqual([]);
  });

  it("creates denied results", () => {
    const result = PolicyResult.denied(["a", "b"]);

    expect(result.type).toBe(PolicyResultType.denied);
    expect(result.failures).toEqual(["a", "b"]);
  });

  it("throws with failures when throw is called on a denied result", () => {
    const failures = ["not positive", "not even"];
    const result = PolicyResult.denied(failures);

    expect(() => result.throw()).toThrow(expect.objectContaining({ failures }));
  });
});

describe("Policy.noop", () => {
  it("always allows", () => {
    const result = Policy.noop<number, string>().execute(42);

    expect(result.type).toBe(PolicyResultType.allowed);
  });
});

describe("Policy.not", () => {
  it("denies when the inner policy allows", () => {
    const result = Policy.not(new AllowWhenPositive(), "denied by not").execute(5);

    expect(result.type).toBe(PolicyResultType.denied);
    expect(result.failures).toEqual(["denied by not"]);
  });

  it("allows when the inner policy denies", () => {
    const result = Policy.not(new AllowWhenPositive(), "denied by not").execute(-1);

    expect(result.type).toBe(PolicyResultType.allowed);
    expect(result.failures).toEqual([]);
  });
});

describe("Policy.and", () => {
  it("allows when every policy allows", () => {
    const result = Policy.and(new AllowWhenPositive(), new AllowWhenEven()).execute(4);

    expect(result.type).toBe(PolicyResultType.allowed);
  });

  it("denies with the first failing policy result", () => {
    const result = Policy.and(new AllowWhenPositive(), new AllowWhenEven()).execute(3);

    expect(result.type).toBe(PolicyResultType.denied);
    expect(result.failures).toEqual(["not even"]);
  });

  it("short-circuits on the first denial", () => {
    const result = Policy.and(new AllowWhenEven(), new AllowWhenPositive()).execute(3);

    expect(result.type).toBe(PolicyResultType.denied);
    expect(result.failures).toEqual(["not even"]);
  });

  it("supports the instance and() helper", () => {
    const result = new AllowWhenPositive().and(new AllowWhenEven()).execute(2);

    expect(result.type).toBe(PolicyResultType.allowed);
  });
});

describe("Policy.or", () => {
  it("allows when any policy allows", () => {
    const result = Policy.or(new AllowWhenPositive(), new AllowWhenEven()).execute(3);

    expect(result.type).toBe(PolicyResultType.allowed);
  });

  it("denies with aggregated failures when every policy denies", () => {
    const result = Policy.or(new AllowWhenPositive(), new AllowWhenEven()).execute(-1);

    expect(result.type).toBe(PolicyResultType.denied);
    expect(result.failures).toEqual(["not positive", "not even"]);
  });

  it("returns on the first allowing policy", () => {
    const result = Policy.or(new AllowWhenEven(), new AllowWhenPositive()).execute(4);

    expect(result.type).toBe(PolicyResultType.allowed);
  });

  it("supports the instance or() helper", () => {
    const result = new AllowWhenPositive().or(new AllowWhenEven()).execute(-2);

    expect(result.type).toBe(PolicyResultType.allowed);
  });
});
