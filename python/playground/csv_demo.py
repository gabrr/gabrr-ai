from __future__ import annotations

import csv
from pathlib import Path
from typing import Optional

from agentic.agent.core.agent import Agent
from agentic.agent.core.context import AgentContext
from agentic.nodes.catalogue import error_node, log_node
from agentic.nodes.core.node import BaseNode, NodeResult


class LoadFileNode(BaseNode):
    id = "loadFile"

    async def run(self, ctx: AgentContext) -> Optional[NodeResult]:
        user = ctx.user or {}
        path_str = user.get("file_path")
        if not path_str:
            raise FileNotFoundError("file_path missing in ctx.user")

        path = Path(path_str)
        if not path.exists():
            raise FileNotFoundError(f"{path} does not exist")

        text = path.read_text(encoding="utf-8")
        return NodeResult(node_id=self.id, value=text)


class CsvToTextNode(BaseNode):
    id = "csvToText"

    async def run(self, ctx: AgentContext) -> Optional[NodeResult]:
        previous = ctx.node_results[-1] if ctx.node_results else None
        raw_text = previous.value if previous else ""

        reader = csv.reader(raw_text.splitlines())
        rows = [", ".join(row) for row in reader]
        return NodeResult(node_id=self.id, value="\n".join(rows))


async def run_csv_demo(csv_path: str) -> AgentContext:
    """Wire a simple chain: load CSV -> convert to text -> log."""
    context = AgentContext(instructions={"system": "You are a file parser."})
    agent = Agent(context)

    load_node = LoadFileNode()
    csv_node = CsvToTextNode()

    agent.add(load_node).add(csv_node).error(error_node).add(log_node)

    return await agent.run(
        {
            "user": {"file_path": csv_path},
            "instructions": {"system": "You are a CSV to text converter."},
        }
    )

    
