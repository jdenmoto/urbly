#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.local' });

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    shell: false,
    ...options
  });

  return result;
}

function mustRun(command, args, options = {}) {
  const result = run(command, args, options);
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
  return result;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

function getGitBranch() {
  const res = run('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
  if (res.status !== 0) return '';
  return (res.stdout || '').trim();
}

function getFeatureBranchOrFail() {
  const branch = getGitBranch();
  if (!branch) {
    console.error('❌ No pude detectar la rama actual.');
    process.exit(1);
  }

  if (!branch.startsWith('feature/')) {
    console.error(`❌ Rama actual: ${branch}`);
    console.error('Este script solo permite deploy preview desde ramas feature/*');
    process.exit(1);
  }

  return branch;
}

function normalizePreviewReferrer(url) {
  if (!url) return '';
  return url.replace(/\/$/, '') + '/*';
}

function extractChannelUrl(output) {
  const text = output || '';
  const matches = text.match(/https:\/\/[\w.-]+--[\w-]+\.web\.app/gi);
  if (!matches?.length) return '';
  return matches[matches.length - 1];
}

function autoAllowReferrerIfConfigured(previewUrl, projectId) {
  const apiKeyId = process.env.GCP_API_KEY_ID || process.env.FIREBASE_BROWSER_KEY_ID;
  const targetProject = process.env.GCP_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT || projectId;

  if (!previewUrl) {
    console.log('⚠️ No pude detectar la URL preview para autorizar referrer automáticamente.');
    return;
  }

  if (!apiKeyId || !targetProject) {
    console.log('ℹ️ Omitiendo auto-whitelist de referrer (faltan FIREBASE_BROWSER_KEY_ID/GCP_API_KEY_ID o projectId).');
    return;
  }

  const describe = run('gcloud', [
    'services',
    'api-keys',
    'describe',
    apiKeyId,
    `--project=${targetProject}`,
    '--format=json'
  ]);

  if (describe.status !== 0) {
    console.log('⚠️ No pude leer API key con gcloud. Se omite auto-whitelist.');
    return;
  }

  let keyData;
  try {
    keyData = JSON.parse(describe.stdout || '{}');
  } catch {
    console.log('⚠️ No pude parsear respuesta de gcloud describe. Se omite auto-whitelist.');
    return;
  }

  const wantedReferrer = normalizePreviewReferrer(previewUrl);
  const existingReferrers = keyData?.restrictions?.browserKeyRestrictions?.allowedReferrers || [];
  const existingApiTargets = keyData?.restrictions?.apiTargets || [];

  if (existingReferrers.includes(wantedReferrer)) {
    console.log(`✅ Referrer ya autorizado: ${wantedReferrer}`);
    return;
  }

  const mergedReferrers = Array.from(new Set([...existingReferrers, wantedReferrer]));

  const updateArgs = [
    'services',
    'api-keys',
    'update',
    apiKeyId,
    `--project=${targetProject}`,
    `--allowed-referrers=${mergedReferrers.join(',')}`
  ];

  for (const target of existingApiTargets) {
    if (target?.service) {
      updateArgs.push(`--api-target=service=${target.service}`);
    }
  }

  const update = run('gcloud', updateArgs);
  if (update.stdout) process.stdout.write(update.stdout);
  if (update.stderr) process.stderr.write(update.stderr);

  if (update.status === 0) {
    console.log(`✅ Referrer agregado automáticamente: ${wantedReferrer}`);
  } else {
    console.log('⚠️ Falló auto-whitelist de referrer. Puedes hacerlo manual con preview:allow-url.');
  }
}

const featureBranch = getFeatureBranchOrFail();
const inputChannel = process.argv[2] || process.env.FIREBASE_PREVIEW_CHANNEL || featureBranch;
const channelId = slugify(inputChannel) || 'preview';
const expires = process.env.FIREBASE_PREVIEW_EXPIRES || '7d';
const project = process.env.FIREBASE_PROJECT || process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID;

console.log(`\n🚀 Deploying preview channel: ${channelId}`);
console.log(`🌿 Branch: ${featureBranch}`);
console.log(`⏳ Expires in: ${expires}`);
if (project) console.log(`📦 Project: ${project}`);

mustRun('npm', ['run', 'build'], { stdio: 'inherit' });

const firebaseArgs = ['-y', 'firebase-tools', 'hosting:channel:deploy', channelId, '--expires', expires];
if (project) firebaseArgs.push('--project', project);

const deploy = mustRun('npx', firebaseArgs, { stdio: 'pipe' });

const combinedOutput = `${deploy.stdout || ''}\n${deploy.stderr || ''}`;
const previewUrl = extractChannelUrl(combinedOutput);
if (previewUrl) {
  console.log(`\n🔗 Preview URL: ${previewUrl}`);
}

autoAllowReferrerIfConfigured(previewUrl, project);
