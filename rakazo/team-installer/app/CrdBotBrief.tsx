import { useEffect, useId, useRef, useState } from "react";
import { BOT_DESCRIPTION_MAX_LENGTH, BOT_INSTRUCTIONS_MAX_LENGTH } from "@rakazo/contracts";
import { Button, Textarea } from "@rakazo/ui-web";
import { rpc } from "../lib/rpc";

export function draftInstructions(name: string, title: string, scope: string) {
  if (!scope.trim()) return "";
  const role = [name.trim(), title.trim()].filter(Boolean).join(" · ");
  return [
    role ? "บทบาท: " + role : "บทบาท: ผู้ช่วยประจำโครงการ",
    "ขอบเขตงานที่ได้รับมอบหมาย:\n" + scope.trim(),
    "ก่อนลงมือ ให้ระบุโครงการและผลลัพธ์ที่ผู้ใช้ต้องการ หากข้อมูลสำคัญขาด ให้ถามเฉพาะสิ่งที่จำเป็น",
    "ตรวจข้อมูลตามขอบเขตงาน แยกข้อเท็จจริงจากข้อสมมติ และระบุประเด็นที่ต้องให้ผู้ใช้ตัดสินใจ",
    "สรุปผลเป็นภาษาไทย พร้อมสิ่งที่ต้องติดตามและกำหนดเวลาที่ทราบ แสดงหลักฐานเมื่อผู้ใช้ขอ",
    "อ่าน MEMORY.md ของบอตเมื่อเกี่ยวข้อง และบันทึกการตัดสินใจที่ยืนยันแล้วพร้อมชื่อโครงการ โดยเว้นข้อมูลลับ",
  ].join("\n\n");
}

export function useBotBrief(name: string, title: string, scope: string) {
  const [edited, setEdited] = useState<string | null>(null);
  const instructions = edited ?? draftInstructions(name, title, scope);
  return { instructions, edited, setEdited, ready: Boolean(scope.trim() && instructions.trim()) };
}

export function BotBriefFields({scope, onScope, brief}: {
  scope: string; onScope: (value: string) => void; brief: ReturnType<typeof useBotBrief>;
}) {
  const id = useId();
  return <div className="mt-4 space-y-3">
    <label className="block text-sm" htmlFor={id + "-scope"}>ขอบเขตงานของบอต
      <Textarea id={id + "-scope"} required maxLength={BOT_DESCRIPTION_MAX_LENGTH}
        placeholder="เช่น ตรวจงวดงานเทียบ BOQ ทุกสัปดาห์ และสรุปรายการที่ต้องตรวจซ้ำ"
        rows={3} className="mt-2" value={scope} onChange={e => onScope(e.target.value)} />
    </label>
    <label className="block text-sm" htmlFor={id + "-instructions"}>Instructions · แก้ไขได้
      <Textarea id={id + "-instructions"} required maxLength={BOT_INSTRUCTIONS_MAX_LENGTH}
        placeholder="กรอกขอบเขตงานเพื่อสร้างร่างคำสั่งครับ" rows={6} className="mt-2"
        value={brief.instructions} onChange={e => brief.setEdited(e.target.value)} />
    </label>
    {brief.edited !== null && <button type="button" className="text-sm underline"
      onClick={() => brief.setEdited(null)}>ใช้ร่างจากขอบเขตงานล่าสุด</button>}
  </div>;
}

export function DuplicateBotBrief({bot, onCancel, onDone}: {
  bot: {id: string; title: string}; onCancel: () => void; onDone: (id: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const copyId = useRef<string | null>(null);
  const pending = useRef(false);
  const [scope, setScope] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const brief = useBotBrief("", bot.title, scope);
  useEffect(() => { dialog.current?.showModal(); }, []);
  async function save() {
    if (pending.current || !brief.ready) return;
    pending.current = true; setBusy(true); setError("");
    try {
      if (!copyId.current) copyId.current = (await rpc.bots.duplicate({botId:bot.id})).id;
      await rpc.bots.update({botId:copyId.current, description:scope.trim(),
        instructions:brief.instructions.trim(), memoryScope:"isolated"});
      onDone(copyId.current);
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ กรุณาลองอีกครั้งครับ");
    } finally { pending.current = false; setBusy(false); }
  }
  return <dialog ref={dialog} aria-label="ขอบเขตงานของบอตสำเนา"
    onCancel={e => { e.preventDefault(); if (!busy) onCancel(); }}
    className="m-auto max-h-[90vh] w-[min(92vw,32rem)] overflow-auto rounded-xl bg-background p-5 text-foreground backdrop:bg-black/50">
    <h2>สร้างสำเนาบอต</h2><BotBriefFields scope={scope} onScope={setScope} brief={brief}/>
    {error && <p role="alert">{error}</p>}
    <div className="mt-4 flex gap-2"><Button disabled={!brief.ready || busy} onClick={save}>บันทึกสำเนา</Button>
      <Button variant="ghost" disabled={busy} onClick={onCancel}>ปิด</Button></div>
  </dialog>;
}
