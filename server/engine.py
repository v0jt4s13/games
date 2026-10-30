"""Bridge to the Node.js engines (geopolitics/server/runner.mjs): one process per call."""
import json
import subprocess

from . import config


class EngineUnavailable(Exception):
    """Node.js or the runner is missing - a server problem, not the player's."""


class EngineError(Exception):
    """The engine rejected the move; the message is meant for the player."""


def run(request):
    node = config.node_bin()
    if not node or not config.RUNNER.is_file():
        raise EngineUnavailable("Silnik gier jest niedostępny na serwerze (brak Node.js).")
    try:
        done = subprocess.run([node, str(config.RUNNER)], input=json.dumps(request), capture_output=True,
                              text=True, timeout=20, check=False)
        answer = json.loads(done.stdout)
    except (OSError, subprocess.TimeoutExpired, ValueError) as error:
        raise EngineUnavailable(f"Silnik gier nie odpowiada: {error}") from error
    if done.returncode != 0:
        raise EngineUnavailable("Silnik gier zakończył się błędem.")
    if "error" in answer:
        raise EngineError(answer["error"])
    return answer


def version():
    node = config.node_bin()
    if not node:
        return None
    try:
        return subprocess.run([node, "--version"], capture_output=True, text=True, timeout=5).stdout.strip() or None
    except (OSError, subprocess.TimeoutExpired):
        return None
