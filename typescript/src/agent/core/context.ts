import { NodeResult } from "../../nodes/core/node";

/**
 * Shared context passed to every node and the agent.
 * You can extend this with more fields as your application grows.
 */
export interface IAgentContext {
  // Required: we always need an input request to start a run
  user?: {
    request?: string;
    id?: string;
    locale?: string;
    channel?: "cli" | "web" | "api" | "mobile";
  };

  // Optional: high-level instructions / style / constraints
  instructions: {
    system: string;
    style?: string;
    constraints?: string[];
  };

  // Optional: memory for nodes that want to use it
  memory?: {
    shortTerm: {
      messages: Array<{ role: "user" | "agent"; content: string }>;
    };
    longTerm: {
      search: (query: string) => Promise<unknown[]>;
      writeNote: (note: string) => Promise<void>;
    };
  };

  // Optional: workflow metadata
  workflow?: {
    currentNodeId?: string;
    plan?: unknown;
    retries?: Record<string, number>;
    tags?: string[];
  };

  // Optional: shared tools for nodes (LLM, HTTP, logger, etc.)
  tools?: {
    llm?: (input: string, options?: unknown) => Promise<string>;
    http?: (req: { url: string; method?: string; body?: any }) => Promise<any>;
    logger?: (msg: string, meta?: Record<string, unknown>) => void;
  };

  // Optional: telemetry recorded by the agent
  telemetry?: {
    events?: Array<{
      nodeId: string;
      at: number;
      status: "ok" | "error";
    }>;
  };

  /**
   * Log of results produced by nodes during this run.
   * The agent automatically stores return values from node.run() here.
   * Nodes should read from this array to access previous node outputs.
   *
   * @example
   * const prev = ctx.nodeResults?.at(-1);
   * if (prev?.nodeId === "loadFile") {
   *   const rawText = prev.value as string;
   *   // ...
   * }
   */
  nodeResults?: NodeResult[];

  // Last node result captured for this run, if any
  lastNodeResult?: NodeResult;

  // Last error captured for this run, if any
  error?: unknown;
}
