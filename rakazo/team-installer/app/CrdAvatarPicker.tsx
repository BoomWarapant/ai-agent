import { useContext, useEffect, useMemo, useState } from "react";
import { chosenPortrait, CrdPortraitContext, makeCrdPortraits, portraitChoices } from "@rakazo/ui-web";

type BotIdentity = {id: string; name: string};
const changeEvent = "crd-avatar-changed";
function key(user: string, id: string) {
  return "crd:portrait:" + encodeURIComponent(user) + ":" + encodeURIComponent(id);
}
function read(user: string | undefined, id: string) {
  try { return user ? localStorage.getItem(key(user,id)) ?? "" : ""; }
  catch { return ""; }
}

export function usePortraitDirectory(user: string | undefined, bots: BotIdentity[],
  spaces: ReadonlyArray<{bots: readonly BotIdentity[]}>, archived: BotIdentity[]) {
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const refresh = () => setRevision(n => n + 1);
    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key.startsWith("crd:portrait:")) refresh();
    };
    window.addEventListener(changeEvent,refresh);
    window.addEventListener("storage",onStorage);
    return () => { window.removeEventListener(changeEvent,refresh); window.removeEventListener("storage",onStorage); };
  }, []);
  return useMemo(() => {
    const roster = [...bots,...spaces.flatMap(space=>space.bots),...archived];
    const choices = new Map<string,string>();
    for (const bot of roster) {
      const value = read(user,bot.id);
      if (chosenPortrait(bot.id,value)) choices.set(bot.id,value);
    }
    return makeCrdPortraits(roster, choices);
  }, [user,bots,spaces,archived,revision]);
}

export function CrdAvatarPicker({botId,user}: {botId: string; user?: string}) {
  const portraits = useContext(CrdPortraitContext);
  const current = portraits.get(botId);
  const used = new Set(portraits.values());
  const [error,setError] = useState("");
  return <label className="mt-4 block text-sm">อวตารบนเครื่องนี้
    <select className="mt-2 block rounded-md border bg-background p-2"
      value={read(user,botId)} disabled={!user} onChange={e => {
        if (!user) return;
        try {
          const choice = e.target.value;
          if (choice) localStorage.setItem(key(user,botId),choice);
          else localStorage.removeItem(key(user,botId));
          setError(""); window.dispatchEvent(new Event(changeEvent));
        } catch {setError("บันทึกอวตารในเบราว์เซอร์นี้ไม่ได้ครับ");}
      }}>
      <option value="">อัตโนมัติ</option>
      {portraitChoices.map(([value,label]) => {
        const image = chosenPortrait(botId,value)!;
        const taken = image !== current && used.has(image);
        return <option key={value} value={value} disabled={taken}>{label}{taken ? " · มีบอตใช้อยู่" : ""}</option>;
      })}
    </select>
    {error && <span role="alert">{error}</span>}
  </label>;
}
