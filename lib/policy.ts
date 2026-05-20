/** Outcome of evaluating a {@link Policy}. */
export enum PolicyResultType {
  allowed = "allowed",
  denied = "denied",
}

/** Error thrown when a denied {@link PolicyResult} is unwrapped with {@link DeniedPolicyResult.throw}. */
class PolicyFailureError<TFailure> extends Error {
  /**
   * @param failures - The failure values collected by the denied policy result.
   */
  public constructor(public readonly failures: TFailure[] | TFailure) {
    super();
  }
}

/** Result of running a {@link Policy}. Use {@link PolicyResult.allowed} or {@link PolicyResult.denied} to create one. */
export abstract class PolicyResult<TFailure = never> {
  /** Whether the policy allowed or denied the context. */
  public abstract type: PolicyResultType;

  /** Failure values collected when the result is denied. Empty when allowed. */
  public abstract readonly failures: TFailure[];

  /** Creates an allowed policy result with no failures. */
  public static allowed(): AllowedPolicyResult {
    return new AllowedPolicyResult();
  }

  /**
   * Creates a denied policy result with the given failures.
   *
   * @param failures - The reasons the policy denied the context.
   */
  public static denied<TFailure>(failures: TFailure[]): DeniedPolicyResult<TFailure> {
    return new DeniedPolicyResult(failures);
  }
}

/** Allowed {@link PolicyResult} with an empty failures list. */
class AllowedPolicyResult extends PolicyResult {
  public override type = PolicyResultType.allowed;
  public override readonly failures: [] = [];
}

/** Denied {@link PolicyResult} that can be thrown as an exception. */
class DeniedPolicyResult<TFailure> extends PolicyResult<TFailure> {
  public override type = PolicyResultType.denied;

  /**
   * @param failures - The reasons the policy denied the context.
   */
  public constructor(public override readonly failures: TFailure[]) {
    super();
  }

  /** Throws a {@link PolicyFailureError} containing this result's failures. */
  public throw(): never {
    throw new PolicyFailureError(this.failures);
  }
}

/**
 * Composable authorization or validation rule.
 *
 * Extend this class and implement {@link Policy.execute}, then combine rules with
 * {@link Policy.and}, {@link Policy.or}, and {@link Policy.not}.
 */
export abstract class Policy<TContext, TFailure> {
  /**
   * Evaluates the policy against the given context.
   *
   * @param ctx - The value or context to validate.
   */
  public abstract execute(ctx: TContext): PolicyResult<TFailure>;

  /** Combines this policy with another using logical AND. */
  public and(policy: Policy<TContext, TFailure>): Policy<TContext, TFailure> {
    return Policy.and(this, policy);
  }

  /** Combines this policy with another using logical OR. */
  public or(policy: Policy<TContext, TFailure>): Policy<TContext, TFailure> {
    return Policy.or(this, policy);
  }

  /**
   * Creates a policy that allows only when every inner policy allows.
   *
   * @param policies - Policies that must all pass.
   */
  public static and<TContext, TFailure>(...policies: Policy<TContext, TFailure>[]): Policy<TContext, TFailure> {
    return new AndPolicy(policies);
  }

  /**
   * Creates a policy that allows when any inner policy allows.
   *
   * @param policies - Policies where at least one must pass.
   */
  public static or<TContext, TFailure>(...policies: Policy<TContext, TFailure>[]): Policy<TContext, TFailure> {
    return new OrPolicy(policies);
  }

  /** Creates a policy that always allows. */
  public static noop<TContext, TFailure>(): Policy<TContext, TFailure> {
    return new NoopPolicy();
  }

  /**
   * Inverts a policy, denying with a fixed failure when the inner policy would allow.
   *
   * @param policy - The policy to invert.
   * @param failure - The failure returned when the inner policy allows.
   */
  public static not<TContext, TFailure>(
    policy: Policy<TContext, TFailure>,
    failure: TFailure,
  ): Policy<TContext, TFailure> {
    return new NotPolicy(policy, failure);
  }
}

/** Policy that requires every inner policy to allow. Short-circuits on the first denial. */
class AndPolicy<TContext, TFailure> extends Policy<TContext, TFailure> {
  /**
   * @param policies - Policies that must all pass.
   */
  public constructor(private readonly policies: Policy<TContext, TFailure>[]) {
    super();
  }

  /** @inheritdoc */
  public override execute(ctx: TContext): PolicyResult<TFailure> {
    for (const policy of this.policies) {
      const result = policy.execute(ctx);
      if (result.type === PolicyResultType.denied) return result;
    }
    return PolicyResult.allowed();
  }
}

/** Policy that allows when any inner policy allows. Aggregates failures when all deny. */
class OrPolicy<TContext, TFailure> extends Policy<TContext, TFailure> {
  /**
   * @param policies - Policies where at least one must pass.
   */
  public constructor(private readonly policies: Policy<TContext, TFailure>[]) {
    super();
  }

  /** @inheritdoc */
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

/** Policy that inverts another policy's outcome. */
class NotPolicy<TContext, TFailure> extends Policy<TContext, TFailure> {
  /**
   * @param policy - The policy to invert.
   * @param failure - The failure returned when the inner policy allows.
   */
  public constructor(
    private readonly policy: Policy<TContext, TFailure>,
    private readonly failure: TFailure,
  ) {
    super();
  }

  /** @inheritdoc */
  public override execute(ctx: TContext): PolicyResult<TFailure> {
    switch (this.policy.execute(ctx).type) {
      case PolicyResultType.allowed:
        return PolicyResult.denied([this.failure]);
      case PolicyResultType.denied:
        return PolicyResult.allowed();
    }
  }
}

/** Policy that always allows, regardless of context. */
class NoopPolicy<TContext, TFailure> extends Policy<TContext, TFailure> {
  /** @inheritdoc */
  public override execute(_ctx: TContext): PolicyResult<TFailure> {
    return PolicyResult.allowed();
  }
}
