import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect} from 'vitest';
import {BotAvatar} from './bot-avatar.js';
describe('portable team avatars',()=>{
 for(const [name,role,accessory] of [['neo','engineer','hard-hat'],['swift','quick','headset-lightning']]) {
  it(name+' uses its role on a new installation',()=>{
   for(const size of [16,26,64]) {
    const html=renderToStaticMarkup(<BotAvatar identity={name} color="#AA55EE" size={size} variant="robot" status="running"/>);
    expect(html).toContain('data-cat-role="'+role+'"');
    expect(html).toContain('data-cat-accessory="'+accessory+'"');
    expect(html).toContain('data-working="true"');
   }
  });
 }
});