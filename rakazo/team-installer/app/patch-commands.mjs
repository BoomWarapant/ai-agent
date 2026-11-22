import {readFileSync, writeFileSync} from "node:fs";
const root="/app/apps/web/src/pages/";
const shell=root+"Shell.tsx";
let source=readFileSync(shell,"utf8");
function replaceOne(from,to){
  if(source.split(from).length!==2) throw new Error("Unsupported Rakazo source near "+from.slice(0,64));
  source=source.replace(from,()=>to);
}
if(!source.includes("const [crdClearMarks,")){
  replaceOne("  const transcriptMessages = useMemo(",`  const [crdClearMarks, setCrdClearMarks] = useState<Record<string, string>>({});
  const [focusModel, setFocusModel] = useState(false);
  const crdThread = activeSnapshot?.threadId ?? "";
  const clearedAt = crdClearMarks[crdThread];
  useEffect(() => {
    if (!focusModel || panel !== "settings") return;
    const focus = () => {
      const details = document.querySelector<HTMLDetailsElement>('[data-testid="bot-settings-advanced"]');
      const select = details?.querySelector<HTMLSelectElement>('select[id$="-model"]');
      if (!details || !select) return false;
      details.open = true;
      select.focus(); select.scrollIntoView({block:"nearest"});
      setFocusModel(false);
      return true;
    };
    if (focus()) return;
    const observer = new MutationObserver(() => {if(focus()) observer.disconnect()});
    observer.observe(document.body,{childList:true,subtree:true});
    return () => observer.disconnect();
  }, [focusModel,panel]);
  const transcriptMessages = useMemo(`);
  replaceOne("messages={transcriptMessages}","messages={clearedAt ? transcriptMessages.filter(m => Date.parse(m.createdAt) > Date.parse(clearedAt)) : transcriptMessages}");
  replaceOne("olderCursor={activeSnapshot?.olderCursor ?? null}","olderCursor={clearedAt ? null : activeSnapshot?.olderCursor ?? null}");
  replaceOne("        <Transcript\n",`        {clearedAt && <button type="button" className="mx-auto px-3 py-1 text-sm underline" onClick={() => setCrdClearMarks(prev => {const next={...prev};delete next[crdThread];return next;})}>แสดงประวัติแชตเดิม</button>}
        <Transcript
`);
  replaceOne('            if (action === "chat-settings")',`            if(action === "clear"){
              const last=transcriptMessages.at(-1);
              if(crdThread && last)setCrdClearMarks(prev=>({...prev,[crdThread]:last.createdAt}));
              return;
            }
            if(action === "mcp"){setMcpOpen(true);return;}
            if(action === "model"){
              if(inGroup || !active) openSettings("models");
              else {setFocusModel(true);setPanel("settings");}
              return;
            }
            if (action === "chat-settings")`);
  replaceOne("  type SlashActionId,","  type SlashActionId as CoreSlashActionId,");
  replaceOne("export function ShellPage() {",'type SlashActionId = CoreSlashActionId | "clear" | "model" | "mcp";\n\nexport function ShellPage() {');
  replaceOne("return SLASH_ACTIONS.filter","return ([{id:'clear',label:'/clear'}, {id:'model',label:'/model'}, {id:'mcp',label:'/mcp'}, ...SLASH_ACTIONS] as Array<{id:SlashActionId;label:string}>).filter");
  replaceOne('function slashActionLabel(id: SlashActionId) {','function slashActionLabel(id: SlashActionId) {\n  if(id==="clear")return "/clear · ล้างหน้าจอ";\n  if(id==="model")return "/model · เลือกโมเดล";\n  if(id==="mcp")return "/mcp · จัดการการเชื่อมต่อ";');
  replaceOne("    const text = serializeComposerPrompt(draft, selectedSkill, selectedMentions);",`    const command = draft.trim().toLowerCase();
    if (!selectedSkill && !selectedMentions.length && !pendingAttachments.length && onSlashAction && (command === "/clear" || command === "/model" || command === "/mcp")) {
      runSlashAction(command === "/clear" ? "clear" : command === "/model" ? "model" : "mcp");return;
    }
    const text = serializeComposerPrompt(draft, selectedSkill, selectedMentions);`);
  replaceOne("<ProjectOffice bots={bots} openBot={openBot} />",'<ProjectOffice bots={bots} openBot={openBot} createBot={() => setPanel("create")} deleteBot={setDeleteTarget} />');
  writeFileSync(shell,source);
}
const panel=root+"shell/bot-panel.tsx";
source=readFileSync(panel,"utf8");
if(!source.includes("const [botInstructions,")){
  replaceOne("  BOT_DESCRIPTION_MAX_LENGTH,","  BOT_DESCRIPTION_MAX_LENGTH,\n  BOT_INSTRUCTIONS_MAX_LENGTH,");
  replaceOne("  const [description, setDescription] = useState(bot.description);",
    "  const [description, setDescription] = useState(bot.description);\n  const [botInstructions,setBotInstructions] = useState(bot.instructions);");
  const start=source.indexOf("export function BotSettings(");
  if(start<0)throw new Error("Missing BotSettings");
  const prefix=source.slice(0,start);
  source=source.slice(start);
  const label='      <label htmlFor={`${ids}-description`} className={fieldLabelClass}>';
  replaceOne(label,`      <label htmlFor={`+"`${ids}-instructions`"+`} className={fieldLabelClass}>
        Instructions · คำสั่งประจำบอต
        <Textarea id={`+"`${ids}-instructions`"+`} value={botInstructions} maxLength={BOT_INSTRUCTIONS_MAX_LENGTH}
          onChange={(e)=>setBotInstructions(e.target.value)} rows={6} className="mt-2" />
      </label>
`+label);
  replaceOne("instructions: nextDescription,", "...(botInstructions.trim() !== bot.instructions ? {instructions:botInstructions.trim()} : {}),");
  replaceOne("description: nextDescription,", "...(nextDescription !== bot.description ? {description:nextDescription} : {}),");
  writeFileSync(panel,prefix+source);
}

