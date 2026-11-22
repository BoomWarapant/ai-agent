import { createContext } from "react";

export const CrdPortraitContext = createContext<ReadonlyMap<string, string>>(new Map());
const team = new Set(["neo", "swift", "civil", "arch", "mep", "scout", "qs"]);

const ears = [
  '<circle cx="15" cy="21" r="9"/><circle cx="49" cy="21" r="9"/>',
  '<path d="M10 33L7 7Q11 5 28 19M54 33L57 7Q53 5 36 19"/>',
  '<ellipse cx="22" cy="17" rx="6" ry="15" transform="rotate(-12 22 17)"/><ellipse cx="42" cy="17" rx="6" ry="15" transform="rotate(12 42 17)"/>',
  '<ellipse cx="11" cy="33" rx="7" ry="14"/><ellipse cx="53" cy="33" rx="7" ry="14"/>',
];

function animalPortrait(id: string, earStyle?: number) {
  let seed = 2166136261;
  for (const char of id) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619) >>> 0;
  const hue = seed % 360;
  const eye = 2.4 + ((seed >>> 17) % 4) / 2;
  const spot = 5 + ((seed >>> 23) % 8);
  const fur = `hsl(${hue},42%,${45 + (seed >>> 11) % 17}%)`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <rect width="64" height="64" fill="hsl(${hue},48%,84%)"/>
    <g fill="${fur}" stroke="#493c46" stroke-width="1.6" stroke-linejoin="round">
      ${ears[earStyle ?? ((seed >>> 7) % ears.length)]}<ellipse cx="32" cy="37" rx="24" ry="21"/></g>
    <ellipse cx="22" cy="34" rx="${spot}" ry="9" fill="white" opacity=".26"/>
    <g fill="#342e39"><circle cx="22" cy="34" r="${eye}"/><circle cx="42" cy="34" r="${eye}"/></g>
    <ellipse cx="32" cy="46" rx="13" ry="9" fill="#ffebab"/>
    <path d="M28 42Q32 39 36 42L32 46Z" fill="#443342"/>
    <path d="M32 46q-3 5-6 1m6-1q3 5 6 1" fill="none" stroke="#705456" stroke-width="1.5" stroke-linecap="round"/></svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

export function defaultCrdPortrait(identity: string) {
  const role = identity.trim().toLowerCase();
  return team.has(role) ? "/crd-avatars/" + role + ".png" : animalPortrait(identity);
}

export const portraitChoices = [
  ["neo","แมว"],["swift","เหยี่ยว"],["civil","บีเวอร์"],["arch","สุนัขจิ้งจอก"],
  ["mep","กบ"],["scout","แพนด้าแดง"],["qs","นกฮูก"],
  ["bear","หมี"],["kitten","แมวหูแหลม"],["rabbit","กระต่าย"],["puppy","สุนัขหูตก"],
] as const;
const otherSpecies = ["bear","kitten","rabbit","puppy"];

export function chosenPortrait(id: string, choice: string) {
  if (team.has(choice)) return defaultCrdPortrait(choice);
  const style = otherSpecies.indexOf(choice);
  return style < 0 ? undefined : animalPortrait(id + ":" + choice, style);
}

export function makeCrdPortraits(roster: ReadonlyArray<{id: string; name: string}>, choices: ReadonlyMap<string,string> = new Map()) {
  const portraits = new Map<string, string>();
  const used = new Set<string>();
  const ordered = [...new Map(roster.map(bot => [bot.id, bot] as const)).values()]
    .sort((a,b) => Number(choices.has(b.id)) - Number(choices.has(a.id)) || a.id.localeCompare(b.id));
  for (const bot of ordered) {
    let url = chosenPortrait(bot.id, choices.get(bot.id) ?? "") ??
      (team.has(bot.name.trim().toLowerCase()) ? defaultCrdPortrait(bot.name) : animalPortrait(bot.id));
    for (let variant = 1; used.has(url); variant++) url = animalPortrait(bot.id + ":" + variant);
    portraits.set(bot.id, url);
    used.add(url);
  }
  // Older clients also identify some portraits by display name.
  for (const bot of ordered) {
    if (!portraits.has(bot.name)) portraits.set(bot.name, portraits.get(bot.id)!);
  }
  return portraits;
}
