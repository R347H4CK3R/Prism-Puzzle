const {chromium, webkit} = require('playwright');
const assert = require('node:assert/strict');
(async () => {
 for (const [name,engine] of [['chromium',chromium],['webkit',webkit]]) {
  const browser=await engine.launch({headless:true});
  try {
   const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
   const external=[];page.on('request',request=>{if(!request.url().startsWith('http://127.0.0.1:8080/'))external.push(request.url());});
   await page.goto('http://127.0.0.1:8080/');
   await page.getByText('Suggest an improvement',{exact:true}).click();
   await page.getByLabel('Suggestion title',{exact:true}).fill('Offline guide');
   await page.getByLabel('Suggestion details',{exact:true}).fill('<script>not executable</script> Explain the controls.');
   const before=await page.evaluate(()=>localStorage.getItem('prism-v1'));
   await page.getByRole('button',{name:'Prepare local draft',exact:true}).click();
   const copy=page.getByRole('button',{name:'Select draft for copying',exact:true});
   assert.equal(await copy.isEnabled(),false);
   const preview=page.getByLabel('Prepared suggestion',{exact:true});
   assert.match(await preview.inputValue(),/<script>not executable<\/script>/);
   await page.getByRole('checkbox').check();await copy.click();
   const selection=await preview.evaluate(el=>({start:el.selectionStart,end:el.selectionEnd,length:el.value.length}));
   assert.deepEqual(selection,{start:0,end:selection.length,length:selection.length});
   assert.match(await page.locator('[data-feedback-status]').textContent(),/Nothing has been uploaded/);
   assert.equal(await page.evaluate(()=>localStorage.getItem('prism-v1')),before);
   assert.deepEqual(external,[]);
   await page.getByLabel('Suggestion details',{exact:true}).fill('Updated suggestion');
   assert.equal(await page.locator('input[name="reviewed"]').isChecked(),false);
   assert.equal(await page.locator('[data-feedback-result]').isVisible(),false);
   await page.getByRole('button',{name:'Prepare local draft',exact:true}).click();
   assert.equal(await copy.isEnabled(),false);
   assert.match(await preview.inputValue(),/Updated suggestion/);
   await page.getByRole('checkbox').check();await copy.click();
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   assert.equal(await page.getByLabel('Private repository issue address',{exact:true}).inputValue(),'https://github.com/R347H4CK3R/Prism-Puzzle/issues/new');
   await page.screenshot({path:`docs/${name}-feedback-qa.png`,fullPage:true});
   console.log(`${name}: local feedback, selection, revocation, privacy, save preservation and 390px layout passed`);
  } finally {await browser.close();}
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
