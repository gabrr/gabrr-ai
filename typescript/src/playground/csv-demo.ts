import { csvToTextAgent, IAgentContext } from "@/agent";
import { BaseNode, INode, LoadFileNode, LogNode, NodeResult } from "@/nodes";

class SwitchNode extends BaseNode {
  constructor(public readonly csvHead: INode, public readonly pdfHead: INode) {
    super("switch");
  }

  async run(ctx: IAgentContext): Promise<NodeResult | void> {
    console.log("SwitchNode: ", ctx);

    const originalNext = this.next;

    const useCSV = this.useCSV(ctx);

    const chosenHead = useCSV ? this.csvHead : this.pdfHead;

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
    const previousResult = ctx.nodeResults?.at(-1)?.value;
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

class CsvToTextNode extends BaseNode {
  constructor() {
    super("csvToText");
  }
  async run(ctx: IAgentContext): Promise<NodeResult | void> {
    return { nodeId: this.id, value: "csv to text" };
  }
}

class PdfToTextNode extends BaseNode {
  constructor() {
    super("pdfToText");
  }
  async run(ctx: IAgentContext): Promise<NodeResult | void> {
    return { nodeId: this.id, value: "pdf to text" };
  }
}

const routeFileTypeNode = new SwitchNode(
  new CsvToTextNode(),
  new PdfToTextNode()
);

csvToTextAgent.add(LoadFileNode).add(routeFileTypeNode).add(LogNode);

export default csvToTextAgent;
