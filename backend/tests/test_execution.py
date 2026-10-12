import asyncio

from app.services.execution import ExecutionService


def test_execution_returns_stdout() -> None:
    result = asyncio.run(ExecutionService().run("print('hello')"))
    assert result["status"] == "success"
    assert result["stdout"] == "hello\n"


def test_execution_times_out() -> None:
    result = asyncio.run(ExecutionService().run("while True: pass"))
    assert result["status"] == "timeout"
