import {useEffect, useRef, useState} from "react";
import {Button, Input} from "@rakazo/ui-web";
import {rpc} from "../lib/rpc";

type SpaceName = {id: string; name: string};
export function RenameSpaceDialog({spaces, initial, onClose, onSaved}: {
  spaces: SpaceName[]; initial: SpaceName; onClose: () => void; onSaved: (space: SpaceName) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [target, setTarget] = useState(initial);
  const [name, setName] = useState(initial.name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {dialog.current?.showModal();}, []);
  const trimmed = name.trim();
  const valid = trimmed.length > 0 && trimmed.length <= 60 && trimmed !== target.name;
  async function save() {
    if (busy || !valid) return;
    setBusy(true); setError("");
    try { onSaved(await rpc.spaces.rename({spaceId:target.id, previousName:target.name, name:trimmed}, {context:{spaceId:target.id}})); }
    catch (err) { setError(err instanceof Error ? err.message : "บันทึกชื่อ Space ไม่สำเร็จครับ"); setBusy(false); }
  }
  return <dialog ref={dialog} aria-label="เปลี่ยนชื่อ Space" className="m-auto w-[min(92vw,25rem)] rounded-xl bg-background p-5 text-foreground backdrop:bg-black/50"
    onCancel={e=>{e.preventDefault(); if(!busy) onClose();}}>
    <form onSubmit={e=>{e.preventDefault();void save();}} className="space-y-4">
      <h2 className="font-semibold">เปลี่ยนชื่อ Space</h2>
      <label className="block text-sm">Space
        <select className="mt-1 block w-full rounded-md border bg-background p-2" disabled={busy} value={target.id}
          onChange={e=>{const next=spaces.find(s=>s.id===e.target.value);if(next){setTarget(next);setName(next.name);setError("");}}}>
          {spaces.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </label>
      <label className="block text-sm">ชื่อใหม่<Input autoFocus required maxLength={60} disabled={busy} value={name} onChange={e=>setName(e.target.value)} /></label>
      {error && <p role="alert" className="text-destructive">{error}</p>}
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={busy} onClick={onClose}>ยกเลิก</Button>
        <Button type="submit" disabled={!valid || busy}>บันทึก</Button></div>
    </form>
  </dialog>;
}

type Contents = Awaited<ReturnType<typeof rpc.spaces.deletionContents>>;
type Item = Contents["items"][number];

export function DeleteSpaceDialog({space, onClose, onDeleted}: {
  space: SpaceName; onClose: () => void; onDeleted: (activeSpaceId: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [contents, setContents] = useState<Contents | null>(null);
  const [selected, setSelected] = useState<Item | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {dialog.current?.showModal();}, []);
  useEffect(() => {
    let mounted = true;
    rpc.spaces.deletionContents({spaceId:space.id}).then(data => {
      if (mounted) setContents(data);
    }).catch(err => {if (mounted) setError(err.message || "อ่านรายการใน Space ไม่สำเร็จครับ");});
    return () => {mounted = false;};
  }, [space.id, revision]);

  async function remove() {
    if (!contents || busy) return;
    setBusy(true);
    setError("");
    try {
      if (!selected) {
        if (contents.items.length) return;
        const result = await rpc.spaces.remove({spaceId:space.id}, {context:{spaceId:space.id}});
        onDeleted(result.activeSpaceId);
        return;
      }
      const latest = await rpc.spaces.deletionContents({spaceId:space.id});
      const exists = latest.items.some(item => item.id === selected.id && item.kind === selected.kind &&
        item.name === selected.name && item.archived === selected.archived);
      if (!latest.canRemoveItems || !exists) throw new Error("รายการหรือสิทธิ์เปลี่ยนแล้ว กรุณาตรวจรายการอีกครั้งครับ");
      if (selected.kind === "bot" && latest.items.some(item => item.kind === "group"))
        throw new Error("กรุณาลบ Meeting Room ก่อนลบบอตที่เป็นสมาชิกครับ");
      const options = {context: {spaceId:space.id}};
      if (selected.kind === "group") await rpc.groups.remove({groupId:selected.id}, options);
      else await rpc.bots.remove({botId:selected.id, deleteMemories:true}, options);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ลบไม่สำเร็จครับ");
    } finally {
      setBusy(false);
      setSelected(null);
      setContents(null);
      setRevision(n => n + 1);
    }
  }
  return <dialog ref={dialog} aria-label={"ลบ Space " + space.name}
    className="m-auto w-[min(92vw,28rem)] rounded-xl bg-background p-5 text-foreground backdrop:bg-black/50"
    onCancel={event => {event.preventDefault(); if (!busy) onClose();}}>
    <h2 className="font-semibold">ลบ Space · {space.name}</h2>
    {error && <p role="alert" className="my-2 text-destructive">{error}</p>}
    {!contents && !error && <p role="status" className="my-3">กำลังอ่านรายการใน Space…</p>}
    {contents && contents.items.length > 0 && <>
      <p className="my-3 text-sm">ต้องลบรายการเหล่านี้ก่อนจึงจะลบ Space ได้ครับ</p>
      {contents.items.some(item => item.kind === "group") && contents.items.some(item => item.kind === "bot") &&
        <p className="text-sm">ลบ Meeting Room ก่อน แล้วจึงลบบอตครับ</p>}
      {!contents.canRemoveItems && <p className="text-sm">Space นี้มีสมาชิกหลายคน กรุณาจัดการรายการจากหน้าของแต่ละบอตหรือห้องครับ</p>}
      <ul className="max-h-[40vh] overflow-y-auto">{contents.items.map(item =>
        <li key={item.kind + item.id} className="flex items-center justify-between gap-3 border-b py-2">
          <span>{item.name}<small className="block text-muted-foreground">{item.kind === "group" ? "Meeting Room" : "Bot"} · {item.archived ? "เก็บเข้าคลังแล้ว" : "ใช้งานอยู่"}</small></span>
          <Button type="button" variant="outline" disabled={busy || !contents.canRemoveItems ||
              (item.kind === "bot" && contents.items.some(row => row.kind === "group"))}
            onClick={() => {setSelected(item); setError("");}}>เลือกลบ</Button>
        </li>)}</ul>
    </>}
    {selected && <p role="alert" className="my-3 text-sm">การลบ {selected.name} จะลบประวัติแชต{selected.kind === "bot" ? " ไฟล์ และความจำของบอตนี้" : "และไฟล์ของห้องนี้"} อย่างถาวรครับ</p>}
    {contents?.items.length === 0 && <p className="my-3 text-sm">ไม่มีบอตหรือ Meeting Room เหลืออยู่ครับ การยืนยันจะลบ Space และข้อมูลที่เหลือใน Space นี้อย่างถาวรครับ</p>}
    <div className="mt-4 flex flex-wrap justify-end gap-2">
      <Button type="button" variant="outline" disabled={busy} onClick={() => selected ? setSelected(null) : onClose()}>ยกเลิก</Button>
      {!contents && error && <Button type="button" disabled={busy} onClick={() => {setError(""); setRevision(n => n+1);}}>ลองอีกครั้ง</Button>}
      {(selected || contents?.items.length === 0) && <Button type="button" variant="destructive" disabled={busy} onClick={() => void remove()}>
        {busy ? "กำลังลบ…" : selected ? "ยืนยันลบ " + selected.name : "ยืนยันลบ Space"}</Button>}
    </div>
  </dialog>;
}
