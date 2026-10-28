import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
const bootstrap='/app/packages/db/src/bootstrap-user.ts';
let text=readFileSync(bootstrap,'utf8');
const marker='  return { spaceId: orgId };';
if(!text.includes(marker)) throw new Error('Unsupported bootstrap source');
text='import { ensureCrdTeam } from "./crd-team.js";\n'+text.replace(marker,'  await ensureCrdTeam(prisma, {userId: user.id, spaceId: orgId});\n'+marker);
writeFileSync(bootstrap,text);
function walk(dir){for(const e of readdirSync(dir,{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())walk(p);else if(p.endsWith('.tsx')){let s=readFileSync(p,'utf8');s=s.replaceAll('identity={bot.id}','identity={bot.name}').replaceAll('identity={active.id}','identity={active.name}');writeFileSync(p,s);}}}
walk('/app/apps/web/src');
