import { IAgentContext } from "@/agent";
import { BaseNode, NodeResult } from "@/nodes";

class LogNode extends BaseNode {
  id = "logNode";

  async run(ctx: IAgentContext): Promise<NodeResult | void> {
    const previousResult = ctx.nodeResults?.at(-1);
    return {
      nodeId: this.id,
      value: `logged: ${JSON.stringify(previousResult?.value)}`,
    };
  }
}

export default new LogNode();
