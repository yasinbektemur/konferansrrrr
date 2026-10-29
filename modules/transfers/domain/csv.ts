export type CsvRecord={line:number;cells:string[]};
const formula=/^[\s]*[=+\-@＝＋－＠]|^[\t\r\n]/;
export function writeCsv(rows:readonly (readonly string[])[]){
 return '\ufeff'+rows.map(row=>row.map(value=>{const text=formula.test(value)?"'"+value:value;return '"'+text.replaceAll('"','""')+'"';}).join(',')).join('\r\n');
}
export function parseCsv(raw:string):{records:CsvRecord[];delimiter:string}{
 const text=raw.replace(/^\ufeff/,'');if(text.includes('\0'))throw Error('Dosyada geçersiz karakter var. UTF-8 CSV olarak yeniden kaydedin.');
 const first=text.split(/\r?\n/)[0]??'',delimiter=first.split(';').length>first.split(',').length?';':',';
 const records:CsvRecord[]=[];let cells:string[]=[],cell='',quoted=false,closed=false,line=1,start=1;
 function finishCell(){cells.push(cell.startsWith("'")&&formula.test(cell.slice(1))?cell.slice(1):cell);cell='';closed=false;}
 function finishRow(){finishCell();if(cells.some(c=>c.trim()))records.push({line:start,cells});cells=[];start=line+1;}
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(quoted){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++;}else{quoted=false;closed=true;}}else{cell+=c;if(c==='\n')line++;}continue;}
  if(c==='"'){if(cell||closed)throw Error(`Satır ${line}: beklenmeyen tırnak. Tırnak içindeki tırnakları çift yazın.`);quoted=true;}
  else if(c===delimiter)finishCell();
  else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;finishRow();line++;}
  else{if(closed)throw Error(`Satır ${line}: kapanan tırnaktan sonra ayraç bekleniyor.`);cell+=c;}
 }
 if(quoted)throw Error(`Satır ${start}: kapanmayan tırnak var. Metni çift tırnakla kapatın.`);
 if(cell||cells.length||closed)finishRow();
 return {records,delimiter};
}
