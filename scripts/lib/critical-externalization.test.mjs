import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

// A catalogue contains thousands of HTML documents sharing a few CSS variants.
// The externalizer must retain variants, rather than every full document.
describe('critical stylesheet externalization', () => {
  it('externalizes repeated documents within bounded heap and preserves order', () => {
    const directory=fs.mkdtempSync(path.join(os.tmpdir(),'tt-critical-'));
    try {
      const dist=path.join(directory,'dist');fs.mkdirSync(dist);
      const css='.sample{--payload:"'+'x'.repeat(280000)+'";color:red}';
      for(let i=0;i<420;i++)fs.writeFileSync(path.join(dist,`${i}.html`),`<html><head><style id="critical-css">${css}</style></head><body>${i}</body></html>`);
      const run=spawnSync(process.execPath,['--max-old-space-size=96',path.resolve('scripts/externalize-critical-css.mjs')],{cwd:directory,encoding:'utf8',timeout:30000});
      expect(run.status,run.stderr?.slice(-1000)).toBe(0);
      const html=fs.readFileSync(path.join(dist,'419.html'),'utf8');
      expect(html).toContain('<body>419</body>');
      expect(html).not.toContain('<style');
      const links=[...html.matchAll(/href="\/assets\/([^"]+)"/g)].map(m=>m[1]);
      expect(links.map(name=>fs.readFileSync(path.join(dist,'assets',name),'utf8')).join('')).toBe(css);
    }finally{fs.rmSync(directory,{recursive:true,force:true})}
  },40000);
});
