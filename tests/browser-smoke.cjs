const {chromium}=require('@playwright/test');
const fs=require('node:fs');const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const output=process.env.SMOKE_OUTPUT || path.resolve('../runtime/screenshots');fs.mkdirSync(output,{recursive:true});
 let errors=[];let checked=0;
 async function open(page,url){const response=await page.goto(url,{waitUntil:'networkidle'});if(response.status()!==200)throw Error(`${url}: ${response.status()}`);await page.locator('#app > :not(script)').first().waitFor();if((await page.locator('body').innerText()).trim().length<30)throw Error('Empty rendered page '+url);checked++;console.log('OK '+new URL(url).pathname);}
 try{
  for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
   const page=await browser.newPage({viewport,reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(String(e)));
   await open(page,'https://176.118.222.21/');
   await page.screenshot({path:path.join(output,`landing-${viewport.width}.png`)});
   await open(page,'https://176.118.222.21/login');await page.screenshot({path:path.join(output,`login-${viewport.width}.png`)});
   await page.close();
  }
  const publicPage=await browser.newPage({viewport:{width:1440,height:1000}});
  publicPage.on('pageerror',e=>errors.push(String(e)));
  await open(publicPage,'https://176.118.222.21/');
  await publicPage.screenshot({path:path.join(output,'landing-animated.png')});
  for(const route of ['/register','/services','/how-it-works','/for-business','/security','/requirements','/pricing','/help','/styleguide']) await open(publicPage,'https://176.118.222.21'+route);
  await publicPage.close();
  const fixtures=JSON.parse(fs.readFileSync(process.env.SMOKE_FIXTURES,'utf8'));
  const base='http://127.0.0.1:3108';
  for(const [role,urls] of Object.entries({
   CUSTOMER:['/app/customer','/app/customer/objects','/app/customer/objects/'+fixtures.facilityId,'/app/customer/requests','/app/customer/requests/new','/app/customer/requests/'+fixtures.requestId,'/app/customer/orders','/app/customer/orders/'+fixtures.orderId,'/app/customer/messages','/app/customer/payments','/app/customer/settings'],
   CONTRACTOR:['/app/contractor','/app/contractor/company','/app/contractor/requests','/app/contractor/requests/'+fixtures.requestId,'/app/contractor/offers','/app/contractor/orders','/app/contractor/orders/'+fixtures.orderId,'/app/contractor/calendar','/app/contractor/finance','/app/contractor/team','/app/contractor/reviews','/app/contractor/settings'],
   ADMIN:['/admin','/admin/users','/admin/companies','/admin/requests','/admin/orders','/admin/payments','/admin/audit','/admin/control','/admin/dictionaries','/admin/services','/admin/settings'],
  })){
   const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();page.on('pageerror',e=>errors.push(`${role}: ${e}`));
   await open(page,base+'/login');await page.getByLabel('Электронная почта').fill('browser-'+role.toLowerCase()+'@example.invalid');await page.getByLabel('Пароль',{exact:true}).fill(fixtures.password);
   await page.getByRole('button',{name:'Войти',exact:true}).click();await page.waitForURL(url=>!url.pathname.includes('login'));
   for(const url of urls)await open(page,base+url);
   if(role==='CUSTOMER') {
    const saved=page.waitForResponse(r=>r.url().endsWith('/actions/profile') && r.request().method()==='POST');
    await page.getByRole('button',{name:'Сохранить',exact:true}).click();
    const response=await saved;
    if(!response.ok() || !(await response.json()).ok)throw Error('Profile save failed');
   }
   await page.screenshot({path:path.join(output,role.toLowerCase()+'.png')});
   await context.close();
  }
  if(errors.length)throw Error([...new Set(errors)].join('\n'));
  console.log(JSON.stringify({checked,pagesRendered:true,browserErrors:0,output}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
