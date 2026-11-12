import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
const scriptURL = new URL('../scripts/verify-ios-candidate.sh', import.meta.url);
test('dedicated iOS workflow never enables Android or automatic publication', () => {
 const script=fs.readFileSync(scriptURL,'utf8');
 const yaml=fs.readFileSync(new URL('../codemagic.yaml',import.meta.url),'utf8');
 assert.match(yaml,/prism-ios-candidate:/);
 assert.match(yaml,/bash scripts\/verify-ios-candidate\.sh/);
 assert.doesNotMatch(script,/gradle|sdkmanager|assembleDebug|lintDebug|gh release|ssh|security import/);
 assert.match(script,/node tests\/feedback-ui\.cjs/);
 assert.match(script,/xcodebuild test/);
 assert.match(script,/verify_codemagic_ipa\.py/);
 assert.match(script,/git archive/);
 assert.doesNotMatch(yaml,/triggering:|publishing:/);
});
test('iOS pipeline fails closed on non-Mac hosts before creating artifacts', () => {
 assert.ok(fs.existsSync(scriptURL), 'pipeline script must exist');
 if(process.platform==='darwin')return;
 const cwd=fs.mkdtempSync(path.join(os.tmpdir(),'prism-ios-gate-'));
 try {
  const run=spawnSync('bash',[scriptURL.pathname],{cwd,env:{...process.env,CM_BUILD_DIR:cwd},encoding:'utf8'});
  assert.notEqual(run.status,0);
  assert.deepEqual(fs.readdirSync(cwd),[]);
 } finally {fs.rmdirSync(cwd);}
});

test('GitHub candidate workflow is manual iOS-only with private artifacts',()=>{
 const workflow=fs.readFileSync(new URL('../.github/workflows/build.yml',import.meta.url),'utf8');
 assert.doesNotMatch(workflow,/^\s+push:|android:|assembleDebug|lintDebug|gh release create/m);
 assert.match(workflow,/workflow_dispatch:/);
 assert.match(workflow,/contents: read/);
 assert.match(workflow,/bash scripts\/verify-ios-candidate\.sh/);
 assert.match(workflow,/actions\/upload-artifact@v4/);
});
