from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Dict, Optional, Protocol, TYPE_CHECKING

if TYPE_CHECKING:
    from agentic.agent.core.context import AgentContext


@dataclass
class NodeResult:
    node_id: str
    value: Any


class INode(Protocol):
    id: str
    next: Optional["INode"]
    error_handler: Optional["INode"]

    def add(self, node: "INode") -> "INode":
        ...

    def error(self, handler: "INode") -> "INode":
        ...

    def try_(self, node: "INode") -> "INode":
        ...

    def options(self, opts: Dict[str, Any]) -> "INode":
        ...

    async def run(self, ctx: "AgentContext") -> Optional[NodeResult]:
        ...


class BaseNode(ABC):
    id: str
    next: Optional[INode] = None
    error_handler: Optional[INode] = None

    def __init__(self) -> None:
        self._options: Dict[str, Any] = {}

    def add(self, node: INode) -> INode:
        self.next = node
        return node

    def error(self, handler: INode) -> "BaseNode":
        """Attach a local error handler; return self so the main chain can continue."""
        self.error_handler = handler
        return self

    def try_(self, node: INode) -> INode:
        self.error_handler = node
        return node

    def options(self, opts: Dict[str, Any]) -> "BaseNode":
        self._options = {**self._options, **opts}
        return self

    @abstractmethod
    async def run(self, ctx: "AgentContext") -> Optional[NodeResult]:
        ...