// Use Rakazo's own create endpoint so the thread, computer and MEMORY.md are provisioned together.
source=readFileSync(shell,"utf8");
if(!source.includes("const crdBotMemoryRule =")){
  replaceOne("export function ShellPage() {","const crdBotMemoryRule = " + '"สะสมความจำประจำตัวใน MEMORY.md ของบอตนี้ครับ ก่อนเริ่มงานที่เกี่ยวข้องให้อ่านความจำเดิม เมื่อพบข้อเท็จจริงที่ใช้ต่อได้ การตัดสินใจที่ยืนยันแล้ว หรือความชอบที่ผู้ใช้บอก ให้บันทึกเพิ่มด้วยเครื่องมือความจำประจำบอต ตรวจรายการซ้ำ ระบุโครงการและวันที่ และรักษารายการเดิมครับ เก็บเฉพาะข้อมูลที่จำเป็นต่อหน้าที่และงดบันทึกรหัสผ่านหรือข้อมูลลับครับ"' + ";\nexport function ShellPage() {");
  replaceOne("  async function createBot(input: {","  async function createBot(input: {\n    instructions?:string;");
  replaceOne("      ...normalizeCreateBotProfile(input),","      ...normalizeCreateBotProfile(input),\n      instructions: [input.instructions?.trim() || input.description.trim(),crdBotMemoryRule].filter(Boolean).join('\\n'),");
  replaceOne("    setBots((current) =>\n      current.some((item) => item.id === bot.id)","    await rpc.bots.update({botId:bot.id,memoryScope:'isolated'});\n    setBots((current) =>\n      current.some((item) => item.id === bot.id)");
  writeFileSync(shell,source);
}
source=readFileSync(panel,"utf8");
if(!source.includes("const [newBotInstructions,") && !source.includes("useBotBrief(")){
  const split=source.indexOf("export function BotSettings(");
  const settings=source.slice(split);source=source.slice(0,split);
  replaceOne("    description: string;","    description: string;\n    instructions?:string;");
  replaceOne("  const [description, setDescription] = useState(\"\");","  const [description, setDescription] = useState(\"\");\n  const [newBotInstructions,setNewBotInstructions] = useState(\"\");");
  replaceOne("        description: description.trim(),","        description: description.trim(),\n        instructions:newBotInstructions.trim(),");
  const label='      <label htmlFor={`${ids}-description`} className={fieldLabelClass}>';
  const input='<label className={fieldLabelClass}>Instructions · คำสั่งประจำบอต<Textarea value={newBotInstructions} maxLength={BOT_INSTRUCTIONS_MAX_LENGTH-512} onChange={e=>setNewBotInstructions(e.target.value)} rows={4} /></label>';
  replaceOne(label,"      "+input+"\n"+label);
  writeFileSync(panel,source+settings);
}

