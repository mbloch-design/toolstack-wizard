import { describe, it, expect } from 'vitest';
import { recipeTarget, assertEmptyRegistry, isolateRecipeCommand } from '../../scripts/submission-recipe-guard.mjs';
describe('remote recipe isolation',()=>{
 it('refuses a production target without explicit preactivation authorization',()=>{
  expect(()=>recipeTarget({SUBMISSION_REDIS_TEST_URL:'https://db.upstash.io',SUBMISSION_REDIS_TEST_TOKEN:'private',SUBMISSION_REDIS_URL:'https://db.upstash.io/'})).toThrow();
 });
 it('accepts an explicitly authorized preactivation target but still requires an empty registry',()=>{
  expect(recipeTarget({SUBMISSION_REDIS_TEST_URL:'https://db.upstash.io',SUBMISSION_REDIS_TEST_TOKEN:'private',SUBMISSION_REDIS_URL:'https://db.upstash.io/',SUBMISSION_RECIPE_PREACTIVATION:'true'}).preactivation).toBe(true);
  expect(()=>assertEmptyRegistry(1)).toThrow();expect(()=>assertEmptyRegistry(null)).toThrow();expect(()=>assertEmptyRegistry('0')).toThrow();expect(()=>assertEmptyRegistry(0)).not.toThrow();
 });
 it('rewrites only the essential key position and blocks writes to every other key',()=>{
  const key='tt:recipe:7ec2090a-9157-43c9-9238-f8931667420d';
  expect(isolateRecipeCommand(['EVAL','lua',1,'tt:submissions:v1','{}'],key)).toEqual(['EVAL','lua',1,key,'{}']);
  expect(()=>isolateRecipeCommand(['HSET','tt:submissions:v1','x','y'],key)).toThrow();
  expect(()=>isolateRecipeCommand(['DEL','tt:submissions:v1'],key)).toThrow();
  expect(()=>isolateRecipeCommand(['EVAL','lua',2,'tt:submissions:v1','other'],key)).toThrow();
  expect(()=>isolateRecipeCommand(['HGET','tt:submissions:v1','x'],'tt:submissions:v1')).toThrow();
 });
});
