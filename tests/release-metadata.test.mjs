import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('save-protection update has consistent metadata newer than published 1.1.0 build 3', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const ios = fs.readFileSync('ios/project.yml', 'utf8');
  const android = fs.readFileSync('android/app/build.gradle', 'utf8');
  const pipeline = fs.readFileSync('scripts/codemagic-build.sh', 'utf8');
  assert.match(pkg.version, /^1\.1\.[1-9][0-9]*$/);
  assert.equal(ios.match(/MARKETING_VERSION: (\S+)/)[1], pkg.version);
  assert.equal(android.match(/versionName '([^']+)'/)[1], pkg.version);
  const build = Number(ios.match(/CURRENT_PROJECT_VERSION: (\d+)/)[1]);
  assert.ok(build > 3, 'must not replace the already released build 3');
  assert.equal(Number(android.match(/versionCode (\d+)/)[1]), build);
  assert.ok(pipeline.includes(`--version ${pkg.version} --build ${build} `));
  assert.match(ios, /PRODUCT_BUNDLE_IDENTIFIER: com\.prismpuzzle\.app/);
  assert.match(android, /applicationId 'com\.prismpuzzle\.app'/);
});
