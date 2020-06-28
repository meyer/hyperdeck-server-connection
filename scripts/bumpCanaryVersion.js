const child_process = require('child_process');
const util = require('util');
const path = require('path');
const semver = require('semver');
const fs = require('fs');
const pkgJson = require('../package.json');

const execAsync = util.promisify(child_process.exec);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const getStdout = (command) =>
  execAsync(command, { cwd: PROJECT_ROOT }).then((r) => r.stdout.trim());

(async () => {
  const latestTag = await getStdout('git describe --abbrev=0');
  const commitOffsetCount = await getStdout(`git rev-list ${latestTag}..HEAD --count`);
  const parsedVersion = semver.parse(pkgJson.version);
  const currentGitHash = await getStdout('git rev-parse --short HEAD');

  if (!parsedVersion) {
    throw new Error('`' + latestTag + '` is not valid semver');
  }

  parsedVersion.inc('prepatch');
  parsedVersion.prerelease = ['canary', commitOffsetCount, currentGitHash];
  const newVersion = parsedVersion.format();

  console.log({ commitOffsetCount, currentGitHash, newVersion });

  const updatedPkgJson = Object.assign({}, pkgJson, { version: newVersion });

  await fs.promises.writeFile(
    path.join(PROJECT_ROOT, 'package.json'),
    JSON.stringify(updatedPkgJson, null, '\t'),
    'utf-8'
  );
})();
