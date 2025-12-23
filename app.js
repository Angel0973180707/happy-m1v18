// pen-m1-v1.8｜年齡分流（B命名）+ v1.7狀態錦囊 + v1.6每日練功下一句卡
(function(){
  const KEY = "hp_m1_v18";
  const MAX_FAV = 7;
  const MAX_RECENT = 3;

  // ---------- Utils ----------
  const $ = (id)=>document.getElementById(id);
  const pick = (arr)=>arr[Math.floor(Math.random()*arr.length)];

  function todayStr(){
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,"0");
    const day = String(d.getDate()).padStart(2,"0");
    return `${y}-${m}-${day}`;
  }
  function dayDiff(aStr, bStr){
    const a = new Date(aStr+"T00:00:00");
    const b = new Date(bStr+"T00:00:00");
    return Math.round((b-a)/(1000*60*60*24));
  }

  // ---------- State ----------
  function defaultState(){
    return {
      ageMode: "", // C：記住上次選的（空字串代表尚未選過）
      water: 0,
      streak: 0,
      lastDailyDate: "",
      didDailyToday: false,
      earnedDailyToday: false,

      todayDate: "",
      todayTipCount: 0,
      todayRescueCount: 0,

      favInner: [],
      favOuter: [],
      recentInner: [],
      recentOuter: [],

      currentInner: "",
      currentOuter: "",

      // daily
      dailySelectedState: "",
      dailyOptionA: "",
      dailyOptionB: "",

      // tips state (v1.7)
      tipSelectedState: ""
    };
  }
  function loadState(){
    try{
      const raw = localStorage.getItem(KEY);
      if(!raw) return defaultState();
      const s = JSON.parse(raw);
      return Object.assign(defaultState(), s);
    }catch(e){
      return defaultState();
    }
  }
  function saveState(){
    localStorage.setItem(KEY, JSON.stringify(state));
  }
  let state = loadState();

  // ---------- DOM ----------
  const el = {
    todayChip: $("todayChip"),
    waterText: $("waterText"),
    streakText: $("streakText"),
    tipCountText: $("tipCountText"),
    rescueCountText: $("rescueCountText"),

    ageLabelText: $("ageLabelText"),

    timerText: $("timerText"),
    guideText: $("guideText"),
    praiseOut: $("praiseOut"),

    tipStateHint: $("tipStateHint"),
    innerOut: $("innerOut"),
    outerOut: $("outerOut"),

    favInnerList: $("favInnerList"),
    favOuterList: $("favOuterList"),
    recentInnerList: $("recentInnerList"),
    recentOuterList: $("recentOuterList"),

    dailyTimer: $("dailyTimer"),
    dailyStep: $("dailyStep"),
    stateHint: $("stateHint"),
    resultCard: $("resultCard"),
    resultState: $("resultState"),
    resultBody: $("resultBody"),
    resultA: $("resultA"),
    resultB: $("resultB"),
    dailyResult: $("dailyResult"),

    plantIcon: $("plantIcon"),
    stageText: $("stageText"),
    nextNeedText: $("nextNeedText"),
    meterFill: $("meterFill"),
    gardenOut: $("gardenOut"),

    copyModal: $("copyModal"),
    copyBox: $("copyBox")
  };

  // ---------- Age labels (B) ----------
  const AGE_LABELS = {
    preschool: "學前孩子",
    primary: "國小孩子",
    teen: "青少年",
    adult: "成人關係"
  };

  // 預設：如果完全沒選過 → 預設國小孩子（但仍符合 C：記住上次選的）
  function ensureAgeMode(){
    if(!state.ageMode) state.ageMode = "primary";
    el.ageLabelText.textContent = AGE_LABELS[state.ageMode] || "國小孩子";
    document.querySelectorAll("#ageChoices .pill.age").forEach(b=>b.classList.remove("active"));
    const btn = document.querySelector(`#ageChoices .pill.age[data-age="${state.ageMode}"]`);
    if(btn) btn.classList.add("active");
  }

  // ---------- Text pools ----------
  const rescueLines = [
    "先讓臉放鬆。",
    "肩膀放下來一點。",
    "吸氣，吐氣。",
    "下巴鬆開一點。",
    "先把聲音放慢。",
    "先讓心慢一點。"
  ];
  const praises = [
    "剛剛願意先緩一下，已經很了不起。",
    "把呼吸拉回來，事情就比較好處理。",
    "先讓心穩定，後面才有餘裕。",
    "願意停一下，是很成熟的能力。",
    "先照顧自己，才有力量照顧孩子。"
  ];
  const gardenCards = [
    "今天的水滴，是明天的底氣。",
    "小小練一次，就往前一點點。",
    "先回到穩定，關係就有空間。",
    "走得慢沒關係，方向對就好。",
    "先把心顧好，語氣自然更溫柔。"
  ];

  // v1.6 daily：狀態 → 身體提醒（共用，不分年齡）
  const dailyStateBody = {
    slow:  "聲音放慢、呼吸拉長。",
    clear: "句子短一點，事情先交代。",
    stand: "背打直，不解釋、不拉扯。",
    soft:  "表情放鬆，先降溫。"
  };

  // v1.8：錦囊（狀態×年齡）句庫
  // 原則：內在更短更自我穩定；外在更能直接說出口
  const tipsByStateAndAge = {
    slow: {
      preschool: {
        inner: ["先把聲音放慢。","先蹲下來看著孩子。","先把手放胸口，吸一口氣。","先停一下，不要急著回。","先讓臉放鬆。","先把動作放慢。"],
        outer: ["先停手。看著我。","先抱緊自己一下，等一下。","先坐下來，吸氣吐氣。","先停一下，跟我一起慢慢呼吸。","先把手放下來，等一下。","先看著我，先不做。"]
      },
      primary: {
        inner: ["先慢下來，事情才看得清楚。","先把心放回自己身上。","先把聲音放慢，會比較好講。","先停一下，先整理一下。","先讓呼吸穩定，再決定要怎麼說。","先別急著糾正，先降溫。"],
        outer: ["先停一下，等一下再說。","先把聲音放慢，我們再談。","先休息一下，等一下再繼續。","先讓心情慢一點，再處理。","先坐好，跟我一起吸氣吐氣。","先把手停下來，等一下。"]
      },
      teen: {
        inner: ["先把反擊收回來。","先停一下，別急著回。","先讓心慢一點，才不會越講越硬。","先把焦躁放掉一點。","先不用證明什麼，先穩住自己。","先不追，先留空間。"],
        outer: ["先停一下，我需要想一下再回。","現在先不吵，等一下再談。","我先冷靜一下，等一下再接著說。","我聽到了，但我需要先緩一下。","先各自安靜一下，等一下再講。","我先停在這裡，等你準備好再談。"]
      },
      adult: {
        inner: ["先把情緒放下來一點。","先停一下，先穩住自己。","先別急著回擊，先回到重點。","先把呼吸拉長，讓心回來。","先不解釋，先讓氣氛降溫。","先把聲音放慢。"],
        outer: ["我先停一下，等一下再談。","現在先不繼續，等一下再接著說。","我需要先緩一下，等一下再回。","我們先停在這裡，等一下再談。","先休息一下，讓情緒下來。","先把速度放慢，再談比較好。"]
      }
    },

    clear: {
      preschool: {
        inner: ["先講一件事就好。","先用短句，孩子才聽得懂。","先說要做什麼，不要講太多。","先把重點講清楚。","先看著孩子，再說。","先用一個動作配一句話。"],
        outer: ["現在要收玩具。","先把手洗乾淨。","先坐好吃飯。","先把鞋子穿好。","先把聲音小一點。","先把玩具放回盒子。"]
      },
      primary: {
        inner: ["先把事情講清楚，再談感受。","先講規則，再給選擇。","先用短句，孩子更容易做。","先把順序講出來。","先把焦點放在『現在要做什麼』。","先把要求說完整。"],
        outer: ["現在先把作業寫完。","先把這一件做完，再做下一件。","你可以選：先收書包／先去洗手。","先把聲音放小，再說。","現在先照規則做，等一下再討論。","先把東西收好，我們再談。"]
      },
      teen: {
        inner: ["先把重點講清楚，不要繞。","先說事，不談人。","先把界線講清楚，語氣放平。","先不要說教，先講安排。","先講下一步，別追究。","先把對話收斂到一件事。"],
        outer: ["我只說重點：這件事要完成。","現在先把這件事做完，再談其他。","我不討論態度，我討論行為。","我們先把規則做到位，再談你的想法。","你可以不喜歡，但你要做到。","我先把流程說清楚：先A再B。"]
      },
      adult: {
        inner: ["先把事講清楚，情緒先放旁邊。","先談事實與下一步。","先用短句講重點。","先把界線講清楚，別拉扯。","先把期待說完整。","先把結論講出來。"],
        outer: ["我先講重點：接下來要怎麼做。","我們先把這件事處理完，再談感受。","我希望的是：今天把這件事定下來。","先把事情說清楚，避免誤會。","我不討論情緒，我討論安排。","我先把界線說明：這件事到此為止。"]
      }
    },

    stand: {
      preschool: {
        inner: ["先站穩，孩子需要你穩。","先不跟著哭鬧走。","先把手放下來，保持安全。","先用身體擋住危險。","先不講道理，先止住動作。","先不退，先守住。"],
        outer: ["我會保護你。先停手。","先停下來，這樣不安全。","我不讓你打人。","我不讓你丟東西。","我在這裡，先停。","先把手放在自己身上。"]
      },
      primary: {
        inner: ["先站好位置，不要被情緒推著走。","先守住規則，孩子才安心。","先不討好，也不硬碰。","先穩住底線，再談情緒。","先說清楚『可以/不可以』。","先不退到沒界線。"],
        outer: ["我知道你不想，但這件事你要做。","我會陪你不開心，但規則不改。","你可以生氣，但你不能打人。","你可以抱怨，但你要照做。","我不接受用吼的，我們重說一次。","我會在這裡，你先照規則做。"]
      },
      teen: {
        inner: ["先站穩，不用贏。","先不被挑釁帶走。","先把界線說清楚，語氣放平。","先守住原則，不拉扯。","先尊重，但不退讓。","先不解釋太多，避免拉長戰線。"],
        outer: ["我聽到了，但我不接受這樣講話。","我會尊重你，但規則不改。","你可以不同意，但你要負責。","我不跟你吵，我說到這裡。","我會等你冷靜，我不追。","我願意談，但不是用這種方式。"]
      },
      adult: {
        inner: ["先站好位置，不用證明。","先守住底線，不攻擊也不退讓。","先把責任放回該放的位置。","先不解釋，先止損。","先把界線說清楚。","先把對話停住。"],
        outer: ["我不接受這樣的說法，我先停在這裡。","我會尊重你，但這個底線不變。","我願意談，但不是現在這種方式。","我不會配合情緒勒索，我先暫停。","我聽到了，但我不同意你這樣對我。","我先把界線說清楚：這件事我不退。"]
      }
    },

    soft: {
      preschool: {
        inner: ["先把臉放軟，孩子才會放軟。","先抱抱再說。","先用眼神安撫。","先蹲下來，靠近一點。","先說『我在』，孩子就穩。","先讓孩子感到安全。"],
        outer: ["我在這裡，抱一下。","你很生氣，我知道。","先抱抱，等一下再說。","我看到你難過了。","我陪你，先慢慢呼吸。","先靠過來，我在。"]
      },
      primary: {
        inner: ["先把關係放前面，事情比較好處理。","先承接情緒，再回到規則。","先用溫柔把孩子拉回來。","先讓孩子覺得被看見。","先放低音量。","先把對立拆掉一點。"],
        outer: ["我知道你不舒服，我陪你。","你可以不開心，我在這裡。","先休息一下，等一下再處理。","你先說，我先聽。","我懂你不想，但我們一起想辦法。","先讓心情下來，我們再談。"]
      },
      teen: {
        inner: ["先給空間，關係才有路。","先不急著糾正，先讓人願意留在現場。","先把刺收起來。","先把語氣放柔，不丟臉。","先接住，不說教。","先把對話留住。"],
        outer: ["我想懂你，你可以慢慢說。","我不急著評價，我先聽。","你不想講也可以，我在。","我們先不要硬碰，等一下再談。","我尊重你，你也請尊重我。","我在意的是關係，不是輸贏。"]
      },
      adult: {
        inner: ["先把關係拉回來，再談對錯。","先降溫，才有機會。","先把心放柔一點。","先少一句刺，多一句理解。","先讓對方下台階。","先放過彼此。"],
        outer: ["我在意的是我們的關係，先不要互刺。","我懂你在意，我也在意，我們慢慢談。","先停一下，等情緒下來再談。","我願意理解你，你也願意聽我嗎？","我們先把語氣放柔一點。","我想好好說，不想互相傷。"]
      }
    }
  };

  // v1.8：每日練功（狀態×年齡）出 2 句
  function dailyLines(stateKey, ageKey){
    // 從錦囊 outer 取兩句作為「可說出口」更一致
    const pack = tipsByStateAndAge[stateKey]?.[ageKey];
    if(pack && pack.outer && pack.outer.length >= 2){
      // 取兩句不同的
      const a = pick(pack.outer);
      let b = pick(pack.outer);
      let guard = 0;
      while(b === a && guard < 10){ b = pick(pack.outer); guard++; }
      return [a,b];
    }
    // fallback
    return ["先停一下，等一下再說。","我需要先緩一下，等一下再談。"];
  }

  // ---------- Copy helpers ----------
  function openCopyModal(text){
    el.copyBox.value = text || "";
    el.copyModal.classList.add("show");
    el.copyModal.setAttribute("aria-hidden", "false");
    setTimeout(()=>{
      el.copyBox.focus();
      el.copyBox.select();
    }, 50);
  }
  function closeCopyModal(){
    el.copyModal.classList.remove("show");
    el.copyModal.setAttribute("aria-hidden", "true");
  }
  async function copyText(text){
    if(!text){
      el.praiseOut.textContent = "這裡還沒有句子可複製。先抽一句或點最愛。";
      return;
    }
    try{
      if(navigator.clipboard && typeof navigator.clipboard.writeText === "function"){
        await navigator.clipboard.writeText(text);
        el.praiseOut.textContent = "已複製 ✅ 直接貼到對話框就能用。";
        return;
      }
      openCopyModal(text);
      el.praiseOut.textContent = "手機不支援一鍵複製時，用小窗全選→複製也可以。";
    }catch(err){
      openCopyModal(text);
      el.praiseOut.textContent = "一鍵複製沒成功，用小窗全選→複製也可以。";
    }
  }

  // ---------- Day rollover ----------
  function normalizeToday(){
    const t = todayStr();
    if(state.todayDate !== t){
      state.todayDate = t;
      state.todayTipCount = 0;
      state.todayRescueCount = 0;
      state.didDailyToday = false;
      state.earnedDailyToday = false;
      saveState();
    }
  }

  // ---------- Render ----------
  function renderTop(){
    el.waterText.textContent = state.water;
    el.streakText.textContent = state.streak;
    el.tipCountText.textContent = state.todayTipCount;
    el.rescueCountText.textContent = state.todayRescueCount;
    el.todayChip.textContent = state.didDailyToday ? "今天：已練功 ✅" : "今天：尚未練功";
  }

  function renderGarden(){
    const stage = Math.min(4, Math.floor(state.water / 5));
    const icons = ["🌰","🌱","🌿","🌸","🍎"];
    const names = ["種子","發芽","長葉","開花","結果"];

    el.plantIcon.textContent = icons[stage];
    el.stageText.textContent = names[stage];

    const nextTarget = (stage + 1) * 5;
    const need = stage >= 4 ? 0 : Math.max(0, nextTarget - state.water);
    el.nextNeedText.textContent = need;

    const inStage = state.water - stage*5;
    const pct = stage >= 4 ? 100 : Math.round((inStage/5)*100);
    el.meterFill.style.width = pct + "%";
  }

  function addWater(n){
    state.water += n;
    saveState();
    renderTop();
    renderGarden();
  }

  // ---------- Favorites & Recent ----------
  function pushRecent(list, text){
    if(!text) return list;
    const next = [text, ...list.filter(x=>x!==text)];
    return next.slice(0, MAX_RECENT);
  }

  function addFavorite(type){
    const text = (type==="inner") ? state.currentInner : state.currentOuter;
    if(!text){
      el.praiseOut.textContent = "先抽一句或先選一句，再收藏會更順。";
      return;
    }

    const key = (type==="inner") ? "favInner" : "favOuter";
    const arr = state[key].slice();

    if(arr.includes(text)){
      el.praiseOut.textContent = "這句已經在最愛裡了。";
      return;
    }
    if(arr.length >= MAX_FAV){
      el.praiseOut.textContent = `最愛最多 ${MAX_FAV} 句，先刪一兩句再加也可以。`;
      return;
    }

    arr.unshift(text);
    state[key] = arr;
    saveState();
    renderLists();
    el.praiseOut.textContent = "已加入最愛 ⭐";
  }

  function removeFavorite(type, idx){
    const key = (type==="inner") ? "favInner" : "favOuter";
    const arr = state[key].slice();
    arr.splice(idx,1);
    state[key] = arr;
    saveState();
    renderLists();
  }

  function useFromList(type, text){
    if(type==="inner"){
      state.currentInner = text;
      el.innerOut.textContent = text;
    }else{
      state.currentOuter = text;
      el.outerOut.textContent = text;
    }
    saveState();
  }

  function renderList(container, arr, type, isFav){
    container.innerHTML = "";
    if(!arr || arr.length === 0){
      const empty = document.createElement("div");
      empty.className = "tiny";
      empty.textContent = isFav ? "（目前沒有最愛）" : "（還沒有最近句子）";
      container.appendChild(empty);
      return;
    }

    arr.forEach((txt, idx)=>{
      const row = document.createElement("div");
      row.className = "itemRow";

      const btn = document.createElement("button");
      btn.className = "itemBtn";
      btn.textContent = txt;
      btn.dataset.action = "useLine";
      btn.dataset.type = type;
      btn.dataset.text = txt;
      row.appendChild(btn);

      const copy = document.createElement("button");
      copy.className = "delBtn";
      copy.textContent = "📋";
      copy.title = "複製這句";
      copy.dataset.action = "copyLine";
      copy.dataset.text = txt;
      row.appendChild(copy);

      if(isFav){
        const del = document.createElement("button");
        del.className = "delBtn";
        del.textContent = "✕";
        del.title = "從最愛刪除";
        del.dataset.action = "delFav";
        del.dataset.type = type;
        del.dataset.idx = String(idx);
        row.appendChild(del);
      }else{
        const badge = document.createElement("span");
        badge.className = "badge";
        badge.textContent = "最近";
        row.appendChild(badge);
      }

      container.appendChild(row);
    });
  }

  function renderLists(){
    renderList(el.favInnerList, state.favInner, "inner", true);
    renderList(el.favOuterList, state.favOuter, "outer", true);
    renderList(el.recentInnerList, state.recentInner, "inner", false);
    renderList(el.recentOuterList, state.recentOuter, "outer", false);
  }

  // ---------- Rescue timer ----------
  let total = 30;
  let left = total;
  let timerId = null;

  function setTimer(sec){
    el.timerText.textContent = "00:" + String(sec).padStart(2,"0");
  }
  function setGuide(text){
    el.guideText.textContent = text;
  }

  function startRescue(){
    if(timerId) return;
    left = total;
    setTimer(left);
    setGuide(rescueLines[0]);
    timerId = setInterval(function(){
      left--;
      if(left < 0) left = 0;
      setTimer(left);
      if(left > 0 && left % 6 === 0) setGuide(pick(rescueLines));
      if(left <= 0) stopRescue(true);
    }, 1000);
  }

  function stopRescue(done){
    if(timerId){
      clearInterval(timerId);
      timerId = null;
    }
    if(done){
      setTimer(30);
      setGuide("完成 30 秒。接下來比較好說話了。");
    }else{
      setGuide("先停一下也可以。需要的時候再回來。");
    }
  }

  // ---------- Tips pick (v1.7 + v1.8) ----------
  function ensureTipState(){
    if(!state.tipSelectedState){
      el.tipStateHint.textContent = "先選一個狀態，句子會更貼近現在。";
      return false;
    }
    return true;
  }

  function pickTip(type){ // type: inner/outer
    if(!ensureTipState()) return;
    const st = state.tipSelectedState;
    const ag = state.ageMode;

    const pack = tipsByStateAndAge[st]?.[ag];
    const pool = pack?.[type];
    if(!pool || pool.length === 0){
      el.praiseOut.textContent = "句庫還在準備中，先換個狀態再試一次。";
      return;
    }

    const text = pick(pool);

    if(type==="inner"){
      state.currentInner = text;
      el.innerOut.textContent = text;
      state.recentInner = pushRecent(state.recentInner, text);
    }else{
      state.currentOuter = text;
      el.outerOut.textContent = text;
      state.recentOuter = pushRecent(state.recentOuter, text);
    }

    state.todayTipCount += 1;
    saveState();

    addWater(1);
    el.praiseOut.textContent = "使用一次錦囊 +1 水滴。";
    renderTop();
    renderLists();
  }

  // ---------- Daily practice (v1.6 + v1.8) ----------
  let dTotal = 60;
  let dLeft = dTotal;
  let dTimerId = null;

  function setDailyTimer(sec){
    const mm = String(Math.floor(sec/60)).padStart(2,"0");
    const ss = String(sec%60).padStart(2,"0");
    el.dailyTimer.textContent = `${mm}:${ss}`;
  }

  function startDaily(){
    if(!state.dailySelectedState){
      el.stateHint.textContent = "先選一個狀態，系統才知道要幫你練哪一種說法。";
      return;
    }
    if(dTimerId) return;

    dLeft = dTotal;
    setDailyTimer(dLeft);
    el.dailyStep.textContent = dailyStateBody[state.dailySelectedState];

    dTimerId = setInterval(()=>{
      dLeft--;
      if(dLeft < 0) dLeft = 0;
      setDailyTimer(dLeft);
      if(dLeft <= 0){
        stopDaily(true);
      }
    }, 1000);
  }

  function stopDaily(done){
    if(dTimerId){
      clearInterval(dTimerId);
      dTimerId = null;
    }
    if(!done){
      el.dailyStep.textContent = "先停一下也可以。";
    }else{
      el.dailyStep.textContent = "完成 60 秒。接下來選一句就好。";
      setDailyTimer(60);
    }
  }

  function showDailyResultCard(){
    if(!state.dailySelectedState){
      el.stateHint.textContent = "先選一個狀態，才會有下一句。";
      return;
    }
    const st = state.dailySelectedState;
    const ag = state.ageMode;

    const [a,b] = dailyLines(st, ag);
    state.dailyOptionA = a;
    state.dailyOptionB = b;
    saveState();

    el.resultCard.hidden = false;
    el.resultState.textContent = "狀態：" + ({
      slow:"🐢 先慢下來",
      clear:"📋 把事情說清楚",
      stand:"🧍 站好位置",
      soft:"🌱 讓關係軟一點"
    }[st] || "—");

    el.resultBody.textContent = "身體提醒：" + (dailyStateBody[st] || "先讓呼吸慢一點。");
    el.resultA.textContent = a;
    el.resultB.textContent = b;

    el.dailyResult.textContent = "選一句就好：系統會幫你複製，並放到「說出口的」區。";
  }

  function commitDaily(text){
    const t = todayStr();

    // 1) 放到「說出口」
    state.currentOuter = text;
    el.outerOut.textContent = text;
    state.recentOuter = pushRecent(state.recentOuter, text);

    // 2) 每日練功：首次入帳 +3（同一天不重複）
    if(!(state.earnedDailyToday && state.lastDailyDate === t)){
      if(!state.lastDailyDate){
        state.streak = 1;
      }else{
        const diff = dayDiff(state.lastDailyDate, t);
        if(diff === 1) state.streak += 1;
        else if(diff === 0) { /* same day */ }
        else state.streak = 1;
      }
      state.didDailyToday = true;
      state.lastDailyDate = t;
      state.earnedDailyToday = true;

      saveState();
      addWater(3);
      el.dailyResult.textContent = "完成今日練功 ✅（+3 水滴）已入帳。";
    }else{
      state.didDailyToday = true;
      saveState();
      renderTop();
      el.dailyResult.textContent = "今天已完成練功 ✅ 水滴已入帳。";
    }

    saveState();
    renderTop();
    renderLists();

    copyText(text);
  }

  function resetDailyAreaOnly(){
    if(dTimerId){
      clearInterval(dTimerId);
      dTimerId = null;
    }
    state.dailySelectedState = "";
    state.dailyOptionA = "";
    state.dailyOptionB = "";
    saveState();

    el.stateHint.textContent = "（點一個，系統會提醒你身體怎麼配合）";
    el.dailyStep.textContent = "先讓身體慢一點。";
    el.dailyResult.textContent = "（完成後，這裡會出現一句回饋）";
    el.resultCard.hidden = true;

    document.querySelectorAll("#stateChoices .pill").forEach(p=>p.classList.remove("active"));
    setDailyTimer(60);
  }

  // ---------- Reset today ----------
  function resetToday(){
    normalizeToday();

    state.todayTipCount = 0;
    state.todayRescueCount = 0;
    state.didDailyToday = false;
    state.earnedDailyToday = false;

    const t = todayStr();
    if(state.lastDailyDate === t){
      state.lastDailyDate = "";
    }

    state.dailySelectedState = "";
    state.dailyOptionA = "";
    state.dailyOptionB = "";

    saveState();
    renderTop();

    el.praiseOut.textContent = "今日已重設。重新開始也很好。";
    state.currentInner = "";
    state.currentOuter = "";
    el.innerOut.textContent = "（會出現一句內在提示）";
    el.outerOut.textContent = "（會出現一句可說出口的話）";

    setTimer(30);
    setGuide("先讓臉放鬆。");
    resetDailyAreaOnly();
  }

  // ---------- Garden ----------
  function fullReset(){
    localStorage.removeItem(KEY);
    state = defaultState();
    saveState();
    normalizeToday();
    ensureAgeMode();

    el.gardenOut.textContent = "已全部清空。重新開始也很棒。";
    el.praiseOut.textContent = "回到起點，反而更容易走得穩。";

    setTimer(30);
    setGuide("先讓臉放鬆。");
    setDailyTimer(60);
    resetDailyAreaOnly();

    renderTop();
    renderGarden();
    renderLists();

    // clear tip state UI
    state.tipSelectedState = "";
    document.querySelectorAll("#tipStateChoices .pill").forEach(p=>p.classList.remove("active"));
    el.tipStateHint.textContent = "（先選狀態，再抽句會更準）";
    saveState();
  }

  // ---------- Events (delegation) ----------
  document.addEventListener("click", function(e){
    const id = e.target && e.target.id;

    // modal
    if(id === "btnCloseModal") return closeCopyModal();
    if(id === "btnSelectAll"){
      el.copyBox.focus();
      el.copyBox.select();
      el.praiseOut.textContent = "已全選，接著按手機的「複製」即可。";
      return;
    }
    if(id === "copyModal") return closeCopyModal();

    // age choose
    const ageBtn = e.target && e.target.closest && e.target.closest("#ageChoices .pill.age");
    if(ageBtn){
      const a = ageBtn.dataset.age;
      state.ageMode = a;
      saveState();
      ensureAgeMode();
      el.praiseOut.textContent = `已切換對象：${AGE_LABELS[a]}`;
      // 切換年齡後，不強制清空句子，但提示狀態仍保留
      return;
    }

    // rescue
    if(id === "btnStart") return startRescue();
    if(id === "btnStop") return stopRescue(false);

    if(id === "btnDoneRescue"){
      state.todayRescueCount += 1;
      saveState();
      addWater(1);
      el.praiseOut.textContent = "完成一次急救 +1 水滴。";
      renderTop();
      return;
    }
    if(id === "btnQuickPraise"){
      el.praiseOut.textContent = pick(praises);
      return;
    }

    // tip state (v1.7)
    const tipPill = e.target && e.target.closest && e.target.closest("#tipStateChoices .pill");
    if(tipPill){
      document.querySelectorAll("#tipStateChoices .pill").forEach(p=>p.classList.remove("active"));
      tipPill.classList.add("active");
      state.tipSelectedState = tipPill.dataset.state;
      saveState();
      el.tipStateHint.textContent = "已選狀態：現在抽句會更貼近現場。";
      return;
    }

    // tips
    if(id === "btnInner") return pickTip("inner");
    if(id === "btnOuter") return pickTip("outer");

    if(id === "btnFavInnerAdd") return addFavorite("inner");
    if(id === "btnFavOuterAdd") return addFavorite("outer");

    if(id === "btnCopyInner") return copyText(state.currentInner || el.innerOut.textContent);
    if(id === "btnCopyOuter") return copyText(state.currentOuter || el.outerOut.textContent);

    // daily state choose
    const pill = e.target && e.target.closest && e.target.closest("#stateChoices .pill");
    if(pill){
      document.querySelectorAll("#stateChoices .pill").forEach(p=>p.classList.remove("active"));
      pill.classList.add("active");
      state.dailySelectedState = pill.dataset.state;
      saveState();

      el.stateHint.textContent = dailyStateBody[state.dailySelectedState];
      el.dailyStep.textContent = dailyStateBody[state.dailySelectedState];
      el.resultCard.hidden = true;
      el.dailyResult.textContent = "選好狀態後，開始 60 秒，完成就會有 2 句可用。";
      return;
    }

    // daily buttons
    if(id === "btnDailyStart") return startDaily();
    if(id === "btnDailyStop") return stopDaily(false);
    if(id === "btnDailyDone"){
      stopDaily(true);
      showDailyResultCard();
      return;
    }
    if(id === "btnDailyReset") return resetDailyAreaOnly();

    if(id === "btnUseA") return commitDaily(state.dailyOptionA || el.resultA.textContent);
    if(id === "btnUseB") return commitDaily(state.dailyOptionB || el.resultB.textContent);

    // garden
    if(id === "btnGardenNote"){
      el.gardenOut.textContent = pick(gardenCards);
      return;
    }
    if(id === "btnAllReset") return fullReset();

    // reset today
    if(id === "btnResetToday") return resetToday();

    // list actions
    const action = e.target && e.target.dataset && e.target.dataset.action;
    if(action === "useLine"){
      const type = e.target.dataset.type;
      const text = e.target.dataset.text;
      useFromList(type, text);
      el.praiseOut.textContent = "已套用這一句。";
      return;
    }
    if(action === "copyLine"){
      const text = e.target.dataset.text;
      return copyText(text);
    }
    if(action === "delFav"){
      const type = e.target.dataset.type;
      const idx = parseInt(e.target.dataset.idx, 10);
      removeFavorite(type, idx);
      el.praiseOut.textContent = "已從最愛移除。";
      return;
    }
  });

  // ---------- Init ----------
  function init(){
    normalizeToday();
    ensureAgeMode();
    renderTop();
    renderGarden();
    renderLists();

    setTimer(30);
    setGuide("先讓臉放鬆。");

    setDailyTimer(60);
    el.dailyStep.textContent = "先讓身體慢一點。";

    // restore daily state UI (optional)
    if(state.dailySelectedState){
      const btn = document.querySelector(`#stateChoices .pill[data-state="${state.dailySelectedState}"]`);
      if(btn) btn.classList.add("active");
      el.stateHint.textContent = dailyStateBody[state.dailySelectedState];
    }else{
      el.stateHint.textContent = "（點一個，系統會提醒你身體怎麼配合）";
    }

    // restore tip state UI (v1.7)
    if(state.tipSelectedState){
      const b2 = document.querySelector(`#tipStateChoices .pill[data-state="${state.tipSelectedState}"]`);
      if(b2) b2.classList.add("active");
      el.tipStateHint.textContent = "已選狀態：現在抽句會更貼近現場。";
    }else{
      el.tipStateHint.textContent = "（先選狀態，再抽句會更準）";
    }
  }

  init();
})();
