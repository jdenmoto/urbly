#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.local' });

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: false,
    ...options
  });

  return result;
}

function fail(message, extra = '') {
  console.error(`❌ ${message}`);
  if (extra) console.error(extra);
  process.exit(1);
}

function normalizeReferrer(input) {
  const raw = String(input || '').trim();
  if (!raw) return '';

  let normalized = raw;
  if (!/^https?:\/\//i.test(normalized)) {
    fail('La URL debe iniciar con http:// o https://');
  }

  if (!normalized.endsWith('/*')) {
    normalized = normalized.replace(/\/$/, '') + '/*';
  }

  return normalized;
}

const previewUrlArg = process.argv[2];
const previewReferrer = normalizeReferrer(previewUrlArg);
const projectId = process.env.GCP_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT;
const apiKeyId = process.env.GCP_API_KEY_ID || process.env.FIREBASE_BROWSER_KEY_ID;

if (!previewReferrer) {
  fail('Uso: npm run preview:allow-url -- https://urbly-2bae2--mi-canal.web.app');
}

if (!projectId) {
  fail('Falta projectId. Define GCP_PROJECT_ID o FIREBASE_PROJECT_ID en .env.local');
}

if (!apiKeyId) {
  fail('Falta API key ID. Define GCP_API_KEY_ID o FIREBASE_BROWSER_KEY_ID en .env.local');
}

const describe = run('gcloud', [
  'services',
  'api-keys',
  'describe',
  apiKeyId,
  `--project=${projectId}`,
  '--format=json'
]);

if (describe.status !== 0) {
  fail('No pude leer la API key con gcloud.', describe.stderr || describe.stdout);
}

let keyData;
try {
  keyData = JSON.parse(describe.stdout || '{}');
} catch (error) {
  fail('No pude parsear la respuesta JSON de gcloud describe.', String(error));
}

const existingReferrers = keyData?.restrictions?.browserKeyRestrictions?.allowedReferrers || [];
const existingApiTargets = keyData?.restrictions?.apiTargets || [];

const mergedReferrers = Array.from(new Set([...existingReferrers, previewReferrer]));

if (existingReferrers.includes(previewReferrer)) {
  console.log('✅ La URL ya estaba autorizada.');
  console.log(`Referrer: ${previewReferrer}`);
  process.exit(0);
}

const updateArgs = [
  'services',
  'api-keys',
  'update',
  apiKeyId,
  `--project=${projectId}`,
  `--allowed-referrers=${mergedReferrers.join(',')}`
];

for (const target of existingApiTargets) {
  if (target?.service) {
    updateArgs.push(`--api-target=service=${target.service}`);
  }
}

const update = run('gcloud', updateArgs);

if (update.status !== 0) {
  fail('No pude actualizar la API key.', update.stderr || update.stdout);
}

console.log('✅ Referrer agregado correctamente.');
console.log(`Project: ${projectId}`);
console.log(`API key ID: ${apiKeyId}`);
console.log(`Nuevo referrer: ${previewReferrer}`);
