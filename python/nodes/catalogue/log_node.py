from __future__ import annotations

from typing import Optional

from agentic.agent.core.context import AgentContext
from agentic.nodes.core.node import BaseNode, NodeResult


class LogNode(BaseNode):
    id = "logNode"

    async def run(self, ctx: AgentContext) -> Optional[NodeResult]:
        previous_result = ctx.node_results[-1] if ctx.node_results else None
        return NodeResult(
            node_id=self.id,
            value=f"logged: {previous_result.value if previous_result else None}",
        )


log_node = LogNode()
