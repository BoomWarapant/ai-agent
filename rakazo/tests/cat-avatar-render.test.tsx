import { writeFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BotAvatar } from './bot-avatar.js';
const bots = [
  ['neo', 'cmut5h18c000531nvcm72vv0x', '#F2622A', 'engineer', 'hard-hat', 'Construction coordinator'],
  ['swift', 'cmutqywdy000431pbt2vp7l8m', '#2E9E6A', 'quick', 'headset-lightning', 'Fast answers and search'],
  ['Research Analyst', 'cmutcy2c4000431nvq6z5gt3s', '#3EC5A8', 'analyst', 'glasses-magnifier', 'Evidence and analysis'],
  ['Research Reviewer', 'cmutd3pxr000g31nvd4ya2q4r', '#F5A03C', 'reviewer', 'glasses-checklist', 'Quality and fact checks'],
];
describe('CRD robot cat role render', () => {
  for (const [name, identity, color, role, accessory] of bots) {
    it(`${name} keeps its role after changing color and at small sizes`, () => {
      for (const size of [16, 26, 38, 64]) {
        const html = renderToStaticMarkup(<BotAvatar identity={identity} color={color} size={size} status="running" variant="robot" />);
        expect(html).toContain(`data-cat-role="${role}"`);
        expect(html).toContain(`data-cat-accessory="${accessory}"`);
        expect(html).toContain('rakazo-bot-avatar-ring');
        expect(html).toContain('data-working="true"');
      }
      const changed = renderToStaticMarkup(<BotAvatar identity={identity} color="#AA55EE" variant="robot" />);
      expect(changed).toContain(`data-cat-role="${role}"`);
    });
  }
  it('exports the exact rendered SVGs for visual inspection', () => {
    const tiles = bots.map(([name, identity, color, role, , title], index) => {
      const html = renderToStaticMarkup(<BotAvatar identity={identity} color={color} size={256} variant="robot" />);
      const body = [...html.matchAll(/<svg\b[^>]*>([\s\S]*?)<\/svg>/g)][1][1];
      writeFileSync(`/output/${role}-cat.svg`, `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 64 64">${body}</svg>`);
      return `<g transform="translate(${24 + index*280},24)"><rect width="264" height="344" rx="20" fill="#FFFFFF" stroke="#E0E8E9"/><circle cx="132" cy="130" r="96" fill="${color}" opacity="0.08"/><svg x="40" y="38" width="184" height="184" viewBox="0 0 64 64">${body}</svg><text x="132" y="270" text-anchor="middle" fill="#223744" font-family="Segoe UI, sans-serif" font-size="20" font-weight="700">${name}</text><text x="132" y="301" text-anchor="middle" fill="#6E7F88" font-family="Segoe UI, sans-serif" font-size="14">${title}</text></g>`;
    });
    writeFileSync('/output/robot-cats-preview.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="1168" height="392" viewBox="0 0 1168 392"><rect width="1168" height="392" fill="#F2F6F7"/>${tiles.join('')}</svg>`);
  });
});