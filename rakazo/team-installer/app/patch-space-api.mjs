import {readFileSync, writeFileSync} from "node:fs";

const [contractFile = "/app/packages/contracts/src/rpc.ts", routerFile = "/app/apps/api/src/router.ts"] = process.argv.slice(2);
function insert(file, marker, code) {
  const source = readFileSync(file, "utf8");
  if (source.includes(code)) return;
  if (source.split(marker).length !== 2) throw new Error("Unsupported Space API source: " + file);
  writeFileSync(file, source.replace(marker, () => code + marker));
}

insert(contractFile, "    list: oc.output(SpaceNavigationSchema),", `    rename: oc.input(z.object({
      spaceId: Id, previousName: z.string(), name: z.string().trim().min(1).max(60),
    })).output(z.object({ id: Id, name: z.string() })),
`);
insert(routerFile, "      list: authed.spaces.list.handler(", `      rename: authed.spaces.rename.handler(async ({ context, input }) => {
        const { userId, spaceId } = context.actor;
        const member = await deps.prisma.spaceMember.findUnique({
          where: {spaceId_userId: {spaceId, userId}}, select: {organizationId: true},
        });
        if (!member) throw new ORPCError("FORBIDDEN");
        const owned = {id: input.spaceId, organizationId: member.organizationId,
          memberships: {some: {userId, role: "owner"}}};
        const result = await deps.prisma.space.updateMany({
          where: {...owned, name: {in: [input.previousName, input.name]}}, data: {name: input.name},
        });
        if (!result.count) {
          if (!await deps.prisma.space.findFirst({where: owned, select: {id: true}}))
            throw new ORPCError("FORBIDDEN", {message: "เฉพาะเจ้าของ Space จึงจะเปลี่ยนชื่อได้ครับ"});
          throw new ORPCError("CONFLICT", {message: "ชื่อ Space เปลี่ยนไปแล้ว กรุณาปิดแล้วเปิดอีกครั้งครับ"});
        }
        return {id: input.spaceId, name: input.name};
      }),
`);

insert(contractFile, "    list: oc.output(SpaceNavigationSchema),", `    deletionContents: oc.input(z.object({spaceId: Id})).output(z.object({
      items: z.array(z.object({id: Id, name: z.string(), kind: z.enum(["bot", "group"]), archived: z.boolean()})),
      canRemoveItems: z.boolean(),
    })),
`);
insert(routerFile, "      list: authed.spaces.list.handler(", `      deletionContents: authed.spaces.deletionContents.handler(async ({context, input}) => {
        const {userId, spaceId} = context.actor;
        const current = await deps.prisma.spaceMember.findUnique({
          where: {spaceId_userId: {spaceId, userId}}, select: {organizationId: true},
        });
        if (!current) throw new ORPCError("FORBIDDEN");
        const target = await deps.prisma.space.findFirst({
          where: {id: input.spaceId, organizationId: current.organizationId, memberships: {some: {userId, role: "owner"}}},
          select: {isDefault: true, _count: {select: {memberships: true}}},
        });
        if (!target) throw new ORPCError("FORBIDDEN", {message: "เฉพาะเจ้าของ Space จึงจะลบได้ครับ"});
        if (target.isDefault) throw new ORPCError("BAD_REQUEST", {message: "ต้องเก็บ Space หลักไว้ครับ"});
        const count = await deps.prisma.spaceMember.count({where: {organizationId: current.organizationId, userId}});
        if (count <= 1) throw new ORPCError("BAD_REQUEST", {message: "ต้องเหลืออย่างน้อยหนึ่ง Space ครับ"});
        const query = {where: {spaceId: input.spaceId}, select: {id: true, name: true, archivedAt: true, userId: true}};
        const [bots, groups] = await Promise.all([deps.prisma.bot.findMany(query), deps.prisma.chatGroup.findMany(query)]);
        const items = [
          ...groups.map(row => ({...row, kind: "group" as const})),
          ...bots.map(row => ({...row, kind: "bot" as const})),
        ];
        if (items.some(row => row.userId !== userId))
          throw new ORPCError("BAD_REQUEST", {message: "มีรายการของสมาชิกคนอื่นใน Space นี้ครับ"});
        return {canRemoveItems: target._count.memberships === 1,
          items: items.map(({id, name, kind, archivedAt}) => ({id, name, kind, archived: archivedAt !== null}))};
      }),
`);
