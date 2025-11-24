import { INode, NodeResult } from "@/nodes/core/node";
import { IAgentContext } from "@/agent/core/context";

/**
 * Global configuration for an agent run.
 * These are interpreted by the agent implementation, not by nodes.
 */
export interface IAgentConfig {
  mode?: "single-run" | "interactive";
  maxNodes?: number;
  maxDurationMs?: number;
}

/**
 * Public agent contract.
 * Any agent implementation must respect this interface in order to be swappable.
 */
export interface IAgent {
  context: IAgentContext;

  /**
   * Configure the agent execution behaviour (safety limits, mode, etc.).
   */
  options(opts: Partial<IAgentConfig>): this;

  /**
   * Patch the current context before or during a run.
   * The caller is responsible for providing well-formed data.
   */
  withContext(patch: Partial<IAgentContext>): this;

  /**
   * Add a node to this agent's chain.
   * The first node added becomes the root.
   * Subsequent nodes are appended to the end of the chain.
   */
  add(node: INode): INode;

  /**
   * Set a global error handler called when a node throws
   * and has no local `errorHandler`.
   */
  error(handler: INode): this;

  /**
   * Execute the chain starting at the root node.
   * Optionally accepts a context patch that will be merged before running.
   */
  run(initial?: Partial<IAgentContext>): Promise<IAgentContext>;
}

/**
 * Base agent providing common behaviour (chain management, config, etc.).
 * Concrete agents should extend this and implement the `run` method.
 */
export abstract class BaseAgent implements IAgent {
  context: IAgentContext;

  // First node in the chain
  protected root: INode | null = null;

  protected lastNode: INode | null = null;

  // Fallback error handler when a node throws
  protected globalErrorHandler: INode | null = null;

  // Execution configuration (limits, mode, etc.)
  protected config: IAgentConfig = {};

  protected lastNodeResult: NodeResult | null = null;

  constructor(initialContext: IAgentContext) {
    this.context = initialContext;
  }

  options(opts: Partial<IAgentConfig>): this {
    this.config = { ...this.config, ...opts };
    return this;
  }

  withContext(patch: Partial<IAgentContext>): this {
    this.context = { ...this.context, ...patch };
    return this;
  }

  add(node: INode): INode {
    if (!this.root) {
      this.root = node;
      this.lastNode = node;
    } else {
      this.lastNode!.next = node;
      this.lastNode = node;
    }

    return node;
  }

  error(handler: INode): this {
    this.globalErrorHandler = handler;
    return this;
  }

  abstract run(initial?: Partial<IAgentContext>): Promise<IAgentContext>;
}

/**
 * Default concrete agent implementation with a simple linear run loop.
 * - Executes nodes in order, following `next`
 * - Applies `maxNodes` and `maxDurationMs` safety limits
 * - Records telemetry events if `context.telemetry.events` exists
 * - Captures node return values and stores them in ctx.nodeResults
 */
export class Agent extends BaseAgent {
  constructor(initialContext: IAgentContext) {
    super(initialContext);
  }

  async run(initial?: Partial<IAgentContext>): Promise<IAgentContext> {
    if (initial) {
      this.withContext(initial);
    }

    if (!this.root) {
      throw new Error("Agent has no nodes configured");
    }

    this.context.nodeResults ??= [];

    let current: INode | null = this.root;
    let steps = 0;
    const startTime = Date.now();

    while (current) {
      if (this.context.workflow) {
        this.context.workflow.currentNodeId = current.id;
      }

      steps++;

      // Safety guard: maximum number of nodes per run
      if (this.config.maxNodes && steps > this.config.maxNodes) {
        this.context.error = new Error("Max nodes exceeded");
        break;
      }

      // Safety guard: maximum wall-clock duration per run
      if (
        this.config.maxDurationMs &&
        Date.now() - startTime > this.config.maxDurationMs
      ) {
        this.context.error = new Error("Max duration exceeded");
        break;
      }

      try {
        const result = await current.run(this.context);

        if (result) {
          this.context.nodeResults.push(result);
          this.context.lastNodeResult = result;
        }

        if (this.context.telemetry?.events) {
          this.context.telemetry.events.push({
            nodeId: current.id,
            at: Date.now(),
            status: "ok",
          });
        }

        current = current.next;
      } catch (err) {
        if (!current) {
          return this.context;
        }

        if (this.context.telemetry?.events) {
          this.context.telemetry.events.push({
            nodeId: current.id,
            at: Date.now(),
            status: "error",
          });
        }

        this.context.error = err;
        current = current.errorHandler ?? this.globalErrorHandler;
      }
    }

    console.log("Run completed. Final context: ", this.context);

    return this.context;
  }
}
