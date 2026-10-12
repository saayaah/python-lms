import asyncio
import sys
import time


class ExecutionService:
    """Development adapter; production must replace this with a sandbox worker."""

    async def run(self, code: str) -> dict[str, object]:
        started = time.perf_counter()
        try:
            process = await asyncio.create_subprocess_exec(
                sys.executable,
                "-I",
                "-c",
                code,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=3)
            return {
                "status": "success" if process.returncode == 0 else "failed",
                "stdout": stdout.decode(errors="replace").replace("\r\n", "\n")[:10_000],
                "stderr": stderr.decode(errors="replace").replace("\r\n", "\n")[:10_000],
                "execution_time_ms": round((time.perf_counter() - started) * 1000),
            }
        except TimeoutError:
            process.kill()
            await process.communicate()
            return {
                "status": "timeout",
                "stdout": "",
                "stderr": "Execution timed out",
                "execution_time_ms": 3000,
            }
