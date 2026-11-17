import { test, expect } from '@playwright/test';
import { LIMITS } from '../../lib/content';
const origin='http://127.0.0.1:3017';
test('unauthorized writes, cross-site requests, draft reads and portraits fail closed',async({request})=>{
 const id='00000000-0000-4000-8000-000000000000';
 expect((await request.post('/api/newspapers',{headers:{origin},data:{}})).status()).toBe(401);
 expect((await request.patch(`/api/newspapers/${id}`,{headers:{origin},data:{operation:'delete'}})).status()).toBe(401);
 expect((await request.get(`/api/newspapers/${id}`)).status()).toBe(401);
 expect((await request.post('/api/auth/login',{headers:{origin:'https://evil.example'},data:{username:'a',password:'b'}})).status()).toBe(403);
 expect((await request.get(`/api/portrait/${id}`)).status()).toBe(404);
 expect((await request.get(`/birthday/${id}`)).status()).toBe(404);
});
test('admin login, protected editor, unavailable persistence and logout',async({page,request})=>{
 await page.goto('/admin/new');await expect(page).toHaveURL(/\/admin$/);
 await page.getByLabel('Username').fill('qa-admin');await page.getByLabel('Password',{exact:true}).fill('local-qa-password-only');await page.getByRole('button',{name:'Log in',exact:true}).click();
 await expect(page.getByRole('heading',{name:'The family collection.'})).toBeVisible();
 const session=(await page.context().cookies()).find(c=>c.name==='mon-session');expect(session?.httpOnly).toBe(true);expect(session?.sameSite).toBe('Strict');
 await expect(page.getByText('Private storage is not connected.',{exact:false})).toBeVisible();
 await page.getByRole('link',{name:'Create Newspaper',exact:true}).click();
 await expect(page.getByRole('button',{name:'Save Draft',exact:true})).toBeDisabled();
 await page.getByLabel('Member name',{exact:true}).fill('QA member');
 page.once('dialog',dialog=>dialog.accept());await page.getByRole('link',{name:'All newspapers',exact:false}).click();
 await page.getByRole('button',{name:'Log out',exact:true}).click();await expect(page.getByRole('button',{name:'Log in',exact:true})).toBeVisible();
 const response=await request.post('/api/newspapers',{headers:{origin},data:{}});expect(response.status()).toBe(401);
});
test('local edit, photo, unsaved warning, responsive widths and print artifacts',async({page})=>{
 await page.goto('/studio');await expect(page.getByText('Local studio: changes stay in this tab',{exact:false})).toBeVisible();
 await page.getByLabel('Main headline',{exact:true}).fill('Our favorite person, celebrated today');
 await expect(page.locator('.birthday-headline')).toHaveText('Our favorite person, celebrated today');
 await page.getByLabel('Member portrait',{exact:true}).setInputFiles({name:'bad.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg/>')});
 await expect(page.locator('.error[role=alert]')).toContainText('JPEG or PNG');
 await page.getByLabel('Member portrait',{exact:true}).setInputFiles('tests/fixtures/portrait.png');
 await expect(page.locator('.portrait img')).toBeVisible();
 for(const width of [320,375,390,430,1280]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);}
 await page.getByRole('button',{name:'Preview',exact:true}).click();
 for(const width of [320,375,390,430,1280]){
  await page.setViewportSize({width,height:900});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.screenshot({path:`artifacts/studio-${width}.png`,fullPage:true});
 }
 await page.emulateMedia({media:'print'});await page.pdf({path:'artifacts/sample.pdf',preferCSSPageSize:true,printBackground:true});
 await page.emulateMedia({media:'screen'});await page.getByRole('button',{name:'Back to editor',exact:true}).click();
 const labels={name:'Member name',headline:'Main headline',story:'Birthday story',memories:'Favorite memories',wishes:'Birthday wishes',closing:'Closing message'};
 for(const [key,label] of Object.entries(labels)){const limit=LIMITS[key as keyof typeof LIMITS];await page.getByLabel(label,{exact:true}).fill('Wide words make a meaningful story. '.repeat(80).slice(0,limit));}
 await page.getByRole('button',{name:'Preview',exact:true}).click();await page.emulateMedia({media:'print'});
 const fits=await page.locator('.paper').evaluateAll(papers=>papers.map(p=>({scroll:p.scrollHeight,client:p.clientHeight})));await page.screenshot({path:'artifacts/maximum-print.png',fullPage:true}); expect(fits.every(p=>p.scroll<=p.client+1)).toBe(true);
 await page.pdf({path:'artifacts/maximum-content.pdf',preferCSSPageSize:true,printBackground:true});
 await page.emulateMedia({media:'screen'});await page.getByRole('button',{name:'Back to editor',exact:true}).click();
 for(const [key,label] of Object.entries(labels)){await page.getByLabel(label,{exact:true}).fill('W'.repeat(LIMITS[key as keyof typeof LIMITS]));}
 await page.getByRole('button',{name:'Preview',exact:true}).click();await page.emulateMedia({media:'print'});
 const wideFits=await page.locator('.paper').evaluateAll(papers=>papers.map(p=>({scroll:p.scrollHeight,client:p.clientHeight})));
 await page.pdf({path:'artifacts/wide-content.pdf',preferCSSPageSize:true,printBackground:true});
 expect(wideFits.every(p=>p.scroll<=p.client+1),JSON.stringify(wideFits)).toBe(true);
 await page.emulateMedia({media:'screen'});page.once('dialog',d=>d.dismiss());await page.getByRole('link',{name:'Home',exact:false}).last().click();await expect(page).toHaveURL(/\/studio$/);
});

test('repeated wrong passwords are rate limited',async({request})=>{
 let limited=false;
 for(let attempt=0;attempt<12;attempt++){
  const response=await request.post('/api/auth/login',{headers:{origin},data:{username:'qa-admin',password:'wrong-password'}});
  if(response.status()===429){limited=true;break;}expect(response.status()).toBe(401);
 }
 expect(limited).toBe(true);
 expect((await request.post('/api/auth/login',{headers:{origin},data:{username:'qa-admin',password:'local-qa-password-only'}})).status()).toBe(429);
});
