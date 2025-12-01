from agentic.agent.core.agent import Agent
from agentic.agent.core.context import AgentContext

# Example agent pre-wired with a minimal context
agent = Agent(AgentContext(instructions={"system": "example"}))
