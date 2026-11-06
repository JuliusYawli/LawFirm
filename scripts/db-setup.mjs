import { readFile } from 'node:fs/promises';
import { database } from '../lib/database.mjs';
const sql=database();
try {await sql.unsafe(await readFile(new URL('./schema.sql',import.meta.url),'utf8'));console.log('Database schema ready.')} finally {await sql.end()}
