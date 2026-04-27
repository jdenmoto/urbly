# CONTROL

## Dev mode switches
- ACTIVE_TASK: if present, swarm may work
- DEV_MODE: if present, swarm may keep looping
- COMPLETE: if present, swarm should stop

## Typical lifecycle
1. touch CONTROL/ACTIVE_TASK
2. touch CONTROL/DEV_MODE
3. start the swarm
4. when done, touch CONTROL/COMPLETE
