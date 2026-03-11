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
        if(ch === '"' && next === '"'){
          cur += '"';
          i++;
          continue;
        }
        if(ch === '"'){
          inQuotes = false;
          continue;
        }
        cur += ch;
      }else{
        if(ch === '"'){
          inQuotes = true;
          continue;
        }
        if(ch === ','){
          row.push(cur);
          cur = "";
          continue;
        }
        if(ch === '\n'){
          row.push(cur);
          rows.push(row);
          row = [];
          cur = "";
          continue;
        }
        if(ch === '\r'){
          continue;
        }
        cur += ch;
      }
    }

    row.push(cur);
    rows.push(row);

    // trim empty last line
    if(rows.length && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0].trim() === ""){
      rows.pop();
    }

    const headers = rows.shift().map(h => h.trim());

    return rows.map(r => {
      const obj = {};
      headers.forEach((h, idx) => obj[h] = (r[idx] ?? "").trim());
      return obj;
    });
  }

  // IMPORTANT:
  // We no longer depend on data/videos.json at all.
  // Video source = matches.csv -> video_url فقط
  async function loadVideos(){
    return { channel_url: "", matches: {} };
  }

  function getVideoUrl(m, videos){
    const explicit = (m.video_url || "").trim();
    if(explicit) return explicit;
    return "";
  }

  function videoLinkHTML(m, videos, compact=false){
    const url = getVideoUrl(m, videos);
    if(!url) return '';

    const label = compact ? '🎥 الفيديو' : '🎥 مشاهدة المباراة على يوتيوب';
    const cls = compact ? '' : ' class="btn"';
    return `<a${cls} href="${escapeHTML(url)}" target="_blank" rel="noopener">${label}</a>`;
  }

  async function loadMatches(){
    try{
      const res = await fetch('data/matches.csv?v=' + Date.now(), {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if(!res.ok) throw new Error('لم أستطع تحميل data/matches.csv (تأكد أنه موجود في المشروع).');

      const text = await res.text();
      const data = parseCSV(text);

      return data.map(m => ({
        group: (m.group || "").toUpperCase(),
        round: m.round || "",
        date: m.date || "",
        time: m.time || "",
        team1: m.team1 || "",
        team2: m.team2 || "",
        score1: m.score1 || "",
        score2: m.score2 || "",
        referee1: m.referee1 || "",
        referee2: m.referee2 || "",
        commentator: m.commentator || "",
        player_of_match: m.player_of_match || "",

        // scorers/goals
        goals_team1: m.goals_team1 || m.scorers_team1 || m.scorersHome || "",
        goals_team2: m.goals_team2 || m.scorers_team2 || m.scorersAway || "",

        // cards
        yellow_team1: m.yellow_team1 || m.yellows_team1 || m.yellow1 || "",
        red_team1: m.red_team1 || m.reds_team1 || m.red1 || "",
        yellow_team2: m.yellow_team2 || m.yellows_team2 || m.yellow2 || "",
        red_team2: m.red_team2 || m.reds_team2 || m.red2 || "",

        // VAR
        var_team1: m.var_team1 || m.var1 || "",
        var_team2: m.var_team2 || m.var2 || "",

        // advanced VAR support if columns exist
        var1_team: m.var1_team || "",
        var1_type: m.var1_type || "",
        var1_result: m.var1_result || "",
        var2_team: m.var2_team || "",
        var2_type: m.var2_type || "",
        var2_result: m.var2_result || "",
        var3_team: m.var3_team || "",
        var3_type: m.var3_type || "",
        var3_result: m.var3_result || "",
        var4_team: m.var4_team || "",
        var4_type: m.var4_type || "",
        var4_result: m.var4_result || "",

        var_used: m.var_used || "",
        var_for: m.var_for || "",
        var_type: m.var_type || "",
        var_result: m.var_result || "",

        match_code: m.match_code || m.code || "",
        video_url: m.video_url || ""
      })).filter(m => m.group && m.match_code);
    }catch(e){
      showError(e.message || String(e));
      return [];
    }
  }

  function isPlayed(m){
    return m.score1 !== "" && m.score2 !== "" && !isNaN(Number(m.score1)) && !isNaN(Number(m.score2));
  }

  function parseArabicDateToISO(dateStr){
    const s = String(dateStr || "").trim();
    const m = s.match(/(يناير|فبراير|مارس|أبريل|مايو|يونيو|يوليو|أغسطس|سبتمبر|أكتوبر|نوفمبر|ديسمبر)\s+(\d{1,2}),\s*(\d{4})/);
    if(!m) return "";

    const monMap = {
      "يناير":"01",
      "فبراير":"02",
      "مارس":"03",
      "أبريل":"04",
      "مايو":"05",
      "يونيو":"06",
      "يوليو":"07",
      "أغسطس":"08",
      "سبتمبر":"09",
      "أكتوبر":"10",
      "نوفمبر":"11",
      "ديسمبر":"12"
    };

    const mm = monMap[m[1]] || "01";
    const dd = String(m[2]).padStart(2,"0");
    const yy = m[3];
    return `${yy}-${mm}-${dd}`;
  }

  function matchKey(m){
    const iso = parseArabicDateToISO(m.date);
    const time = String(m.time || "").trim();
    const hhmm = time && /^\d{1,2}:\d{2}$/.test(time)
      ? time.split(':').map((x,i)=> i===0 ? x.padStart(2,'0') : x).join('')
      : '0000';
    return `${iso}T${hhmm}`;
  }

  function sortByDateTimeDesc(a,b){
    const ka = matchKey(a);
    const kb = matchKey(b);
    return kb.localeCompare(ka);
  }

  function sortByDateTimeAsc(a,b){
    const ka = matchKey(a);
    const kb = matchKey(b);
    return ka.localeCompare(kb);
  }

  function isUpcoming(m){
    if(isPlayed(m)) return false;

    const iso = parseArabicDateToISO(m.date);
    if(!iso) return true;

    const now = new Date();
    const todayIso = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
    return iso >= todayIso;
  }

  function computeStandings(matches, group){
    const gMatches = matches.filter(m => m.group === group);
    const teams = new Set();

    gMatches.forEach(m => {
      teams.add(m.team1);
      teams.add(m.team2);
    });

    const table = {};
    for(const t of teams){
      table[t] = { team:t, P:0, W:0, D:0, L:0, GF:0, GA:0, GD:0, Pts:0 };
    }

    for(const m of gMatches){
      if(!isPlayed(m)) continue;

      const s1 = Number(m.score1);
      const s2 = Number(m.score2);

      const t1 = table[m.team1] || (table[m.team1] = { team:m.team1, P:0, W:0, D:0, L:0, GF:0, GA:0, GD:0, Pts:0 });
      const t2 = table[m.team2] || (table[m.team2] = { team:m.team2, P:0, W:0, D:0, L:0, GF:0, GA:0, GD:0, Pts:0 });

      t1.P++;
      t2.P++;
      t1.GF += s1;
      t1.GA += s2;
      t2.GF += s2;
      t2.GA += s1;

      if(s1 > s2){
        t1.W++;
        t2.L++;
        t1.Pts += 3;
      }else if(s1 < s2){
        t2.W++;
        t1.L++;
        t2.Pts += 3;
      }else{
        t1.D++;
        t2.D++;
        t1.Pts += 1;
        t2.Pts += 1;
      }
    }

    for(const t of Object.values(table)){
      t.GD = t.GF - t.GA;
    }

    const arr = Object.values(table);
    arr.sort((a,b) => {
      if(b.Pts !== a.Pts) return b.Pts - a.Pts;
      if(b.GD !== a.GD) return b.GD - a.GD;
      if(b.GF !== a.GF) return b.GF - a.GF;
      return a.team.localeCompare(b.team, 'ar');
    });

    return arr;
  }

  function renderRecent(matches, videos){
    const tbl = qs('#tblRecent tbody');
    const badge = qs('#matchesCount');
    if(!tbl || !badge) return;

    const sorted = [...matches].sort(sortByDateTimeDesc);
    badge.textContent = String(sorted.length);

    tbl
