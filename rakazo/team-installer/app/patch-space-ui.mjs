import {readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const root = process.argv[2] ?? "/app/apps/web/src/pages";
function patch(file, edits) {
  const path = join(root, file);
  const original = readFileSync(path, "utf8");
  let source = original;
  for (const [before, after] of edits) {
    if (source.includes(after)) continue;
    if (source.split(before).length !== 2) throw new Error("Unsupported UI in " + file + ": " + before);
    source = source.replace(before, () => after);
  }
  if (source !== original) writeFileSync(path, source);
}

patch("Shell.tsx", [
  ['  const [spaceMenu,', '  const [renameSpace, setRenameSpace] = useState<Space | null>(null);\n  const [spaceMenu,'],
]);
const shell = join(root, "Shell.tsx");
const renameImport = 'import { RenameSpaceDialog } from "./RenameSpaceDialog";';
if (!readFileSync(shell, "utf8").includes(renameImport)) {
  writeFileSync(shell, renameImport + "\n" + readFileSync(shell, "utf8"));
}
patch("Shell.tsx", [
  ["const showSpaceNames = sidebarSpaces.length > 1;", "const showSpaceNames = sidebarSpaces.length > 0;"],
  ["onCreateSpace={() => {", `onRenameSpace={() => {
                      setCreateMenuOpen(false);
                      setMobileSidebarOpen(false);
                      setRenameSpace(spaces.find(s => s.id === bootstrapMe?.spaceId) ?? spaces[0] ?? null);
                    }}
                    onCreateSpace={() => {`],
  ["        {newSpaceOpen ? (", `        {renameSpace && <RenameSpaceDialog initial={renameSpace} spaces={spaces} onClose={() => setRenameSpace(null)}
          onSaved={updated => {
            setSpaces(current => current.map(s => s.id === updated.id ? {...s, name: updated.name} : s));
            setRenameSpace(null);
            void refreshBots().catch(() => undefined);
          }} />}
        {newSpaceOpen ? (`],
]);
patch("shell/bot-picker.tsx", [
  ["  onCreateSpace,", "  onRenameSpace,\n  onCreateSpace,"],
  ["  onCreateSpace: () => void;", "  onRenameSpace: () => void;\n  onCreateSpace: () => void;"],
  ["<Trans>Create new Group</Trans>", "Meeting Room"],
  ["aria-label={t`About groups`}", 'aria-label="About Meeting Rooms"'],
  ["title={t`About groups`}", 'title="About Meeting Rooms"'],
  ['            <CommandItem\n              value="create-space"', `            <CommandItem value="rename-space" data-testid="rename-space" onSelect={onRenameSpace}>
              เปลี่ยนชื่อ Space
            </CommandItem>
            <CommandItem
              value="create-space"`],
]);
patch("GroupPanel.tsx", [
  ["<Trans>New group</Trans>", '<span>Meeting Room</span>'],
  ["<Trans>Create group</Trans>", '<span>Create Meeting Room</span>'],
  ["t`Cancel new group`", '"Cancel new Meeting Room"'],
  ["t`Name this group`", '"Meeting Room name"'],
  ["t`Could not create group`", '"Could not create Meeting Room"'],
]);
patch("shell/dialogs.tsx", [
  ["<Trans>Groups</Trans>", "<span>Meeting Rooms</span>"],
  ["Name the group, pick its", "Name the meeting room, pick its"],
]);

// Install the visible sidebar action on both fresh builds and previously patched 1.0.1 clients.
const dialogStart = '          <DeleteItemDialog\n            item={deleteSpaceTarget}';
const dialogEnd = '              setDeleteSpaceTarget(null);';
const currentShell = readFileSync(shell, "utf8");
if (!currentShell.includes('<DeleteSpaceDialog key={deleteSpaceTarget.id}')) {
  const start = currentShell.indexOf(dialogStart);
  const end = currentShell.indexOf(dialogEnd, start);
  if (start < 0 || end < 0 || currentShell.indexOf(dialogStart, start + 1) >= 0)
    throw new Error("Unsupported Space delete dialog");
  const replacement = `          <DeleteSpaceDialog key={deleteSpaceTarget.id} space={deleteSpaceTarget}
            onClose={() => setDeleteSpaceTarget(null)}
            onDeleted={async activeSpaceId => {
              const targetId = deleteSpaceTarget.id;
`;
  writeFileSync(shell, currentShell.slice(0,start) + replacement + currentShell.slice(end));
}
patch("Shell.tsx", [
  ['import { RenameSpaceDialog }', 'import { DeleteSpaceDialog } from "./RenameSpaceDialog";\nimport { RenameSpaceDialog }'],
  ['if (selectSpace(result.activeSpaceId))', 'if (selectSpace(activeSpaceId))'],
  ['group.spaceId && !group.spaceIsDefault\n                              ? (event)', 'group.spaceId\n                              ? (event)'],
  ['<div className="pt-2">\n                        <button', '<div className="flex items-center gap-1 pt-2">\n                        <button'],
  ['                        </button>\n                      </div>\n                    ) : null}\n                    {!collapsed', `                        </button>
                        {group.spaceId && <button type="button"
                          aria-label={"จัดการ Space " + group.spaceName} title={"จัดการ Space " + group.spaceName}
                          className="shrink-0 rounded px-2 py-1 hover:bg-sidebar-accent focus-visible:outline"
                          onClick={event => {
                            const rect = event.currentTarget.getBoundingClientRect();
                            spaceMenuAnchor.current = event.currentTarget;
                            setSpaceMenu({id: group.spaceId as string, position:{x:rect.left,y:rect.bottom}});
                          }}>⋯</button>}
                      </div>
                    ) : null}
                    {!collapsed`],
  ['              <DropdownMenuItem\n                variant="destructive"\n                onClick={() => {\n                  const target = spaces.find((space) => space.id === spaceMenu.id);', `              <DropdownMenuItem onClick={() => {
                const target = spaces.find(space => space.id === spaceMenu.id);
                if (target) setRenameSpace(target);
                setSpaceMenu(null);
              }}>เปลี่ยนชื่อ Space</DropdownMenuItem>
              <DropdownMenuItem
                disabled={spaces.find(space => space.id === spaceMenu.id)?.isDefault}
                variant="destructive"
                onClick={() => {
                  const target = spaces.find((space) => space.id === spaceMenu.id);`],
  ['{t`Delete space`}', 'ลบ Space'],
]);
