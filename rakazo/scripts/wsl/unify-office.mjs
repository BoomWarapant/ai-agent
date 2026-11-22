// Executed by tsx in the running API container, with officeInput supplied by the installer.
import {createDb, createRepos} from "/app/packages/db/src/index.ts";

const {prisma} = createDb(process.env.DATABASE_URL);
const profiles = officeInput.profiles;
const teamName = "CRD Project Office";
const historyName = "CRD · ประวัติงานวิจัย";

async function migrate() {
  const {ownerUserId: userId} = await prisma.deploymentSettings.findUniqueOrThrow({where:{id:"default"}});
  if (!userId) throw new Error("Deployment owner is missing");
  const neo = await prisma.bot.findMany({where:{userId,name:"neo",archivedAt:null}});
  if (neo.length !== 1) throw new Error("Expected one active neo for deployment owner");
  const spaceId = neo[0].spaceId;
  const actor = {spaceId,userId};
  const existing = await prisma.bot.findMany({where:{...actor,name:{in:profiles.map(p=>p.name)}}});
  const managed = existing.some(bot => bot.spawnKey?.startsWith("crd-team-v1:"));
  const labs = managed ? [] : await prisma.space.findMany({where:{createdByUserId:userId,name:{in:["Research Lab",historyName]},id:{not:spaceId}},include:{memberships:true}});
  const space = await prisma.space.findUniqueOrThrow({where:{id:spaceId},include:{memberships:true}});
  if ([space,...labs].some(s=>s.memberships.some(m=>m.userId!==userId))) throw new Error("Shared workspace found. No workspace changes applied.");
  const bots = new Map();
  for (const p of profiles) {
    const matches = existing.filter(b=>b.name===p.name);
    if (matches.length>1 || matches[0]?.archivedAt) throw new Error("Conflicting bot: "+p.name);
    if (matches.length) bots.set(p.name,matches[0]);
  }
  if (!bots.has("swift")) throw new Error("swift must be in neo's workspace");
  const repo = createRepos(prisma);
  const deletions=await prisma.botDeletion.findMany({where:{spaceId,deletedByUserId:userId},select:{name:true}});
  const removed=new Set(deletions.map(b=>b.name));
  for (const p of profiles) {
    if (bots.has(p.name) || removed.has(p.name)) continue;
    const spawnKey = "crd-team-v1:"+userId+":"+p.name;
    try {
      await repo.createBot(actor,{...p,spawnKey,description:p.title,instructions:p.title,
        parentBotId:neo[0].id,thinkingLevel:"high",notifyOnFinish:true,computerMode:"dedicated"});
    } catch(e) { if(e.code!=="P2002") throw e; }
    bots.set(p.name,await prisma.bot.findFirstOrThrow({where:{...actor,spawnKey,archivedAt:null}}));
  }
  await prisma.$transaction(async tx=>{
    for(const [position,p] of profiles.entries()) {
      const bot=bots.get(p.name);
      if (!bot || ((managed || space.name===teamName) && existing.some(b=>b.id===bot.id) && bot.instructions!==p.title)) continue;
      let instructions=p.instructions.replace(/\{\{(\w+)_ID\}\}/g,(_,name)=>bots.get(name.toLowerCase())?.id ?? "ปิดใช้งาน");
      if(p.name==="swift") instructions+="\nหากเครื่องยังไม่มี /opt/crd/project_status.py ให้เขียนโค้ดนี้ลงไฟล์ชั่วคราวแล้วรันกับ CSV ครับ\n```python\n"+officeInput.calculator+"\n```";
      const changed=await tx.bot.updateMany({where:{...actor,id:bot.id,updatedAt:bot.updatedAt,archivedAt:null},
        data:{title:p.title,instructions,description:p.title,position,sectionId:null}});
      if(changed.count!==1) throw new Error("Concurrent bot edit: "+p.name);
    }
    if (!managed) await tx.space.updateMany({where:{id:spaceId,name:"Personal"},data:{name:teamName}});
    for(const lab of labs) {
      const old=await tx.bot.findMany({where:{spaceId:lab.id,userId,archivedAt:null},select:{id:true}});
      const ids=old.map(b=>b.id);
      await tx.routine.updateMany({where:{spaceId:lab.id,userId,botId:{in:ids}},data:{active:false}});
      await tx.bot.updateMany({where:{spaceId:lab.id,userId,id:{in:ids}},data:{archivedAt:new Date()}});
      await tx.space.update({where:{id:lab.id},data:{name:historyName}});
    }
    const count=await tx.bot.count({where:{...actor,archivedAt:null,id:{in:[...bots.values()].map(b=>b.id)},thread:{isNot:null},computerId:{not:null}}});
    if(count!==bots.size) throw new Error("Incomplete office team");
  });
  console.log(teamName+" verified: "+[...bots.keys()].join(", "));
}
try {await migrate()} finally {await prisma.$disconnect()}
