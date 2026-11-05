/* Small, explicit SVG drawings using the same local-asset pattern as study figures. */
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ink='#213e45', green='#23745d', blue='#246eab', orange='#ae521f';
const text=(x,y,value,size=18,fill=ink,anchor='start')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="${anchor}">${escape(value)}</text>`;
const rect=(x,y,w,h,fill='#f1f6f4',stroke='#c6d6d5')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="${fill}" stroke="${stroke}"/>`;
const line=(x1,y1,x2,y2,color=ink,dash='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="2" ${dash?`stroke-dasharray="${dash}"`:''}/>`;
function wrap(value,max=46){
  const lines=[];let current='';
  for(const word of String(value).split(/\s+/)){
    if(current&&(current+' '+word).length>max){lines.push(current);current=word;}else current+=(current?' ':'')+word;
  }
  if(current)lines.push(current);
  return lines;
}
function paragraph(x,y,value,max=46,size=18,color=ink){return wrap(value,max).map((s,i)=>text(x,y+i*(size+7),s,size,color)).join('');}
function render(visual){
  let body='',height=400;
  if(visual.kind==='flow'){
    height=100+visual.nodes.length*84;
    visual.nodes.forEach((node,i)=>{
      const y=80+i*84;
      body+=rect(64,y,592,62)+paragraph(86,y+26,node,53,19);
      if(i<visual.nodes.length-1)body+=line(360,y+63,360,y+80,green)+`<path d="M354 ${y+74}L360 ${y+81}L366 ${y+74}" fill="none" stroke="${green}" stroke-width="2"/>`;
    });
  }else if(visual.kind==='compare'){
    const width=656/visual.panels.length;
    let maxBottom=0;
    visual.panels.forEach((panel,i)=>{
      const x=32+i*width;let y=112;
      let contents='';
      panel.forEach((item,j)=>{
        const lines=wrap(item,Math.floor((width-34)/9));
        contents+=paragraph(x+14,y,item,Math.floor((width-34)/9),j===0?20:18,j===0?green:ink);
        y+=lines.length*(j===0?27:25)+22;
      });
      maxBottom=Math.max(maxBottom,y);
      body+=rect(x,80,width-12,y-70)+contents;
    });
    height=maxBottom+30;
  }else if(visual.kind==='grids'){
    let y=80;
    // Stack panels to keep all values readable when the figure is enlarged on mobile.
    for(const panel of visual.panels){
      body+=text(36,y+20,panel.label,19,green);y+=38;
      const columns=Math.max(...panel.cells.map(row=>row.length)),cw=648/columns;
      const maxLines=Math.max(...panel.cells.flat().map(v=>wrap(v,Math.floor(cw/9)-2).length));
      const ch=Math.max(48,maxLines*24+16);
      panel.cells.forEach((row,r)=>row.forEach((value,c)=>{
        let fill=panel.colors?.[r]?.[c]||'#f0f5f5';
        if(panel.scale&&typeof value==='number'){
          const ratio=Math.max(0,Math.min(1,(value-panel.scale[0])/(panel.scale[1]-panel.scale[0])));
          fill=`hsl(163 34% ${95-ratio*40}%)`;
        }
        const x=36+c*cw,yy=y+r*ch;
        body+=rect(x,yy,cw-2,ch-2,fill);
        const lines=wrap(value,Math.floor(cw/9)-2);
        lines.forEach((s,k)=>{body+=text(x+cw/2,yy+ch/2-(lines.length-1)*12+6+k*24,s,18,ink,'middle');});
      }));
      y+=panel.cells.length*ch+30;
    }
    height=y+12;
  }else if(visual.kind==='bars'){
    const values=visual.values.map(v=>v[1]);
    const min=Math.min(0,...values),max=Math.max(0,...values),span=max-min||1;
    const x=v=>300+(v-min)/span*320,zero=x(0);
    body+=paragraph(36,86,visual.unit,64,16,green);
    visual.values.forEach(([label,value],i)=>{
      const y=112+i*60;
      body+=paragraph(36,y+23,label,27,17);
      body+=rect(Math.min(zero,x(value)),y,Math.max(2,Math.abs(x(value)-zero)),34,value<0?'#c4d9ef':'#a8d4c0','none');
      body+=text(674,y+23,value,17,ink,'end');
    });
    height=150+values.length*60;
    body+=line(zero,105,zero,height-42)+text(300,height-18,min,15)+text(620,height-18,max,15,ink,'end');
  }else if(visual.kind==='scatter'||visual.kind==='profile'){
    const [xmin,ymin,xmax,ymax]=visual.bounds;
    // The equal drawing dimensions preserve the equal km scales of the IDW fixture.
    const left=100,top=110,width=460,plotHeight=460;
    const x=v=>left+(v-xmin)/(xmax-xmin)*width,y=v=>top+plotHeight-(v-ymin)/(ymax-ymin)*plotHeight;
    for(let i=0;i<=4;i++){
      const xx=xmin+(xmax-xmin)*i/4,yy=ymin+(ymax-ymin)*i/4;
      body+=line(x(xx),top,x(xx),top+plotHeight,'#dce5e7')+line(left,y(yy),left+width,y(yy),'#dce5e7');
      const fmt=v=>Math.abs(v)<100&&v%1?Number(v.toFixed(4)):Number(v.toFixed(2));
      body+=text(x(xx),top+plotHeight+26,fmt(xx),15,ink,'middle')+text(left-12,y(yy)+5,fmt(yy),15,ink,'end');
    }
    body+=text(left,88,visual.yLabel,17,green)+text(left+width/2,top+plotHeight+62,visual.xLabel,17,green,'middle');
    if(visual.kind==='scatter'){
      for(const [px,py,label] of visual.points){
        body+=`<circle cx="${x(px)}" cy="${y(py)}" r="7" fill="${orange}" stroke="white" stroke-width="2"/>`;
        body+=text(x(px)+(px>(xmin+xmax)/2?-12:12),y(py)+(py>(ymin+ymax)/2?25:-12),label,18,ink,px>(xmin+xmax)/2?'end':'start');
      }
      height=660;
    }else{
      const colors=[green,orange,blue];
      visual.series.forEach((series,i)=>{
        body+=`<polyline points="${series.points.map(([px,py])=>`${x(px)},${y(py)}`).join(' ')}" fill="none" stroke="${colors[i]}" stroke-width="3" ${i?'stroke-dasharray="8 4"':''}/>`;
        const yy=670+i*34;
        body+=line(36,yy-6,70,yy-6,colors[i],i?'8 4':'')+text(82,yy,series.label,17);
      });
      height=700+(visual.series.length-1)*34;
    }
  }else if(visual.kind==='symbols'){
    visual.items.forEach(([label,color,r],i)=>{
      const x=110+i*166;
      body+=`<circle cx="${x}" cy="165" r="${r*2}" fill="${color}" stroke="white" stroke-width="3"/>`+text(x,240,label,22,ink,'middle');
    });height=290;
  }else throw Error(`Unknown figure kind: ${visual.kind}`);
  const titleLines=wrap(visual.title,55);
  if(titleLines.length>1)throw Error(`Figure title too long: ${visual.title}`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="${height}" viewBox="0 0 720 ${height}" role="img" aria-labelledby="title desc"><title id="title">${escape(visual.title)}</title><desc id="desc">${escape(visual.caption)}</desc><rect width="720" height="${height}" fill="white"/><g font-family="Arial, Helvetica, sans-serif">${text(32,28,'FIELDNOTES / STEP VISUAL',13,green)}${text(32,59,visual.title,23)}${body}</g></svg>\n`;
}
module.exports={render};
