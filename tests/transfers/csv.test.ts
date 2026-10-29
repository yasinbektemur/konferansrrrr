import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseCsv,writeCsv} from '@/modules/transfers/domain/csv';
import {validateListingCsv,listingColumns} from '@/modules/transfers/domain/listing-csv';
const row=['CALL-001','Biyomedikal araştırma bursu','fellowship','Klinik yapay zekâ araştırmacılarına destek.','Klinik yapay zekâ alanındaki araştırma deneyiminizi paylaşarak başvurun.','online','https://example.org/call','2099-12-01','external'];
test('CSV round trip preserves quoted delimiters, newlines, Unicode and formula-like text',()=>{
 const rows=[['başlık','açıklama'],['Türkçe, "çağrı"','İlk satır\nİkinci satır'],['=SUM(1,2)','@test']];
 assert.deepEqual(parseCsv(writeCsv(rows)).records.map(r=>r.cells),rows);
 assert.match(writeCsv([['=1+1']]),/"'=1\+1"/);
 assert.deepEqual(parseCsv('\ufeffa;b\r\n"x;y";z').records.map(r=>r.cells),[['a','b'],['x;y','z']]);
 assert.throws(()=>parseCsv('a,b\n"eksik,b'),/tırnak/);
 assert.throws(()=>parseCsv('a,b\nx"y,z'),/tırnak/);
});
test('CSV validates headers, calendar dates, enums and all bad rows with fix guidance',()=>{
 assert.equal(validateListingCsv(writeCsv([listingColumns.map(c=>c.key),row])).issues.length,0);
 const invalid=[...row];invalid[7]='2099-02-30';invalid[5]='remote';invalid[6]='javascript:alert(1)';
 const report=validateListingCsv(writeCsv([listingColumns.map(c=>c.key),invalid,row,row]));
 assert.ok(report.issues.some(e=>e.line===2&&e.column==='deadline'&&e.hint));
 assert.ok(report.issues.some(e=>e.column==='attendance_mode'));
 assert.ok(report.issues.some(e=>e.line===4&&e.column==='reference'));
 const header:string[]=listingColumns.map(c=>c.key);header[0]='unknown';
 assert.ok(validateListingCsv(writeCsv([header,row])).issues.some(e=>e.column==='unknown'));
 assert.ok(validateListingCsv(writeCsv([header,row])).issues.some(e=>e.column==='reference'));
});
