from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from agentic.nodes.core.node import NodeResult


@dataclass
class AgentContext:
    """Shared context passed through agent runs and nodes."""

    user: Optional[Dict[str, Any]] = None
    instructions: Dict[str, Any] = field(default_factory=dict)
    memory: Optional[Dict[str, Any]] = None
    workflow: Optional[Dict[str, Any]] = None
    tools: Optional[Dict[str, Any]] = None
    telemetry: Optional[Dict[str, Any]] = None
    node_results: List["NodeResult"] = field(default_factory=list)
    last_node_result: Optional["NodeResult"] = None
    error: Any = None

    def merge(self, patch: Dict[str, Any]) -> None:
        """Shallow-merge a dictionary of values into the context."""
        for key, value in patch.items():
            setattr(self, key, value)
