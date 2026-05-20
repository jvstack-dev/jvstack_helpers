export enum PolicyResultType {
  allowed = "allowed",
  denied = "denied",
}

class PolicyFailureError<TFailure> extends Error {
  public constructor(public readonly failures: TFailure[] | TFailure) {
    super();
  }
}

export abstract class PolicyResult<TFailure = never> {
  public abstract type: PolicyResultType;
  public abstract readonly failures: TFailure[];
  public static allowed(): AllowedPolicyResult {
    return new AllowedPolicyResult();
  }
  public static denied<TFailure>(failures: TFailure[]): DeniedPolicyResult<TFailure> {
    return new DeniedPolicyResult(failures);
  }
}

class AllowedPolicyResult extends PolicyResult {
  public override type = PolicyResultType.allowed;
  public override readonly failures: [] = [];
}

class DeniedPolicyResult<TFailure> extends PolicyResult<TFailure> {
  public override type = PolicyResultType.denied;
  public constructor(public override readonly failures: TFailure[]) {
    super();
  }
  public throw(): never {
    throw new PolicyFailureError(this.failures);
  }
}

export abstract class Policy<TContext, TFailure> {
  public abstract execute(ctx: TContext): PolicyResult<TFailure>;
  public and(policy: Policy<TContext, TFailure>): Policy<TContext, TFailure> {
    return Policy.and(this, policy);
  }
  public or(policy: Policy<TContext, TFailure>): Policy<TContext, TFailure> {
    return Policy.or(this, policy);
  }
  public static and<TContext, TFailure>(...policies: Policy<TContext, TFailure>[]): Policy<TContext, TFailure> {
    return new AndPolicy(policies);
  }
  public static or<TContext, TFailure>(...policies: Policy<TContext, TFailure>[]): Policy<TContext, TFailure> {
    return new OrPolicy(policies);
  }
  public static noop<TContext, TFailure>(): Policy<TContext, TFailure> {
    return new NoopPolicy();
  }
  public static not<TContext, TFailure>(
    policy: Policy<TContext, TFailure>,
    failure: TFailure,
  ): Policy<TContext, TFailure> {
    return new NotPolicy(policy, failure);
  }
}

class AndPolicy<TContext, TFailure> extends Policy<TContext, TFailure> {
  public constructor(private readonly policies: Policy<TContext, TFailure>[]) {
    super();
  }

  public override execute(ctx: TContext): PolicyResult<TFailure> {
    for (const policy of this.policies) {
      const result = policy.execute(ctx);
      if (result.type === PolicyResultType.denied) return result;
    }
    return PolicyResult.allowed();
  }
}

class OrPolicy<TContext, TFailure> extends Policy<TContext, TFailure> {
  public constructor(private readonly policies: Policy<TContext, TFailure>[]) {
    super();
  }

  public override execute(ctx: TContext): PolicyResult<TFailure> {
    const failures: TFailure[] = [];
    for (const policy of this.policies) {
      const result = policy.execute(ctx);
      if (result.type === PolicyResultType.allowed) return result;
      failures.push(...result.failures);
    }
    return PolicyResult.denied(failures);
  }
}

class NotPolicy<TContext, TFailure> extends Policy<TContext, TFailure> {
  public constructor(
    private readonly policy: Policy<TContext, TFailure>,
    private readonly failure: TFailure,
  ) {
    super();
  }
  public override execute(ctx: TContext): PolicyResult<TFailure> {
    switch (this.policy.execute(ctx).type) {
      case PolicyResultType.allowed:
        return PolicyResult.denied([this.failure]);
      case PolicyResultType.denied:
        return PolicyResult.allowed();
    }
  }
}

class NoopPolicy<TContext, TFailure> extends Policy<TContext, TFailure> {
  public override execute(_ctx: TContext): PolicyResult<TFailure> {
    return PolicyResult.allowed();
  }
}