source = readFileSync(shell, "utf8");
if (!source.includes('from "./crd-space-navigation"')) {
  source = 'import { returnToCrdChat, spaceEntryPath } from "./crd-space-navigation";\n' + source;
  replaceOne('openSpaceChat(group.emptySpaceId, "/onboarding");',
    'openSpaceChat(group.emptySpaceId, spaceEntryPath("/app", bootstrapMe?.spaceId ?? selectedSpaceId()));');
  replaceOne("              const space = await rpc.spaces.create({ name });",
    '              const setupPath = spaceEntryPath("/onboarding", bootstrapMe?.spaceId ?? selectedSpaceId());\n' +
    "              const space = await rpc.spaces.create({ name });");
  replaceOne('window.location.assign("/onboarding");', 'window.location.assign(setupPath);');
  for (const listing of ["navigation", "bootstrap"]) {
    const noContent = '!' + listing + '.spaces.some((space) => space.hasContent)';
    replaceOne(noContent, noContent + ' &&\n          new URLSearchParams(window.location.search).get("view") !== "chats"');
  }
  replaceOne("        const currentGroupId = routeGroupId.current;",
    '        if (!list.length && !groupList.length && window.location.pathname === "/app") return;\n' +
    "        const currentGroupId = routeGroupId.current;");
  replaceOne("            <ProjectOffice bots=", `            {searchParams.has("returnSpace") && (
              <button type="button" onClick={returnToCrdChat}
                className="app-no-drag rounded-md px-2 py-1 text-sm hover:bg-accent">
                กลับไปแชตเดิม
              </button>
            )}
            <ProjectOffice bots=`);
  writeFileSync(shell, source);
}


const onboarding = root + "Onboarding.tsx";
source = readFileSync(onboarding, "utf8");
if (!source.includes('from "./crd-space-navigation"')) {
  source = 'import { returnToCrdChat } from "./crd-space-navigation";\n' + source;
  replaceOne('        {step !== "loading" ? (\n          <Button', '        <Button');
  replaceOne('            onClick={() => navigate("/app")}', '            onClick={returnToCrdChat}');
  replaceOne('            <Trans>Back to app</Trans>\n          </Button>\n        ) : null}',
    '            กลับไปหน้าแชต crd-bot\n        </Button>');
  writeFileSync(onboarding, source);
}

const uiIndex = root + "../../../../packages/ui-web/src/index.ts";
let exportsText = readFileSync(uiIndex, "utf8");
if (!exportsText.includes('from "./crd-portraits.js"')) {
  writeFileSync(uiIndex, exportsText + '\nexport { CrdPortraitContext, makeCrdPortraits } from "./crd-portraits.js";\n');
}

