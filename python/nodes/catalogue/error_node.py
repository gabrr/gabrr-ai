from __future__ import annotations

import sys
from typing import Optional

from agentic.agent.core.context import AgentContext
from agentic.nodes.core.node import BaseNode, NodeResult


class ErrorNode(BaseNode):
    id = "error"

    async def run(self, ctx: AgentContext) -> Optional[NodeResult]:
        print(ctx.error, file=sys.stderr)
        return None


error_node = ErrorNode()
