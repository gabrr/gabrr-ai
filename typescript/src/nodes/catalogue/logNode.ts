import { AgentContext } from "@/agent";
import { BaseNode } from "@/nodes";

class LogNode extends BaseNode {
  constructor() {
    super("logNode");
  }

  async run(ctx: AgentContext): Promise<void> {
    console.log(ctx.nodeResults);
  }
}

export default new LogNode();
