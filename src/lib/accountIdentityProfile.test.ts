import type { User } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import { normalizeOAuthProfileSeed } from './accountIdentityProfile';
const owner='11111111-1111-4111-8111-111111111111';
const google={provider:'google',user_id:owner,id:'g',identity_data:{full_name:' Google Name ',avatar_url:'https://lh3.googleusercontent.com/a/photo?sz=96',locale:'fr_FR',role:'admin'}};
const github={provider:'github',user_id:owner,id:'h',identity_data:{user_name:'octocat',avatar_url:'https://avatars.githubusercontent.com/u/1?v=4',locale:'en'}};
const user=(identities: unknown[], provider='google', extra={})=>({id:owner,app_metadata:{provider},identities,user_metadata:{name:'Forged',avatar_url:'https://evil.invalid',role:'admin'},...extra}) as unknown as User;
describe('cosmetic OAuth seed from verified identities',()=>{
 it.each([['google',google,'Google Name','fr-FR'],['github',github,'octocat','en']])('projects only useful %s fields', (provider,identity,displayName,providerLocale)=>{
  expect(normalizeOAuthProfileSeed(user([identity]))).toEqual({provider,displayName,avatarUrl:identity.identity_data.avatar_url,providerLocale});
 });
 it('selects the initial attached provider then Google then GitHub without mixing',()=>{
  expect(normalizeOAuthProfileSeed(user([google,github],'github'))?.displayName).toBe('octocat');
  expect(normalizeOAuthProfileSeed(user([github,google],'email'))?.provider).toBe('google');
  expect(normalizeOAuthProfileSeed(user([{...google,identity_data:{}},github]))).toEqual({provider:'google',displayName:null,avatarUrl:null,providerLocale:null});
 });
 it('sorts duplicate provider identities by id rather than input order',()=>{
  const other={...google,id:'a',identity_data:{name:'First'}};
  expect(normalizeOAuthProfileSeed(user([google,other]))).toEqual(normalizeOAuthProfileSeed(user([other,google])));
  expect(normalizeOAuthProfileSeed(user([google,other]))?.displayName).toBe('First');
 });
 it('rejects foreign or malformed identities and never trusts user metadata',()=>{
  for(const identities of [[],[{...google,user_id:'other'}],[{provider:'google',identity_data:google.identity_data}],[null], [{...google,identity_data:[]}]] ){
   const seed=normalizeOAuthProfileSeed(user(identities)); expect(seed === null || seed.displayName === null).toBe(true);
  }
  expect(normalizeOAuthProfileSeed(user([], 'email'))).toBeNull();
 });
 it.each(['x'.repeat(81),'a\nb','a\u0085b',42,{},['name']])('omits invalid names %j',name=>{
  expect(normalizeOAuthProfileSeed(user([{...google,identity_data:{name}}]))?.displayName).toBeNull();
 });
 it('accepts Unicode name code points and omits absent locale',()=>{
  expect(normalizeOAuthProfileSeed(user([{...github,identity_data:{name:'𐐀'.repeat(80)}}]))).toMatchObject({displayName:'𐐀'.repeat(80),providerLocale:null});
 });
 it.each(['https://evil.invalid/a','http://lh3.googleusercontent.com/a','https://lh3.googleusercontent.com.evil.invalid/a','https://u:p@lh3.googleusercontent.com/a','https://lh3.googleusercontent.com:444/a','https://lh3.googleusercontent.com/a#secret','https://lh3.googleusercontent.com/a?token=secret','https://lh3.googleusercontent.com/a?sz=abc','https://avatars.githubusercontent.com/u/1','https://lh3.googleusercontent.com/'+ 'x'.repeat(2048),'https://lh3.googleusercontent.com/a?%73=20','https://lh3.googleusercontent.com/a\n'])('omits unsafe Google photo %s',avatar_url=>{
  expect(normalizeOAuthProfileSeed(user([{...google,identity_data:{avatar_url}}]))?.avatarUrl).toBeNull();
 });
 it.each(['en_US_POSIX','e','english','fr-1','fr-abcdefghi','a'.repeat(36),42,{}])('omits invalid locale %j',locale=>{
  const expected=locale==='en_US_POSIX'?'en-US-POSIX':null;
  expect(normalizeOAuthProfileSeed(user([{...github,identity_data:{locale}}]))?.providerLocale).toBe(expected);
 });
});
