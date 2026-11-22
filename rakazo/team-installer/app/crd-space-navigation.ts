import { clearSpaceSelection, selectSpace } from "../lib/rpc";

const chatRoute = /^\/app(?:\/(?:g\/)?[\w-]+)?$/;
const emptyChatList = "/app?view=chats";

export function spaceEntryPath(destination: "/app" | "/onboarding", spaceId?: string | null) {
  const current = new URLSearchParams(window.location.search);
  const params = new URLSearchParams();
  if (destination === "/app") params.set("view", "chats");
  const previous = current.get("returnSpace") || spaceId;
  if (previous) {
    params.set("returnSpace", previous);
    const path = current.get("returnChat") || window.location.pathname;
    params.set("returnChat", chatRoute.test(path) ? path : "/app");
  }
  return params.size ? destination + "?" + params.toString() : destination;
}

export function returnToCrdChat() {
  const params = new URLSearchParams(window.location.search);
  const spaceId = params.get("returnSpace");
  const path = params.get("returnChat") || "/app";
  if (spaceId && selectSpace(spaceId)) {
    window.location.replace(chatRoute.test(path) && path !== "/app" ? path : emptyChatList);
    return;
  }
  // A previously opened setup page has no return link. Use the account's default space.
  clearSpaceSelection();
  window.location.replace(emptyChatList);
}
