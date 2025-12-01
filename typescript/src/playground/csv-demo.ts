import { Agent } from "@/agent";
import loadPDF from "./nodes/loadPDF";
import { logNode } from "@/nodes";

const agent = new Agent({
  instructions: {
    system: "You help transform pdf transaction files into JSON",
  },
});

agent.add(loadPDF).add(logNode);

export default agent;
