const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
   await page.goto('http://127.0.0.1:8080/');
   await page.locator('#stage').scrollIntoViewIfNeeded();
   assert.equal(await page.locator('.cubelet-face').count(),54);
   await page.screenshot({path:`cm-output/diagnostics/${name}-cube-onscreen.png`});
   await page.getByText('Suggest an improvement',{exact:true}).click();
   await page.getByLabel('Suggestion title',{exact:true}).fill('Visual diagnostic');
   await page.getByLabel('Suggestion details',{exact:true}).fill('Fictional local-only test.');
   await page.getByRole('button',{name:'Prepare local draft',exact:true}).click();
   await page.getByRole('checkbox').check();
   await page.getByRole('button',{name:'Select draft for copying',exact:true}).click();
   await page.screenshot({path:`cm-output/diagnostics/${name}-cube-offscreen-fullpage.png`,fullPage:true});
   await page.locator('#stage').scrollIntoViewIfNeeded();
   await page.screenshot({path:`cm-output/diagnostics/${name}-cube-onscreen-after-feedback.png`});
   console.log(`${name}: screenshots captured for visual inspection; no automatic visual-pass claim`);
  }finally{await browser.close();}
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
