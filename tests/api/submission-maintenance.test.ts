import {afterEach,it,expect,vi} from 'vitest';
import {httpFixture} from './http';
import maintenance from '../../api/submission-maintenance';
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
it.each([undefined,'Bearer wrong','secret'])('rejects unauthenticated maintenance without storage access: %s',async authorization=>{
 vi.stubEnv('SUBMISSION_MAINTENANCE_TOKEN','local-secret');const network=vi.fn();vi.stubGlobal('fetch',network);const h=httpFixture({action:'retry',cursor:'0'});if(authorization)h.req.headers.authorization=authorization;
 await maintenance(h.req,h.res);expect(h.res.statusCode).toBe(401);expect(network).not.toHaveBeenCalled();
});
it('does not authorize requests when the maintenance secret is missing',async()=>{
 vi.stubEnv('SUBMISSION_MAINTENANCE_TOKEN','');const h=httpFixture({action:'retry'});h.req.headers.authorization='Bearer ';await maintenance(h.req,h.res);expect(h.res.statusCode).toBe(401);
});
it('validates action and cursor before storage',async()=>{
 vi.stubEnv('SUBMISSION_MAINTENANCE_TOKEN','local-secret');const network=vi.fn();vi.stubGlobal('fetch',network);const h=httpFixture({action:'delete',cursor:'bad'});h.req.headers.authorization='Bearer local-secret';await maintenance(h.req,h.res);expect(h.res.statusCode).toBe(400);expect(network).not.toHaveBeenCalled();
});
