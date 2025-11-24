import { AgentContext } from "@/agent";
import { BaseNode } from "@/nodes";

class LoadFileNode extends BaseNode {
  constructor() {
    super("loadFile");
  }

  async run(ctx: AgentContext): Promise<void> {
    ctx.nodeResults ??= [];
    const raw = ctx.user?.request;
    ctx.nodeResults.push({ nodeId: this.id, value: raw ?? "" });
    console.log(ctx);
  }
}

export default new LoadFileNode();
