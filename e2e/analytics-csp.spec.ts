import {test, expect} from '@playwright/test';
import {readFileSync} from 'node:fs';

const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
const csp = config.headers.flatMap((r: {headers: {key:string; value:string}[]})=>r.headers)
  .find((h: {key:string})=>h.key.toLowerCase()==='content-security-policy').value;

for(const {endpoint,result} of [
  {endpoint:'https://region1.google-analytics.com/g/collect',result:'allowed'},
  {endpoint:'https://www.google-analytics.com/g/collect',result:'allowed'},
  {endpoint:'https://google-analytics.com.attacker.invalid/g/collect',result:'blocked'},
]) {
  test(`CSP ${result}: ${new URL(endpoint).hostname}`,async({page})=>{
    // The browser enforces the actual Vercel policy. Endpoints are simulated;
    // no analytics request reaches Google or an unrelated service.
    await page.route(endpoint,route=>route.fulfill({status:204,headers:{'access-control-allow-origin':'*'}}));
    await page.route('http://csp.tooltrim.test/',route=>route.fulfill({
      status:200,contentType:'text/html',headers:{'content-security-policy':csp},
      body:`<!doctype html><body><script>fetch(${JSON.stringify(endpoint)}).then(()=>document.body.dataset.result='allowed').catch(()=>document.body.dataset.result='blocked');</script></body>`,
    }));
    await page.goto('http://csp.tooltrim.test/');
    await expect(page.locator('body')).toHaveAttribute('data-result',result);
  });
}
