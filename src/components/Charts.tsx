'use client';
import React,{useEffect,useState} from 'react';
import {Box,Typography} from '@mui/material';
import type {ApexOptions} from 'apexcharts';
import type {Activity} from '../lib/types';

type ChartComponent = typeof import('react-apexcharts').default;
function useApex(){const [Component,setComponent]=useState<ChartComponent|null>(null);useEffect(()=>{let active=true;import('react-apexcharts').then(mod=>{if(active)setComponent(()=>mod.default);});return()=>{active=false;};},[]);return Component;}
const colors=['#245b9b','#6a98d5','#eea51e','#2a9b83','#8b73c8','#da718a','#8193a8'];
export function BarChart({rows,field}:{rows:Activity[];field:'unit'|'category'|'person'}){
 const C=useApex();const map=new Map<string,number>();rows.forEach(r=>map.set(r[field],(map.get(r[field])||0)+1));const pairs=[...map.entries()].sort((a,b)=>b[1]-a[1]);
 if(!pairs.length)return <Typography color="text.secondary" sx={{py:5,textAlign:'center'}}>Sem dados neste período.</Typography>;
 const options:ApexOptions={chart:{toolbar:{show:false},fontFamily:'inherit'},colors:['#245b9b'],plotOptions:{bar:{borderRadius:5,horizontal:true,barHeight:'55%',distributed:false}},xaxis:{categories:pairs.map(p=>p[0]),labels:{style:{colors:'#8492a6'}}},yaxis:{labels:{maxWidth:145,style:{colors:'#65748a',fontSize:'12px'}}},grid:{borderColor:'#eef2f8'},dataLabels:{enabled:true,style:{fontWeight:600,colors:['#fff']}},tooltip:{theme:'light'}};
 return <Box sx={{width:'100%',minHeight:Math.max(215,pairs.length*39+45)}}>{C?<C options={options} series={[{name:'Registros',data:pairs.map(p=>p[1])}]} type="bar" height={Math.max(215,pairs.length*39+45)}/>:<Typography sx={{py:6}} color="text.secondary">Carregando gráfico...</Typography>}</Box>;
}
export function DonutChart({rows}:{rows:Activity[]}){
 const C=useApex();const done=rows.filter(r=>r.status==='DONE').length, progress=rows.length-done;const options:ApexOptions={chart:{fontFamily:'inherit'},labels:['Concluídas','Em andamento'],colors:[colors[0],colors[2]],dataLabels:{enabled:false},legend:{position:'bottom'},stroke:{width:2},plotOptions:{pie:{donut:{size:'72%',labels:{show:true,total:{show:true,label:'Registros',formatter:()=>String(rows.length)}}}}}};
 if(!rows.length)return <Typography color="text.secondary" sx={{py:5,textAlign:'center'}}>Sem dados neste período.</Typography>;
 return <Box sx={{width:'100%',minHeight:265}}>{C?<C type="donut" options={options} series={[done,progress]} height={265}/>:<Typography color="text.secondary" sx={{py:6}}>Carregando gráfico...</Typography>}</Box>;
}
