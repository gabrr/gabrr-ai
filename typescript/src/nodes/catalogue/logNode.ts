import { IAgentContext } from "@/agent";
import { BaseNode, NodeResult } from "@/nodes";

class LogNode extends BaseNode {
  constructor() {
    super("logNode");
  }

  async run(ctx: IAgentContext): Promise<NodeResult | void> {
    const previousResult = ctx.nodeResults?.at(-1);
    return { nodeId: this.id, value: `logged: ${previousResult?.value}` };
  }
}

export default new LogNode();
