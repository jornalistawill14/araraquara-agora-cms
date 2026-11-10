import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);

// Em ambientes sem download de navegador (ex.: sessão na nuvem), aponte para um Chrome local:
// REMOTION_CHROME=/caminho/chrome-headless-shell npm run render -- <id>
if (process.env.REMOTION_CHROME) {
  Config.setBrowserExecutable(process.env.REMOTION_CHROME);
}
