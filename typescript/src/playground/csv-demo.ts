import { csvToTextAgent } from "@/agent";
import { LoadFileNode, LogNode } from "@/nodes";

export default csvToTextAgent.add(LoadFileNode).add(LogNode);
