#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

function run(command, args) {
  return spawnSync(command, args, { encoding: 'utf8' });
}

function getChangedFiles() {
  const eventName = process.env.GITHUB_EVENT_NAME;
  const baseSha = process.env.GITHUB_BASE_SHA;
  const beforeSha = process.env.GITHUB_BEFORE;
  const headSha = process.env.GITHUB_SHA;

  let diffRange = '';

  if (eventName === 'pull_request' && baseSha && headSha) {
    diffRange = `${baseSha}...${headSha}`;
  } else if (beforeSha && headSha && beforeSha !== '0000000000000000000000000000000000000000') {
    diffRange = `${beforeSha}...${headSha}`;
  }

  const args = diffRange ? ['diff', '--name-only', diffRange] : ['diff', '--name-only', 'HEAD~1...HEAD'];
  let res = run('git', args);

  if (res.status !== 0) {
    const fallback = run('git', ['show', '--name-only', '--pretty=', 'HEAD']);
    if (fallback.status !== 0) {
      console.error(res.stderr || 'No se pudieron obtener archivos cambiados para lint.');
      process.exit(res.status ?? 1);
    }
    res = fallback;
  }

  return (res.stdout || '')
    .split('\n')
    .map((f) => f.trim())
    .filter(Boolean)
    .filter((f) => /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(f))
    .filter((f) => !f.startsWith('dist/'))
    .filter((f) => !f.startsWith('functions/lib/'));
}

const changedFiles = getChangedFiles();

if (changedFiles.length === 0) {
  console.log('✅ lint:ci sin archivos JS/TS cambiados.');
  process.exit(0);
}

console.log(`🔎 lint:ci sobre ${changedFiles.length} archivo(s) cambiados...`);
const lint = spawnSync('npx', ['eslint', ...changedFiles], { stdio: 'inherit', shell: false });
process.exit(lint.status ?? 1);