source = readFileSync(shell, "utf8");
if (!source.includes("const crdPortraits =")) {
  replaceOne("  AvatarStyleProvider,", "  AvatarStyleProvider,\n  CrdPortraitContext,\n  makeCrdPortraits,");
  replaceOne("  const activeRoutines =", `  const crdPortraits = useMemo(
    () => makeCrdPortraits([...bots, ...spaces.flatMap(space => space.bots), ...archivedBots]),
    [bots, spaces, archivedBots],
  );
  const activeRoutines =`);
  replaceOne('>{shell}</AvatarStyleProvider>', '><CrdPortraitContext.Provider value={crdPortraits}>{shell}</CrdPortraitContext.Provider></AvatarStyleProvider>');
  for (const item of ["active", "bot", "item.chat"]) {
    source = source.replaceAll("identity={" + item + ".name}", "identity={" + item + ".id}");
  }
  writeFileSync(shell, source);
}

if (!source.includes('data-testid="bot-routines"')) {
  replaceOne('type Panel =\n  | "computer"', 'type Panel =\n  | "routines"\n  | "computer"');
  replaceOne("            <ProjectOffice bots=", `            {active && !inGroup && (
              <Button type="button" variant="ghost" size="sm" data-testid="bot-routines"
                className="app-no-drag" aria-label="Routine ของบอต" title="Routine ของบอต"
                aria-pressed={panel === "routines"} onClick={() => setPanel(panel === "routines" ? null : "routines")}>
                <Clock size={16} aria-hidden="true" /><span className="hidden md:inline">Routine</span>
              </Button>
            )}
            <ProjectOffice bots=`);
  replaceOne('                <RoutineListHeader\n', `              </div>
            ) : null}
            {(panel === "routines" || panel === "computer") && active ? (
              <div>
                <RoutineListHeader
`);
  replaceOne('{panel === "settings" ? (\n                    <Trans>Settings</Trans>',
    '{panel === "routines" && active ? (\n                    active.name\n                  ) : panel === "settings" ? (\n                    <Trans>Settings</Trans>');
  replaceOne('onBack={() => setPanel("computer")}', 'onBack={() => setPanel("routines")}');
  replaceOne('if (activeBotId.current === target.botId) setPanel("computer");',
    'if (activeBotId.current === target.botId) setPanel("routines");');
  writeFileSync(shell, source);
}

exportsText = readFileSync(uiIndex, "utf8");
if (!exportsText.includes("chosenPortrait,")) {
  writeFileSync(uiIndex, exportsText + '\nexport { chosenPortrait, portraitChoices } from "./crd-portraits.js";\n');
}

function replaceThrough(first, last, replacement) {
  const start = source.indexOf(first);
  const end = source.indexOf(last, start);
  if (start < 0 || end < 0) throw new Error("Missing CRD form section: " + first);
  replaceOne(source.slice(start,end + last.length),replacement);
}

