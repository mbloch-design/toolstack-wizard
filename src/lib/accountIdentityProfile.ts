import type { User } from '@supabase/supabase-js';
import { normalizeDisplayName } from './accountProfile.js';
export type OAuthProfileSeed = { provider:'google'|'github';displayName:string|null;avatarUrl:string|null;providerLocale:string|null };
export function normalizeProviderLocale(value:unknown):string|null {
 if(typeof value!=='string'||value.length>35) return null;
 const locale=value.replaceAll('_','-');
 return /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(locale)?locale:null;
}
export function normalizeOAuthAvatar(value:unknown,provider:'google'|'github'|null):string|null {
 if(typeof value!=='string'||value.length>2048||/[\s\p{Cc}]/u.test(value)) return null;
 try {
  const url=new URL(value);
  if(url.protocol!=='https:'||url.username||url.password||url.port||url.hash) return null;
  const google=/^lh[0-9]+\.googleusercontent\.com$/.test(url.hostname),github=url.hostname==='avatars.githubusercontent.com';
  if(!(provider==='google'?google:provider==='github'?github:google||github)) return null;
  if(url.search && !/^\?(?:s|sz|v)=[0-9]+(?:&(?:s|sz|v)=[0-9]+)*$/.test(url.search)) return null;
  return value;
 }catch{return null;}
}
/** Cosmetic projection only. Call with the already server-verified getUser result. */
export function normalizeOAuthProfileSeed(user:User):OAuthProfileSeed|null {
 const identities=(Array.isArray(user.identities)?user.identities:[]).filter(identity=>identity&&identity.user_id===user.id&&(identity.provider==='google'||identity.provider==='github'));
 const initial=user.app_metadata?.provider;
 identities.sort((a,b)=>{
  const rank=(p:string)=>p===initial?0:p==='google'?1:2;
  return rank(a.provider)-rank(b.provider)||String(a.id).localeCompare(String(b.id),'en');
 });
 const identity=identities[0]; if(!identity) return null;
 const provider=identity.provider as OAuthProfileSeed['provider'];
 const data=identity.identity_data&&typeof identity.identity_data==='object'&&!Array.isArray(identity.identity_data)?identity.identity_data:{};
 let displayName:string|null=null;
 for(const field of provider==='google'?['full_name','name']:['full_name','name','user_name','preferred_username']) {
  try{displayName=normalizeDisplayName(data[field]);}catch{displayName=null;}
  if(displayName) break;
 }
 return {provider,displayName,avatarUrl:normalizeOAuthAvatar(data.avatar_url??data.picture,provider),providerLocale:normalizeProviderLocale(data.locale)};
}
