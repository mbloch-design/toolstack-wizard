import { useState } from 'react';
type Props={ownerId:string;label:string;avatarUrl:string|null;large?:boolean};
function AvatarImage({label,avatarUrl,large}:Omit<Props,'ownerId'>) {
 const [failed,setFailed]=useState(false);const size=large?56:32;
 return <span className={`ac-avatar${large?' ac-avatar--large':''}`} aria-hidden="true">
  {avatarUrl&&!failed?<img src={avatarUrl} alt="" width={size} height={size} referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>:Array.from(label)[0]?.toUpperCase()||'?'}
 </span>;
}
export default function AccountAvatar(props:Props) {
 return <AvatarImage key={`${props.ownerId}:${props.avatarUrl}`} label={props.label} avatarUrl={props.avatarUrl} large={props.large}/>;
}
