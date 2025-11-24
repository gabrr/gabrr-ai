import { IAgentContext } from "@/agent";
import { BaseNode, NodeResult } from "@/nodes";

class LoadFileNode extends BaseNode {
  id = "loadFile";

  async run(ctx: IAgentContext): Promise<NodeResult | void> {
    return { nodeId: this.id, value: "filename.csv" };
  }
}

export default new LoadFileNode();
