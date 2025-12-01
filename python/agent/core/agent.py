from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any, Dict, Optional

from agentic.agent.core.context import AgentContext
from agentic.nodes.core.node import INode, NodeResult


@dataclass
class AgentConfig:
    mode: Optional[str] = None  # "single-run" | "interactive"
    max_nodes: Optional[int] = None
    max_duration_ms: Optional[int] = None


class BaseAgent:
    def __init__(self, initial_context: AgentContext):
        self.context = initial_context
        self.root: Optional[INode] = None
        self.last_node: Optional[INode] = None
        self.global_error_handler: Optional[INode] = None
        self.config: AgentConfig = AgentConfig()
        self.last_node_result: Optional[NodeResult] = None

    def options(self, opts: Dict[str, Any]) -> "BaseAgent":
        """Configure execution behaviour."""
        for key, value in opts.items():
            if hasattr(self.config, key):
                setattr(self.config, key, value)
            else:
                self.config.__dict__[key] = value
        return self

    def with_context(self, patch: Dict[str, Any]) -> "BaseAgent":
        """Apply a patch to the current context."""
        self.context.merge(patch)
        return self

    def add(self, node: INode) -> INode:
        """Append a node to the chain, returning the node for chaining."""
        if self.root is None:
            self.root = node
            self.last_node = node
        else:
            assert self.last_node is not None
            self.last_node.next = node
            self.last_node = node
        return node

    def error(self, handler: INode) -> "BaseAgent":
        """Set a global error handler for nodes without a local handler."""
        self.global_error_handler = handler
        return self

    async def run(self, initial: Optional[Dict[str, Any]] = None) -> AgentContext:  # pragma: no cover - implemented in subclass
        raise NotImplementedError


class Agent(BaseAgent):
    def __init__(self, initial_context: AgentContext):
        super().__init__(initial_context)

    async def run(self, initial: Optional[Dict[str, Any]] = None) -> AgentContext:
        if initial:
            self.with_context(initial)

        if self.root is None:
            raise RuntimeError("Agent has no nodes configured")

        current = self.root
        steps = 0
        start = time.perf_counter()

        while current:
            if self.context.workflow is not None:
                self.context.workflow["current_node_id"] = current.id

            steps += 1

            if self.config.max_nodes is not None and steps > self.config.max_nodes:
                self.context.error = RuntimeError("Max nodes exceeded")
                break

            elapsed_ms = (time.perf_counter() - start) * 1000
            if self.config.max_duration_ms is not None and elapsed_ms > self.config.max_duration_ms:
                self.context.error = RuntimeError("Max duration exceeded")
                break

            try:
                result = await current.run(self.context)
                if result:
                    self.context.node_results.append(result)
                    self.context.last_node_result = result

                if isinstance(self.context.telemetry, dict):
                    events = self.context.telemetry.setdefault("events", [])
                    events.append(
                        {"node_id": current.id, "at": time.time(), "status": "ok"}
                    )

                current = current.next
            except Exception as err:
                if isinstance(self.context.telemetry, dict):
                    events = self.context.telemetry.setdefault("events", [])
                    events.append(
                        {"node_id": current.id, "at": time.time(), "status": "error"}
                    )

                self.context.error = err
                current = current.error_handler or self.global_error_handler

        print("Run completed. Final context:", self.context)
        return self.context
