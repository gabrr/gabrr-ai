import { IAgentContext } from "@/agent";
import { BaseNode } from "@/nodes";

class LoadFileNode extends BaseNode {
  constructor() {
    super("loadFile");
  }

  async run(ctx: IAgentContext): Promise<void> {
    console.log("LoadFileNode: ", ctx);
  }
}

export default new LoadFileNode();
