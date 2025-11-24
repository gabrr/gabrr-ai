import { IAgentContext } from "@/agent/core/context";

/**
 * Result produced by a node during execution.
 * Nodes return this value from run(), and the agent is responsible for
 * storing it in ctx.nodeResults.
 */
export interface NodeResult {
  nodeId: string;
  value: unknown;
}

/**
 * Minimal node contract used by the agent.
 * Nodes are chained via `next` and may have a local `errorHandler`.
 * The fluent methods allow:
 * - `.add(nextNode)` to define the success path
 * - `.error(handlerNode)` to define a local error handler
 * - `.try(retryFlowNode)` to define a retry flow as a separate chain
 * - `.options(config)` to attach node-specific configuration
 */
export interface INode {
  id: string;
  next: INode | null;
  errorHandler: INode | null;

  /**
   * Attach a node as the success path after this node.
   * Returns the passed node to support chaining like:
   *   a.add(b).add(c)
   */
  add(node: INode): INode;

  /**
   * Set a local error handler for this node.
   * Returns `this` so you can keep chaining the main flow:
   *   normalize.error(warnUser).add(nextNode)
   */
  error(handler: INode): this;

  /**
   * Attach a retry (or recovery) flow as this node's error path.
   * Returns the retry node so you can chain its own sequence:
   *   categorize.try(tryAgain.options(...).add(...))
   */
  try(node: INode): INode;

  /**
   * Attach node-specific configuration (implementation-defined).
   * BaseNode stores it, concrete nodes decide how to use it.
   */
  options(opts: Record<string, unknown>): this;

  /**
   * Execute this node.
   * Implementations should:
   * - read any previous results they depend on from `ctx.nodeResults`
   * - return a NodeResult (or void) which the agent will store
   * - optionally update other fields in `ctx` as needed
   */
  run(ctx: IAgentContext): Promise<NodeResult | void>;
}

/**
 * Base class to simplify node creation.
 * Extend this and implement `run` only.
 *
 * @example
 * class LoadFileNode extends BaseNode {
 *   constructor() {
 *     super("loadFile");
 *   }
 *
 *   async run(ctx: AgentContext): Promise<NodeResult | void> {
 *     const raw = ctx.user.request;
 *     return { nodeId: this.id, value: raw };
 *   }
 * }
 *
 * const loadFile = new LoadFileNode();
 * const nextNode = new SomeOtherNode();
 * loadFile.add(nextNode).error(new WarnUserNode());
 */
export abstract class BaseNode implements INode {
  abstract id: string;
  next: INode | null = null;
  errorHandler: INode | null = null;

  // Optional per-node configuration, set via .options()
  protected _options: Record<string, unknown> = {};

  add(node: INode): INode {
    this.next = node;
    return node;
  }

  error(handler: INode): this {
    this.errorHandler = handler;
    return this;
  }

  try(node: INode): INode {
    this.errorHandler = node;
    return node;
  }

  options(opts: Record<string, unknown>): this {
    this._options = { ...this._options, ...opts };
    return this;
  }

  abstract run(ctx: IAgentContext): Promise<NodeResult | void>;
}
