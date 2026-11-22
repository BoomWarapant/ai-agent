import {createDb} from "/app/packages/db/src/index.ts";
import {cp, mkdir, mkdtemp, realpath, rename, rm, stat} from "node:fs/promises";
import path from "node:path";

const {prisma}=createDb(process.env.DATABASE_URL);
const memoryRule="สะสมความจำประจำตัวใน MEMORY.md ของบอตนี้ครับ ก่อนเริ่มงานที่เกี่ยวข้องให้อ่านความจำเดิม เมื่อพบข้อเท็จจริงที่ใช้ต่อได้ การตัดสินใจที่ยืนยันแล้ว หรือความชอบที่ผู้ใช้บอก ให้บันทึกเพิ่มด้วยเครื่องมือความจำประจำบอต ตรวจรายการซ้ำ ระบุโครงการและวันที่ และรักษารายการเดิมครับ เก็บเฉพาะข้อมูลที่จำเป็นต่อหน้าที่และงดบันทึกรหัสผ่านหรือข้อมูลลับครับ";
async function containedDir(parent,name){
  if (!name || name==="." || name===".." || path.basename(name)!==name) throw Error("Invalid directory");
  const dir=path.join(parent,name);
  await mkdir(dir,{recursive:true});
  if(await realpath(dir)!==dir) throw Error("Unexpected linked directory: "+name);
  return dir;
}
async function install(){
  const {ownerUserId:userId}=await prisma.deploymentSettings.findUniqueOrThrow({where:{id:"default"}});
  if(!userId)throw Error("Missing owner");
  const spaces=await prisma.space.findMany({where:{createdByUserId:userId,name:"CRD Project Office"},include:{memberships:true}});
  if(spaces.length!==1 || spaces[0].memberships.some(m=>m.userId!==userId)) throw Error("Expected one private CRD Project Office");
  const actor={userId,spaceId:spaces[0].id};
  const bots=await prisma.bot.findMany({where:{...actor,archivedAt:null},include:{computer:true}});
  if(!bots.length || bots.some(b=>b.computer?.kind!=="docker" || b.computer.userId!==userId || b.computer.spaceId!==actor.spaceId)) throw Error("Expected office-owned Docker computers");
  const homeRoot=await containedDir(await realpath(process.env.DATA_DIR || "/data"),"homes");
  const homes=new Set(bots.map(b=>b.computer.homeKey));
  const teamComputers=await prisma.computer.findMany({where:{...actor,scope:"team",kind:"docker"},select:{homeKey:true}});
  for(const computer of teamComputers)homes.add(computer.homeKey);
  for(const key of homes){
    const library=await containedDir(await containedDir(homeRoot,key),"crd-local-skills");
    for(const item of input.skills){
      const dest=path.join(library,item.name+"-"+item.version);
      if(await stat(dest).catch(e=>{if(e.code!=="ENOENT")throw e;return null})){
        if(await realpath(dest)!==dest)throw Error("Unexpected linked skill directory");
        continue;
      }
      const temp=await mkdtemp(path.join(library,".install-"));
      try {
        await cp(path.join(input.stage,item.name),temp,{recursive:true});
        await rename(temp,dest);
      } finally { await rm(temp,{recursive:true,force:true}); }
    }
  }
  await prisma.$transaction(async tx=>{
    for(const item of input.skills){
      const name="local-"+item.name,location="crd-local-skills/"+item.name+"-"+item.version;
      const description="Local skill · "+item.description;
      const content=["---","name: "+name,"description: "+JSON.stringify(description),"---",
        "อ่าน "+location+"/SKILL.md จากราก workspace ของ computer แล้วทำตามขั้นตอนในไฟล์ครับ หากเริ่มใน bots/<id> ให้ขึ้นสองระดับเพื่อหาราก workspace ครับ",
        "ใช้ scripts, references และ assets จากโฟลเดอร์เดียวกันครับ ถ้าไม่พบไฟล์ในคอมพิวเตอร์ที่สร้างใหม่ให้แจ้งว่าต้องซิงก์ Skill อีกครั้งครับ หากต้องใช้โปรแกรม Windows หรือ MCP ให้ตรวจว่าเชื่อมต่อไว้จริงก่อนรายงานผลครับ"].join("\n");
      const existing=await tx.agentSkill.findFirst({where:{...actor,name:{equals:name,mode:"insensitive"}}});
      if(existing && existing.source!=="plugin") throw Error("Existing user skill: "+name);
      if(existing) await tx.agentSkill.update({where:{id:existing.id},data:{description,content}});
      else await tx.agentSkill.create({data:{...actor,name,description,content,source:"plugin"}});
    }
    for(const bot of bots){
      await tx.memoryDocument.upsert({where:{spaceId_scope_botId_path:{spaceId:actor.spaceId,scope:"bot",botId:bot.id,path:"MEMORY.md"}},
        update:{},create:{...actor,scope:"bot",botId:bot.id,path:"MEMORY.md",content:"# "+bot.name+"\n"}});
      const instructions=bot.instructions.includes(memoryRule)?bot.instructions:bot.instructions+"\n"+memoryRule;
      const changed=await tx.bot.updateMany({where:{id:bot.id,...actor,instructions:bot.instructions},
        data:{memoryScope:"isolated",instructions}});
      if(changed.count!==1)throw Error("Concurrent instructions edit: "+bot.name);
    }
  },{timeout:120000});
  console.log("Local skills ready: "+input.skills.length+"; isolated bot memories: "+bots.length);
}
try{await install()}finally{await prisma.$disconnect()}
