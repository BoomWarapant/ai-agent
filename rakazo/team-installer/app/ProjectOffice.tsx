import { useContext, useEffect, useRef, useState } from "react";
import { CrdPortraitContext } from "@rakazo/ui-web";
import type { Bot } from "@rakazo/contracts";
import { setUiAppearance } from "../lib/ui-appearance";
import release from "./crd-version.json";

const themeKey = "crd-office-theme";
type Theme = "light" | "dark" | "earth";
function readTheme(): Theme {
  const value = localStorage.getItem(themeKey);
  if (value === "earth" || value === "dark" || value === "light") return value;
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function ProjectOffice({ bots, openBot, createBot, deleteBot }: { bots: Bot[]; openBot: (id: string) => void; createBot: () => void; deleteBot:(bot:Bot)=>void }) {
  const [visible, setVisible] = useState(false);
  const [theme, setTheme] = useState<Theme>(readTheme);
  useEffect(() => {
    const sync = (event: StorageEvent) => { if (event.key === themeKey) setTheme(readTheme()); };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.crdTheme = theme;
    if (localStorage.getItem(themeKey)) setUiAppearance(theme === "dark" ? "dark" : "light");
  }, [theme]);
  const dialog = useRef<HTMLDialogElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const portraits = useContext(CrdPortraitContext);

  function sendSnapshot() {
    const desks = bots.map(({ id, name, title, status, preview }) => ({ id, name, title, status, preview, portrait: portraits.get(id) }));
    frame.current?.contentWindow?.postMessage({ type: "crd-bots", bots: desks, theme }, window.location.origin);
  }
  useEffect(() => {
    if (!visible) return;
    dialog.current?.showModal();
    sendSnapshot();
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
      if (event.data?.type === "crd-create-bot") {dialog.current?.close();createBot();return;}
      if (event.data?.type === "crd-delete-bot") {
        const target=bots.find(b=>b.id===event.data.id);
        if (target) {dialog.current?.close();deleteBot(target);}
        return;
      }
      if (event.data?.type !== "crd-open-bot" || !bots.some(bot => bot.id === event.data.id)) return;
      dialog.current?.close();
      openBot(event.data.id);
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [bots, visible, openBot, createBot, deleteBot, theme, portraits]);

  return <>
    <style>{`
:root[data-crd-theme]{--font-sans:"Inter", "Segoe UI", "Leelawadee UI", Tahoma, sans-serif;font-family:var(--font-sans);font-variant-numeric:tabular-nums}body{font-family:var(--font-sans)}
:root[data-crd-theme=earth]{--background:#f6f1e7;--foreground:#302e25;--sidebar:#eee7d9;--sidebar-foreground:#38372c;--sidebar-border:#d3c7b3;--card:#fffbf3;--card-foreground:#302e25;--popover:#fffbf3;--popover-foreground:#302e25;--primary:#395748;--primary-foreground:#fff;--accent:#dedfce;--accent-foreground:#293e32;--muted:#ece6da;--muted-foreground:#625e51;--sidebar-accent:#d9ddcd;--sidebar-accent-foreground:#293e32;--border:#d5cabb;--input:#c3b6a4;--chat-user:#e1e7d8;--chat-user-foreground:#2e4033}
.crd-controls{display:flex;align-items:center;gap:5px}.crd-controls>*{min-height:44px;border-radius:9px;padding:0 9px;font:inherit}.crd-controls select{background:var(--card);color:var(--foreground);border:1px solid var(--border)}.crd-controls button{background:var(--primary);color:var(--primary-foreground);font-weight:600}.crd-controls :focus-visible{outline:2px solid var(--ring);outline-offset:1px}
dialog.crd-office::backdrop{background:#101c24a6}dialog.crd-office{color:var(--foreground);border:1px solid var(--border);box-shadow:0 18px 64px #0004}.crd-dialog-head{display:flex;align-items:center;justify-content:space-between;padding:2px 14px;border-bottom:1px solid var(--border)}.crd-dialog-head button{min-height:44px}
@media(max-width:580px){.crd-controls{flex-wrap:wrap;gap:2px}.crd-controls>*{font-size:12px;padding:0 4px}}
    `}</style>
    <div className="crd-controls app-no-drag">
      <select aria-label="ธีมหน้าแชตและ 3D" value={theme} onChange={e=>{
        const value=e.target.value as Theme;localStorage.setItem(themeKey,value);setTheme(value);
      }}><option value="light">Light</option><option value="dark">Dark</option><option value="earth">Earth</option></select>
      <button type="button" title="เปิด 3D" onClick={() => setVisible(true)}>3D</button>
    </div>
    {visible && <dialog className="crd-office" ref={dialog} aria-label="มุมมอง 3D" onClose={() => setVisible(false)}
      style={{ margin: "auto", width: "min(1240px,98vw)", background: "var(--card)", borderRadius: 16 }}>
      <div className="crd-dialog-head"><strong>CRD 3D <small>v{release.version}</small></strong><button type="button" autoFocus className="app-no-drag" onClick={() => dialog.current?.close()}>ปิด 3D</button></div>
      <iframe ref={frame} title="โต๊ะทำงานของบอต" src="/project-office.html" onLoad={sendSnapshot}
        style={{ display:"block",width: "100%", height: "min(82vh,820px)", border: 0 }} />
    </dialog>}
  </>;
}
