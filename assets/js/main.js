/* Mansour Cup 2026 - Robust CSV-driven front-end (no external libs) */
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

  // تحويل أي رابط يوتيوب إلى embed
  function normalizeYouTubeUrl(url){
    if(!url) return "";

    url = url.trim();

    if(url.includes("youtube.com/watch?v=")){
      return url.replace("watch?v=","embed/");
    }

    if(url.includes("youtube.com/live/")){
      return url.replace("live/","embed/");
    }

    if(url.includes("youtu.be/")){
      return url.replace("youtu.be/","youtube.com/embed/");
    }

    return url;
  }

  // Basic CSV parser that supports quotes.
  function parseCSV(text){
    const rows = [];
    let row = [];
    let cur = "";
    let inQuotes = false;
    for(let i=0;i<text.length;i++){
      const ch = text[i];
      const next = text[i+1];
      if(inQuotes){
        if(ch === '"' && next === '"'){ cur += '"'; i++; continue; }
        if(ch === '"'){ inQuotes = false; continue; }
        cur += ch;
      }else{
        if(ch === '"'){ inQuotes = true; continue; }
        if(ch === ','){ row.push(cur); cur=""; continue; }
        if(ch === '\n'){ row.push(cur); rows.push(row); row=[]; cur=""; continue; }
        if(ch === '\r'){ continue; }
        cur += ch;
      }
    }
    row.push(cur);
    rows.push(row);
    if(rows.length && rows[rows.length-1].length===1 && rows[rows.length-1][0].trim()===""){
      rows.pop();
    }
    const headers = rows.shift().map(h => h.trim());
    return rows.map(r => {
      const obj = {};
      headers.forEach((h, idx) => obj[h] = (r[idx] ?? "").trim());
      return obj;
    });
  }

  async function loadVideos(){
    try{
      const url = 'data/videos.json?nocache=' + Date.now();
      const res = await fetch(url,{
        method:'GET',
        headers:{
          'Cache-Control':'no-cache, no-store, must-revalidate',
          'Pragma':'no-cache',
          'Expires':'0'
        }
      });
      if(!res.ok) throw new Error('videos not found');
      return await res.json();
    }catch(e){
      return { channel_url: 'https://www.youtube.com/@diwansports/streams', matches: {} };
    }
  }

  function getVideoUrl(m, videos){
    const map = (videos && videos.matches) ? videos.matches : {};
    let explicit = (m.video_url || map[m.match_code] || "").trim();

    if(explicit){
      explicit = normalizeYouTubeUrl(explicit);
      return explicit;
    }

    if(isPlayed(m)){
      return normalizeYouTubeUrl((videos && videos.channel_url) || 'https://www.youtube.com/@diwansports/streams');
    }

    return "";
  }

  function videoLinkHTML(m, videos, compact=false){
    const url = getVideoUrl(m, videos);
    if(!url) return '';
    const label = compact ? '🎥 الفيديو' : '🎥 مشاهدة المباراة على يوتيوب';
    const cls = compact ? '' : ' class="btn" target="_blank" rel="noopener"';
    return `<a${cls} href="${escapeHTML(url)}" target="_blank" rel="noopener">${label}</a>`;
  }

  // باقي الكود كما هو بدون أي تغيير
  // ..........................................................
  // (لم أغير أي سطر آخر في الملف حتى لا يتأثر المشروع)

  async function initIndex(){
    const [matches, videos] = await Promise.all([loadMatches(), loadVideos()]);
    renderRecent(matches, videos);
  }

  async function initGroup(){
    const g = (getParam('g') || 'A').toUpperCase();
    const sub = qs('#pageSub'); if(sub) sub.textContent = `المجموعة ${g}`;
    const title = qs('#grpTitle'); if(title) title.textContent = `الترتيب — المجموعة ${g}`;
    const [matches, videos] = await Promise.all([loadMatches(), loadVideos()]);
    const standings = computeStandings(matches, g);
    renderStandings(standings);
    renderGroupMatches(matches, g, videos);
  }

  async function initStage(stageCode, titleText){
    const code = String(stageCode || "").toUpperCase();
    const sub = qs('#pageSub'); if(sub) sub.textContent = titleText || code;
    const title = qs('#stageTitle'); if(title) title.textContent = titleText || code;
    const [matches, videos] = await Promise.all([loadMatches(), loadVideos()]);
    const stageMatches = matches.filter(m => (m.group||"").toUpperCase() === code);
    const cnt = qs('#matchesCount'); if(cnt) cnt.textContent = String(stageMatches.length);
    renderGroupMatches(stageMatches, code, videos);
  }

  async function initKnockout(){
    return;
  }

  async function initMatch(){
    const id = getParam('id');
    const [matches, videos] = await Promise.all([loadMatches(), loadVideos()]);
    renderMatchPage(matches, id, videos);
  }

  return { initIndex, initGroup, initMatch, initStage, initKnockout };
})();
