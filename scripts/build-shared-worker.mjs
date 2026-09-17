import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const assetFiles={
  '/index.html':'dist/index.html',
  '/style.css':'dist/style.css',
  '/app-clean.mjs':'dist/app-clean.mjs',
  '/app.mjs':'dist/app.mjs',
  '/batch7.mjs':'dist/batch7.mjs',
  '/evaluation.mjs':'dist/evaluation.mjs'
};
const assets={};
for(const [route,file] of Object.entries(assetFiles))assets[route]=Buffer.from(await readFile(resolve(root,file))).toString('base64');
const worker=`const assets=${JSON.stringify(assets)};
const headers={"content-type":"application/json; charset=utf-8","cache-control":"no-store"};
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
const libraryId="open-studio";
async function readLibrary(DB){const row=await DB.prepare("SELECT payload, revision FROM shared_library WHERE id = ?").bind(libraryId).first();return row?{payload:JSON.parse(row.payload),revision:Number(row.revision)||0}:{payload:null,revision:0}}
export default {async fetch(request,env){const url=new URL(request.url);if(url.pathname==="/api/shared-library"){if(!env.DB)return reply({error:"shared library unavailable"},503);if(request.method==="GET")return reply(await readLibrary(env.DB));if(request.method==="PUT"){let input;try{input=await request.json()}catch{return reply({error:"invalid library payload"},400)}if(!input||typeof input.payload!=="object"||JSON.stringify(input.payload).length>4000000)return reply({error:"invalid library payload"},400);const expected=Number(input.revision)||0;const current=await readLibrary(env.DB);if(current.revision!==expected)return reply(current,409);const next=expected+1,payload=JSON.stringify(input.payload);if(!current.payload){try{await env.DB.prepare("INSERT INTO shared_library (id, payload, revision) VALUES (?, ?, ?)").bind(libraryId,payload,next).run()}catch{return reply(await readLibrary(env.DB),409)}}else{const result=await env.DB.prepare("UPDATE shared_library SET payload = ?, revision = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND revision = ?").bind(payload,next,libraryId,expected).run();if(!result.meta.changes)return reply(await readLibrary(env.DB),409)}return reply({revision:next})}return reply({error:"method not allowed"},405)}const route=url.pathname==="/"?"/index.html":url.pathname;const asset=assets[route];if(!asset)return new Response("Not found",{status:404});const type=route.endsWith(".html")?"text/html; charset=utf-8":route.endsWith(".css")?"text/css; charset=utf-8":"text/javascript; charset=utf-8";return new Response(Uint8Array.from(atob(asset),c=>c.charCodeAt(0)),{headers:{"content-type":type}})}};
`;
await mkdir(resolve(root,'dist/server'),{recursive:true});
await writeFile(resolve(root,'dist/server/index.js'),worker);
