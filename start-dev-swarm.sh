#!/usr/bin/env bash
set -euo pipefail
source "/home/syalar/.openclaw/agent-team/shared-dev-runtime/env.sh"
touch "/home/syalar/.openclaw/workspace/urbly//CONTROL/ACTIVE_TASK"
touch "/home/syalar/.openclaw/workspace/urbly//CONTROL/DEV_MODE"
rm -f "/home/syalar/.openclaw/workspace/urbly//CONTROL/COMPLETE"
bash "/home/syalar/.openclaw/agent-team/shared-dev-runtime/scripts/start-dev-swarm.sh"
