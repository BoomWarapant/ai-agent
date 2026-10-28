import assert from 'node:assert/strict';
import {createDb, bootstrapUserSpace} from '/app/packages/db/src/index.ts';
import {ensureCrdTeam} from '/app/packages/db/src/crd-team.ts';
import {extractReadableText} from '/app/packages/adapters/src/keyless-http-web.ts';
import {readFileSync} from 'node:fs';
if(process.env.CRD_PACKAGE_TEST !== '1') throw new Error('Run only against an isolated test deployment with CRD_PACKAGE_TEST=1');
const {prisma}=createDb(process.env.DATABASE_URL);
try {
 const user=await prisma.user.findFirstOrThrow({where:{email:'package-test@example.invalid'}});
 const space=await prisma.space.findFirstOrThrow({where:{createdByUserId:user.id}});
 const actor={userId:user.id,spaceId:space.id};
 await Promise.all([ensureCrdTeam(prisma,actor),ensureCrdTeam(prisma,actor)]);
 const bots=await prisma.bot.findMany({where:actor,include:{thread:true,computer:true}});
 assert.equal(bots.length,2);
 const neo=bots.find(b=>b.name==='neo'), swift=bots.find(b=>b.name==='swift');
 assert(neo.instructions.includes(swift.id));
 assert(swift.instructions.includes(neo.id));
 for(const b of bots){assert(b.thread);assert(b.computer);assert(!b.instructions.includes('{{'));assert.equal(b.thinkingLevel,'high');}
 const edited=neo.instructions+'\\nUser preference retained.';
 await prisma.bot.update({where:{id:neo.id},data:{instructions:edited}});
 await ensureCrdTeam(prisma,actor);
 assert.equal((await prisma.bot.findUniqueOrThrow({where:{id:neo.id}})).instructions,edited);
 const other=await prisma.user.create({data:{id:crypto.randomUUID(),name:'Isolation test',email:'isolation-'+crypto.randomUUID()+'@example.invalid'}});
 const otherSpace=await bootstrapUserSpace(prisma,other,{signupsEnabled:'true',signupAllowlist:undefined},{claimDeploymentOwner:false});
 const otherBots=await prisma.bot.findMany({where:{userId:other.id,spaceId:otherSpace.spaceId}});
 assert.equal(otherBots.length,2);assert(!otherBots[0].instructions.includes(neo.id));assert(!otherBots[0].instructions.includes(swift.id));
 const html='<html><head><title>Evidence test</title><meta property="article:published_time" content="2026-10-28"><script type="application/ld+json">{"datePublished":"2026-10-27","dateModified":"2026-10-29"}</script></head><body><main><a href="/story">Read article</a><p>'+ 'Article content. '.repeat(80)+'</p></main></body></html>';
 const result=extractReadableText(html,'https://example.com/news');
 assert(result.text.includes('https://example.com/story'));assert(result.text.includes('datePublished: 2026-10-27'));assert(result.text.includes('dateModified (not publication): 2026-10-29'));
 assert(readFileSync('/app/apps/web/dist/index.html','utf8').includes('<title>crd-bot</title>'));
 assert(readFileSync('/app/apps/web/dist/favicon.svg','utf8').includes('<svg'));
 assert.equal(await prisma.userModelCredential.count(),0);
 console.log(JSON.stringify({signupBots:2,idempotent:true,preservesEdits:true,accountIsolation:true,evidenceExtraction:true,webBranding:true,copiedModelCredentials:0}));
} finally {await prisma.$disconnect();}
