import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { createRepos } from "./repos.js";
import type { PrismaClient } from "./client.js";
const templates = JSON.parse(readFileSync(new URL("./team-bots.json", import.meta.url), "utf8"));
// Fingerprints of the original managed instructions with unresolved team IDs.
const previous: Record<string, {bytes: number; hash: string; title: string}> = {
 swift: {bytes: 9098, hash: "7d90cc1d513f07b3fc49a19c09774314cce7ee55cace92ae7cfe8cbaa10a241b", title: "ถามตอบเร็ว"},
 neo: {bytes: 8740, hash: "b451e883581d8dd60725d1153560e8441a0e9bee9027fc1a44066202a4a0288f", title: "ผู้ช่วยงานก่อสร้าง"}
};
export async function ensureCrdTeam(prisma: PrismaClient, actor: {userId: string; spaceId: string}) {
 const repo = createRepos(prisma);
 await prisma.space.updateMany({where:{id:actor.spaceId,createdByUserId:actor.userId,isDefault:true,name:"Personal",bots:{none:{}},botDeletions:{none:{}}},data:{name:"CRD Project Office"}});
 const bots: Record<string, any> = {};
 for (const template of templates) {
  const spawnKey = `crd-team-v1:${actor.userId}:${template.name}`;
  let bot = await prisma.bot.findFirst({where: {spaceId: actor.spaceId, spawnKey}});
  if (!bot && await prisma.botDeletion.findFirst({where:{spaceId:actor.spaceId,deletedByUserId:actor.userId,name:template.name}})) continue;
  if (!bot) {
   try { await repo.createBot(actor, {...template, description: template.instructions,
    spawnKey, notifyOnFinish: true, computerMode: "dedicated", thinkingLevel: "high"}); }
   catch (error: any) { if(error?.code !== "P2002") throw error; }
   bot = await prisma.bot.findFirstOrThrow({where: {spaceId: actor.spaceId, spawnKey}});
  }
  bots[template.name] = bot;
 }
 for (const template of templates) {
  const bot = bots[template.name];
  if (!bot || bot.archivedAt) continue;
  const legacy = previous[template.name];
  let raw = bot.instructions;
  let title = bot.title;
  if (legacy && bots.neo && bots.swift && title === legacy.title) {
   const normalized = Buffer.from(raw.replaceAll(bots.neo.id, "{{NEO_ID}}").replaceAll(bots.swift.id, "{{SWIFT_ID}}"));
   const fingerprint = createHash("sha256").update(normalized.subarray(0, legacy.bytes)).digest("hex");
   if (fingerprint === legacy.hash) {
    const suffix = normalized.subarray(legacy.bytes).toString();
    raw = template.instructions + (template.instructions.endsWith(suffix) ? "" : suffix);
    title = template.title;
   }
  }
  if (["ผู้จัดการติดตามโครงการ", "ผู้ช่วยติดตามข้อสังเกตหน้างาน"].includes(title)) {
   raw = template.instructions; title = template.title;
  }
  const instructions = raw.replace(/\{\{(\w+)_ID\}\}/g, (match: string, name: string) => bots[name.toLowerCase()]?.id ?? "ปิดใช้งาน");
  if (instructions === bot.instructions && title === bot.title) continue;
  await prisma.bot.updateMany({where:{id:bot.id, title:bot.title, instructions:bot.instructions},
   data:{title, instructions, ...(bot.description === bot.instructions ? {description:instructions} : {})}});
 }
}
