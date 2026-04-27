#!/usr/bin/env bash
set -euo pipefail
source "/home/syalar/.openclaw/agent-team/shared-dev-runtime/env.sh"
touch "/home/syalar/.openclaw/workspace/urbly//CONTROL/COMPLETE"
rm -f "/home/syalar/.openclaw/workspace/urbly//CONTROL/ACTIVE_TASK" "/home/syalar/.openclaw/workspace/urbly//CONTROL/DEV_MODE"
bash "/home/syalar/.openclaw/agent-team/shared-dev-runtime/scripts/stop-dev-swarm.sh"
