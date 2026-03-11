/* Mansour Cup 2026 - Robust CSV-driven front-end (matches.csv only) */

const CupApp = (() => {

function qs(sel){ return document.querySelector(sel); }
function qsa(sel){ return Array.from(document.querySelectorAll(sel)); }

function getParam(name){
  const url = new URL(window.location.href);
  return url.searchParams.get(name) || "";
}

function showError(msg){
  const el = qs('#loadError');
  if(!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
}

/* ================= CSV PARSER ================= */

function parseCSV(text){
  const rows=[];
  let row=[];
  let cur="";
  let inQuotes=false;

  for(let i=0;i<text.length;i++){
    const ch=text[i];
    const next=text[i+1];

    if(inQuotes){
      if(ch=='"' && next=='"'){
        cur+='"';
        i++;
        continue;
      }
      if(ch=='"'){
        inQuotes=false;
        continue;
      }
      cur+=ch;
    }else{
      if(ch=='"'){
        inQuotes=true;
        continue;
      }
      if(ch==','){
        row.push(cur);
        cur="";
        continue;
      }
      if(ch=='\n'){
        row.push(cur);
        rows.push(row);
        row=[];
        cur="";
        continue;
      }
      if(ch=='\r') continue;
      cur+=ch;
    }
  }

  row.push(cur);
  rows.push(row);

  const headers=rows.shift().map(h=>h.trim());

  return rows.map(r=>{
    const obj={};
    headers.forEach((h,i)=>obj[h]=(r[i]||"").trim());
    return obj;
  });
}

/* ================= VIDEO ================= */

async function loadVideos(){
  return {channel_url:"",matches:{}};
}

function getVideoUrl(m){
  return (m.video_url||"").trim();
}

function videoLinkHTML(m){
  const url=getVideoUrl(m);
  if(!url) return '';
  return `<a class="btn" href="${url}" target="_blank">🎥 الفيديو</a>`;
}

/* ================= LOAD MATCHES ================= */

async function loadMatches(){
  try{

    const res=await fetch('data/matches.csv?v='+Date.now(),{cache:'no-store'});
    const text=await res.text();
    const data=parseCSV(text);

    return data.map(m=>({

      group:(m.group||"").toUpperCase(),
      round:m.round||"",
      date:m.date||"",
      time:m.time||"",
      team1:m.team1||"",
      team2:m.team2||"",
      score1:m.score1||"",
      score2:m.score2||"",
      referee1:m.referee1||"",
      referee2:m.referee2||"",
      commentator:m.commentator||"",
      player_of_match:m.player_of_match||"",
      goals_team1:m.goals_team1||"",
      goals_team2:m.goals_team2||"",
      yellow_team1:m.yellow_team1||"",
      red_team1:m.red_team1||"",
      yellow_team2:m.yellow_team2||"",
      red_team2:m.red_team2||"",
      match_code:m.match_code||"",
      video_url:m.video_url||""

    })).filter(m=>m.group && m.match_code);

  }catch(e){
    showError(e.message);
    return [];
  }
}

/* ================= HELPERS ================= */

function isPlayed(m){
  return m.score1!=="" && m.score2!=="";
}

function escapeHTML(str){
  return String(str||"")
  .replace(/&/g,"&amp;")
  .replace(/</g,"&lt;")
  .replace(/>/g,"&gt;");
}

/* ================= RENDER RECENT MATCHES ================= */

function renderRecent(matches){

  const tbl=qs('#tblRecent tbody');
  const badge=qs('#matchesCount');

  if(!tbl || !badge) return;

  badge.textContent=matches.length;
  tbl.innerHTML="";

  matches.forEach(m=>{

    const tr=document.createElement("tr");

    const score=isPlayed(m)
      ? `${m.score1} - ${m.score2}`
      : "-";

    tr.innerHTML=`

<td>${escapeHTML(m.match_code)}</td>
<td>${escapeHTML(m.group)}</td>
<td>${escapeHTML(m.date)}</td>
<td>${escapeHTML(m.time)}</td>
<td>${escapeHTML(m.team1)}</td>
<td>${score}</td>
<td>${escapeHTML(m.team2)}</td>
<td>${videoLinkHTML(m)}</td>

`;

    tbl.appendChild(tr);

  });

}

/* ================= INIT ================= */

async function init(){

  const matches=await loadMatches();
  renderRecent(matches);

}

/* ================= EXPORT ================= */

return {init};

})();

/* ================= START ================= */

document.addEventListener("DOMContentLoaded",CupApp.init);
