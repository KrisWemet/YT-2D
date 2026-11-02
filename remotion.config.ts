import fs from 'node:fs';
import {Config} from '@remotion/cli/config';

// In the Claude Code cloud container, use its preinstalled Chromium headless shell.
// Anywhere else this file doesn't exist and Remotion downloads its own browser.
const CONTAINER_CHROME = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
if (fs.existsSync(CONTAINER_CHROME)) {
  Config.setBrowserExecutable(CONTAINER_CHROME);
}
Config.setVideoImageFormat('png');
Config.setOverwriteOutput(true);
