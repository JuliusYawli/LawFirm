import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
test('form cannot leak contact data into a URL when JavaScript is unavailable',async()=>{
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 assert.match(html,/<form[^>]*id="request-form"[^>]*method="post"[^>]*action="\/api\/requests"/);
 assert.match(html,/<noscript>/);
 assert.match(html,/<button[^>]*id="submit-request"[^>]*disabled/);
});
test('main sections follow navigation order and consultation resources stay within approach',async()=>{
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 const ids=['atuacao','sobre-nos','localizacao','contato'];
 const positions=ids.map(id=>html.indexOf(`id="${id}"`));
 assert.ok(positions.every((position,i)=>position>=0&&(i===0||position>positions[i-1])), 'Section order must follow the menu');
 assert.ok(html.indexOf('id="preparacao"')<html.indexOf('id="sobre-nos"'),'Preparation belongs with approach');
});
