import { BaseNode, NodeResult } from "@/nodes";
import { IAgentContext } from "@/agent";

class ErrorNode extends BaseNode {
  id = "error";

  async run(ctx: IAgentContext): Promise<NodeResult | void> {
    console.error(ctx.error);
  }
}

export default new ErrorNode();
