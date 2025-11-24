Gabrr AI - Context Management System built with Nodes for AI Agents.

Syntax Example:

```typescript
class CsvToTextNode extends BaseNode {
  id = "csvToText";

  async run(ctx: IAgentContext): Promise<NodeResult | void> {
    return { nodeId: this.id, value: "csv to text" };
  }
}

class PdfToTextNode extends BaseNode {
  id = "pdfToText";

  async run(ctx: IAgentContext): Promise<NodeResult | void> {
    return { nodeId: this.id, value: "pdf to text" };
  }
}

const agent = new Agent({ instructions: { system: "You are a file parser." } });

agent
  .add(LoadFileNode)
  .add(SwitchNode.switch(new CsvToTextNode(), new PdfToTextNode()))
  .error(ErrorNode)
  .add(LogNode);

agent.run({ instructions: { system: "You are a CSV to text converter." } });
```