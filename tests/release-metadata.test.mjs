import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('iOS feedback candidate uses new metadata while Android remains paused', () => {
 const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
 const ios=fs.readFileSync('ios/project.yml','utf8');
 const android=fs.readFileSync('android/app/build.gradle','utf8');
 const pipeline=fs.readFileSync('scripts/verify-ios-candidate.sh','utf8');
 assert.equal(pkg.version,'1.1.3');
 assert.equal(ios.match(/MARKETING_VERSION: (\S+)/)[1],pkg.version);
 assert.equal(Number(ios.match(/CURRENT_PROJECT_VERSION: (\d+)/)[1]),6);
 assert.equal(android.match(/versionName '([^']+)'/)[1],'1.1.1');
 assert.equal(Number(android.match(/versionCode (\d+)/)[1]),4);
 assert.match(pipeline,/--version "\$VERSION" --build "\$BUILD"/);
 assert.match(ios,/PRODUCT_BUNDLE_IDENTIFIER: com\.prismpuzzle\.app/);
 assert.match(android,/applicationId 'com\.prismpuzzle\.app'/);
});