source = readFileSync(shell,"utf8");
if (!source.includes("usePortraitDirectory(")) {
  source = 'import { usePortraitDirectory } from "./CrdAvatarPicker";\n' +
    'import { DuplicateBotBrief } from "./CrdBotBrief";\n' + source;
  replaceOne("  makeCrdPortraits,\n","");
  replaceThrough("  const crdPortraits = useMemo(", "  );",
    "  const crdPortraits = usePortraitDirectory(userId, bots, spaces, archivedBots);");
  replaceOne("              <BotSettings\n","              <BotSettings\n                portraitUserId={userId}\n");
  replaceOne("          <WindowChrome />",`          <div className="flex items-center gap-2">
            <WindowChrome /><img src="/favicon-32x32.png?v=crd-1.0.0" width={24} height={24} alt="crd-bot" className="rounded-md" />
          </div>`);
  replaceOne("  const [booting, setBooting]", "  const [duplicateSource, setDuplicateSource] = useState<Pick<Bot, 'id' | 'title'> | null>(null);\n  const [booting, setBooting]");
  replaceOne("        {newSpaceOpen ? (", `        {duplicateSource && <DuplicateBotBrief key={duplicateSource.id} bot={duplicateSource}
          onCancel={() => setDuplicateSource(null)} onDone={id => {
            setDuplicateSource(null); navigate("/app/" + id); void refreshBots().catch(() => undefined);
          }} />}
        {newSpaceOpen ? (`);
  replaceThrough("            onDuplicate={() => {","            }}",`            onDuplicate={() => {
              setBotMenu(null);
              if (contextBot) { setDuplicateSource(contextBot); return; }
              if (contextGroup) void rpc.groups.duplicate({groupId: contextGroup.id}).then(async chat => {
                await refreshBots(); navigate("/app/g/" + chat.id);
              });
            }}`);
  replaceOne("instructions: [input.instructions?.trim() || input.description.trim(),crdBotMemoryRule]",
    "instructions: input.instructions?.trim() || [input.description.trim(),crdBotMemoryRule]");
  writeFileSync(shell,source);
}

source = readFileSync(panel,"utf8");
if (!source.includes("useBotBrief(")) {
  source = 'import { useBotBrief, BotBriefFields } from "../CrdBotBrief";\n' +
    'import { CrdAvatarPicker } from "../CrdAvatarPicker";\n' + source;
  replaceOne('  const [newBotInstructions,setNewBotInstructions] = useState("");',
    '  const brief = useBotBrief(name,title,description);');
  replaceOne("if (!name.trim() || submitting) return;", "if (!name.trim() || !brief.ready || submitting) return;");
  replaceOne("disabled={!name.trim() || submitting}", "disabled={!name.trim() || !brief.ready || submitting}");
  replaceOne("instructions:newBotInstructions.trim(),","instructions:brief.instructions.trim(),");
  replaceThrough('      <label className={fieldLabelClass}>Instructions · คำสั่งประจำบอต',
    '      <div data-testid="create-bot-computer">',
    '      <BotBriefFields scope={description} onScope={setDescription} brief={brief}/>\n      <div data-testid="create-bot-computer">');
  replaceOne("export function BotSettings({\n  bot,", "export function BotSettings({\n  bot,\n  portraitUserId,");
  replaceOne("  memoryProviderConfigured: boolean;", "  portraitUserId?: string;\n  memoryProviderConfigured: boolean;");
  replaceOne('        <Trans>Color</Trans>', '        <CrdAvatarPicker botId={bot.id} user={portraitUserId}/>\n        <Trans>Color</Trans>');
  source = source.replaceAll("identity={bot.name}", "identity={bot.id}");
  writeFileSync(panel,source);
}

source = readFileSync(onboarding,"utf8");
if (!source.includes("useBotBrief(")) {
  source = 'import { useBotBrief, BotBriefFields } from "./CrdBotBrief";\n' + source;
  replaceOne('  const [description, setDescription] = useState("");',
    '  const [description, setDescription] = useState("");\n  const brief = useBotBrief(name,title,description);');
  replaceOne("    if (creatingBot.current) return;", "    if (creatingBot.current || !brief.ready) return;");
  replaceOne("          instructions: description,", "          instructions: brief.instructions.trim(),");
  replaceOne("      createdBot.current = bot;", "      createdBot.current = bot;\n      await rpc.bots.update({botId:bot.id, memoryScope:'isolated', instructions:brief.instructions.trim(), description:description.trim()});");
  replaceOne("disabled={creating || !name.trim()}", "disabled={creating || !name.trim() || !brief.ready}");
  const scopeLabel = '            <label\n              htmlFor={' + '`' + '${fieldId}-description' + '`' + '}';
  replaceThrough(scopeLabel, "            </label>", "            <BotBriefFields scope={description} onScope={setDescription} brief={brief}/>");
  writeFileSync(onboarding,source);
}
