#!/usr/bin/env node
/**
 * Renderiza um roteiro e gera uma folha de contato para revisão.
 *
 *   npm run render -- <id-do-roteiro>            -> saida/<id>.mp4 + saida/<id>-contato.jpg
 *   npm run render -- <id-do-roteiro> --rascunho -> metade da resolução, mais rápido
 *
 * Se REMOTION_CHROME não estiver definido e existir o Chromium da sessão na nuvem,
 * ele é usado automaticamente (o Remotion não consegue baixar o próprio navegador lá).
 */
import {spawnSync} from 'node:child_process';
import {existsSync, mkdirSync, readdirSync} from 'node:fs';

const args = process.argv.slice(2);
const id = args.find((a) => !a.startsWith('--'));
const rascunho = args.includes('--rascunho');

if (!id) {
  const ids = readdirSync('roteiros').filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''));
  console.error(`Uso: npm run render -- <id> [--rascunho]\nRoteiros: ${ids.join(', ')}`);
  process.exit(1);
}

const env = {...process.env};
if (!env.REMOTION_CHROME && existsSync('/opt/pw-browsers')) {
  const achado = readdirSync('/opt/pw-browsers')
    .filter((d) => d.startsWith('chromium_headless_shell-'))
    .map((d) => `/opt/pw-browsers/${d}/chrome-headless-shell-linux64/chrome-headless-shell`)
    .find((c) => existsSync(c));
  if (achado) env.REMOTION_CHROME = achado;
}

mkdirSync('saida', {recursive: true});
const sufixo = rascunho ? '-rascunho' : '';
const video = `saida/${id}${sufixo}.mp4`;

const remotion = spawnSync(
  'npx',
  [
    'remotion',
    'render',
    'src/index.ts',
    id,
    video,
    '--codec=h264',
    `--crf=${rascunho ? 28 : 20}`,
    ...(rascunho ? ['--scale=0.5'] : []),
    '--log=error',
  ],
  {stdio: 'inherit', env},
);
if (remotion.status !== 0) process.exit(remotion.status ?? 1);

// Folha de contato: 2 quadros por segundo, para revisar sem abrir o vídeo.
const contato = `saida/${id}${sufixo}-contato.jpg`;
const sonda = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', video], {encoding: 'utf8'});
const linhas = Math.max(1, Math.ceil((Number.parseFloat(sonda.stdout) || 20) * 2 / 8));
spawnSync(
  'ffmpeg',
  ['-loglevel', 'error', '-y', '-i', video, '-vf', `fps=2,scale=216:-1,tile=8x${linhas}:padding=6:color=white`, '-frames:v', '1', contato],
  {stdio: 'inherit'},
);
console.log(`\nPronto:\n  vídeo:   ${video}\n  contato: ${contato}`);
