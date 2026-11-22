import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect} from 'vitest';
import {BotAvatar} from './bot-avatar.js';
import {makeCrdPortraits} from './crd-portraits.js';
describe('portable team avatars',()=>{
 for(const name of ['neo','swift','civil','arch','mep','scout','qs']) {
  it(name+' has its own animal portrait',()=>{
   for(const size of [16,26,64]) {
    const html=renderToStaticMarkup(<BotAvatar identity={name} color="#AA55EE" size={size} variant="robot" status="running"/>);
    expect(html).toContain('/crd-avatars/'+name+'.png');
    expect(html).toContain('data-working="true"');
   }
  });
 }
 it('keeps duplicate display names distinct and stable when reordered',()=>{
   const bots=[{id:'a',name:'Neo'},{id:'b',name:'neo'},{id:'c',name:'ผู้ช่วย'},{id:'d',name:'ผู้ช่วย'}];
   const portraits=makeCrdPortraits(bots);
   expect(new Set(bots.map(b=>portraits.get(b.id))).size).toBe(bots.length);
   expect(portraits).toEqual(makeCrdPortraits([...bots].reverse()));
 });
});
