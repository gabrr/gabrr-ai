import { IAgentContext } from "@/agent";
import { BaseNode } from "@/nodes";

class LogNode extends BaseNode {
  constructor() {
    super("logNode");
  }

  async run(ctx: IAgentContext): Promise<void> {
    console.log("LogNode: ", ctx);
  }
}

export default new LogNode();
