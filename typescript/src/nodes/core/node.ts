import { AgentContext } from "@/agent/core/context";

/**
 * Result produced by a node during execution.
 * Each node implementation is responsible for:
 * - reading previous entries if needed
 * - pushing its own entry when it finishes
 */
export interface NodeResult {
  nodeId: string;
  value: unknown;
}

/**
 * Minimal node contract used by the agent.
 * Nodes are chained via `next` and may have a local `errorHandler`.
 */
export interface INode {
  id: string;
  next: INode | null;
  errorHandler: INode | null;

  /**
   * Link another node as the success path of this node.
   * Returns the passed node to support fluent chaining.
   *
   * @example
   * loadFile.add(extract).add(normalize);
   */
  add(node: INode): INode;

  /**
   * Execute this node.
   * Implementations should:
   * - read any previous results they depend on from `ctx.nodeResults`
   * - push their own result into `ctx.nodeResults`
   * - optionally update other fields in `ctx` as needed
   */
  run(ctx?: AgentContext): Promise<void>;
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
 *   async run(ctx: AgentContext): Promise<void> {
 *     ctx.nodeResults ??= [];
 *     const raw = ctx.user.request;
 *     ctx.nodeResults.push({ nodeId: this.id, value: raw });
 *   }
 * }
 *
 * const loadFile = new LoadFileNode();
 * const nextNode = new SomeOtherNode();
 * loadFile.add(nextNode);
 */
export abstract class BaseNode implements INode {
  next: INode | null = null;
  errorHandler: INode | null = null;

  constructor(public readonly id: string) {}

  add(node: INode): INode {
    this.next = node;
    return node;
  }

  abstract run(ctx: AgentContext): Promise<void>;
}
