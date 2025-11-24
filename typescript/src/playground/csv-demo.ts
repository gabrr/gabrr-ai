import { IAgentContext } from "@/agent";
import { BaseNode, INode, NodeResult } from "@/nodes";

class SwitchNode extends BaseNode {
  id = "switch";
  nodes: INode[] = [];

  switch(...nodes: INode[]) {
    this.nodes = nodes;
    return this;
  }

  async run(ctx: IAgentContext): Promise<NodeResult | void> {
    const originalNext = this.next;

    const useCSV = this.useCSV(ctx);

    const chosenHead = useCSV ? this.nodes[0] : this.nodes[1];

    let tail = chosenHead;

    while (tail.next) {
      tail = tail.next;
    }

    // Insert branch into chain:
    this.next = chosenHead;
    tail.next = originalNext;

    return { nodeId: this.id, value: useCSV ? "csv" : "pdf" };
  }

  private useCSV(ctx: IAgentContext): boolean {
    const previousResult = ctx.lastNodeResult?.value;
    const isString = typeof previousResult === "string";

    if (
      !isString ||
      !["csv", "pdf"].some((type) => previousResult.endsWith(type))
    ) {
      throw new Error("Invalid file type: " + previousResult);
    }

    return previousResult.endsWith(".csv");
  }
}

const switchNode = new SwitchNode();

export { switchNode };
