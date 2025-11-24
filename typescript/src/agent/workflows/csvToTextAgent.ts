import { Agent } from "@/agent";

const csvToTextAgent = new Agent("csvToTextAgent", {
  instructions: {
    system: "You are a CSV to text converter.",
  },
});

export default csvToTextAgent;
