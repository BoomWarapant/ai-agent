import { readFileSync } from "node:fs";
import { createRepos } from "./repos.js";
import type { PrismaClient } from "./client.js";
const templates = JSON.parse(readFileSync(new URL("./team-bots.json", import.meta.url), "utf8"));
export async function ensureCrdTeam(prisma: PrismaClient, actor: {userId: string; spaceId: string}) {
 const repo = createRepos(prisma);
 const bots: Record<string, any> = {};
 for (const template of templates) {
  const spawnKey = `crd-team-v1:${actor.userId}:${template.name}`;
  let bot = await prisma.bot.findFirst({where: {spaceId: actor.spaceId, spawnKey}});
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
  if (!bot.instructions.includes("{{NEO_ID}}") && !bot.instructions.includes("{{SWIFT_ID}}")) continue;
  const instructions = bot.instructions.replaceAll("{{NEO_ID}}",bots.neo.id).replaceAll("{{SWIFT_ID}}",bots.swift.id);
  await prisma.bot.updateMany({where:{id:bot.id, instructions:bot.instructions},data:{instructions, description:instructions}});
 }
}
