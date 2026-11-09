const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const playwright=require(process.env.PLAYWRIGHT_PATH||'playwright');
const name=process.argv[2]||'chromium';
(async()=>{
 const browser=await playwright[name].launch({headless:true,...(name==='chromium'&&process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('prism-v1',JSON.stringify({cube:[],lights:[],slide:[],counts:{cube:0,lights:0,slide:0}})));
 await page.goto('http://127.0.0.1:8080');
 await page.locator('#stage').scrollIntoViewIfNeeded();
 const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('prism-v1')));
 const point=async()=>{const box=await page.locator('.cubelet-face[data-face="F"][data-position="0,0,1"]').boundingBox();assert.ok(box);return{x:box.x+box.width/2,y:box.y+box.height/2,face:'F'};};
 const p=await point();await page.touchscreen.tap(p.x,p.y);assert.equal((await state()).counts.cube,0,'tap must not turn cube');
 const cdp=name==='chromium'?await context.newCDPSession(page):null;
 async function swipe(start,dx){if(cdp){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:start.x,y:start.y,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.x+dx,y:start.y,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}else{await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(start.x+dx,start.y,{steps:4});await page.mouse.up();}await page.waitForFunction(()=>document.body.dataset.busy!=="true");}
 await swipe(p,50);assert.deepEqual((await state()).cube,[['F',1]],'right swipe turns hit-tested front face clockwise');
 await swipe(await point(),-50);assert.deepEqual((await state()).cube,[],'opposite swipe restores state');
 const stage=await page.locator('#stage').boundingBox(),before=await page.locator('#cube').getAttribute('style');await swipe({x:stage.x+5,y:stage.y+stage.height/2},30);assert.notEqual(await page.locator('#cube').getAttribute('style'),before,'background swipe orbits');assert.equal((await state()).counts.cube,2,'orbit does not turn layers');
 if(cdp){const q=await point(),first={x:q.x,y:q.y,id:1},second={x:stage.x+10,y:stage.y+10,id:2};await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[first]});await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[first,second]});assert.equal((await state()).counts.cube,2,'second finger must not mutate cube');await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...first,x:first.x+50},second]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForFunction(()=>document.body.dataset.busy!=='true');assert.deepEqual((await state()).cube,[['F',1]],'first finger retains gesture');const r=await point();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x,y:r.y,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});assert.equal((await state()).counts.cube,3,'cancel never makes a move');}
 for(const game of ['lights','slide','pocket','slide15','hanoi','bricks']){await page.locator(`[data-game=${game}]`).click();assert.equal(await page.locator('#turns').isVisible(),game==='pocket');await page.locator('#shuffle').click();for(let i=0;i<100 && !(await page.locator('#title').innerText()).includes('Beautifully');i++)await page.locator('#hint').click();await page.waitForFunction(()=>document.body.dataset.busy!=='true');assert.match(await page.locator('#title').innerText(),/Beautifully/);const solved=JSON.stringify(await state());for(let i=0;i<10;i++)await page.locator('#hint').click();assert.equal(JSON.stringify(await state()),solved,'repeated hints preserve solved state');}
 await page.locator('[data-game=cube]').click();await page.locator('#hint').click();await page.waitForFunction(()=>document.body.dataset.busy!=='true');assert.match(await page.locator('#title').innerText(),/Beautifully/);
 await context.setOffline(true);await page.goto(pathToFileURL(path.resolve('web/index.html')).href);assert.equal(await page.locator('.sticker').count(),54);await page.locator('#shuffle').click();await page.locator('#hint').click();assert.equal(errors.length,0,errors.join('\n'));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.screenshot({path:`docs/${name}-touch-qa.png`,fullPage:true});await browser.close();console.log(`PASS ${name}: trusted gestures, orbit, active-pointer ownership where supported, repeated unlimited hints, hidden controls, offline local-file cold load`);
})().catch(e=>{console.error(e);process.exit(1)});
