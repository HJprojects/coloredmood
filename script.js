window.addEventListener("DOMContentLoaded", () => {
  // ===== elements =====
  const moodInput = document.getElementById("moodInput");
  const goBtn = document.getElementById("goBtn");
  const chips = document.getElementById("chips");

  const moodText = document.getElementById("moodText");
  const hexText = document.getElementById("hexText");
  const copyBtn = document.getElementById("copyBtn");
  const shuffleBtn = document.getElementById("shuffleBtn");

  const sw1 = document.getElementById("sw1");
  const sw2 = document.getElementById("sw2");
  const sw3 = document.getElementById("sw3");

  // overlay
  const overlay = document.getElementById("overlay");
  const overlayBg = document.getElementById("overlayBg");
  const overlayLine = document.getElementById("overlayLine");
  const closeOverlay = document.getElementById("closeOverlay");

  // bgm
  const bgm = document.getElementById("bgm");
  const toggleBgm = document.getElementById("toggleBgm");
  bgm.src = "https://cdn.jsdelivr.net/gh/HayleyJung/Dreamy-mood@main/tunetank-dreamy-ambient-347935.mp3";

  toggleBgm.addEventListener("click", async () => {
    try{
      if (bgm.paused) {
        await bgm.play();
        toggleBgm.textContent = "♫";
      } else {
        bgm.pause();
        toggleBgm.textContent = "♪";
      }
    }catch(e){
      console.log(e);
    }
  });

  // ===== mood dictionary =====
  const MOODS = [
    { keys: ["설렘","두근","기대","떨림"], base: ["#FF4FD8","#8B5CFF","#37F6D8"] },
    { keys: ["평온","안정","차분","힐링","휴식"], base: ["#77FFD2","#7AA7FF","#F6FF7A"] },
    { keys: ["불안","긴장","초조","걱정","무서움"], base: ["#6A5BFF","#00E5FF","#FFB86B"] },
    { keys: ["위로","따뜻","포근","감싸","괜찮"], base: ["#FFD1A6","#FF7BD5","#A9FFEA"] },
    { keys: ["자유","해방","바람","여행","하늘"], base: ["#00E5FF","#7CFF6B","#FFD76A"] },
    { keys: ["그리움","추억","미련","보고싶"], base: ["#B28CFF","#FF9ECF","#6AE5FF"] },
    { keys: ["행복","기쁨","웃음","좋아","사랑"], base: ["#FFEA6A","#FF6BD6","#7CFFB0"] },
    { keys: ["슬픔","눈물","우울","허무"], base: ["#5D7BFF","#9A7BFF","#6AE5FF"] }
  ];

  // ===== helpers =====
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  function hexToHsl(hex){
    const c = hex.replace("#","").match(/.{1,2}/g).map(v=>parseInt(v,16)/255);
    const [r,g,b] = c;
    const max = Math.max(r,g,b), min = Math.min(r,g,b);
    let h=0, s=0, l=(max+min)/2;
    const d = max-min;
    if(d!==0){
      s = d / (1 - Math.abs(2*l - 1));
      switch(max){
        case r: h = ((g-b)/d) % 6; break;
        case g: h = (b-r)/d + 2; break;
        case b: h = (r-g)/d + 4; break;
      }
      h = Math.round(h*60);
      if(h<0) h+=360;
    }
    return {h, s: s*100, l: l*100};
  }

  function hslToHex(h,s,l){
    s/=100; l/=100;
    const c = (1 - Math.abs(2*l - 1)) * s;
    const x = c * (1 - Math.abs((h/60)%2 - 1));
    const m = l - c/2;
    let r=0,g=0,b=0;
    if(0<=h && h<60){ r=c; g=x; b=0; }
    else if(60<=h && h<120){ r=x; g=c; b=0; }
    else if(120<=h && h<180){ r=0; g=c; b=x; }
    else if(180<=h && h<240){ r=0; g=x; b=c; }
    else if(240<=h && h<300){ r=x; g=0; b=c; }
    else { r=c; g=0; b=x; }
    const toHex = v => Math.round((v+m)*255).toString(16).padStart(2,"0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  function vary(hex, seed){
    const {h,s,l} = hexToHsl(hex);
    const nh = (h + (seed*37)%36 - 18 + 360) % 360;
    const ns = clamp(s + ((seed*19)%16 - 8), 52, 92);
    const nl = clamp(l + ((seed*23)%18 - 9), 38, 78);
    return hslToHex(nh, ns, nl);
  }

  function pickPalette(mood){
    const lower = mood.trim().toLowerCase();
    let base = ["#77FFD2","#7AA7FF","#F6FF7A"]; // default dreamy
    for(const row of MOODS){
      if(row.keys.some(k => lower.includes(k))) { base = row.base; break; }
    }
    const seed = Math.floor(Math.random()*9999);
    return base.map((h,i)=> vary(h, seed + i*11));
  }

  function setBackground(p){
    document.documentElement.style.setProperty("--bg2", p[0]);
    document.documentElement.style.setProperty("--bg3", p[1]);
    document.documentElement.style.setProperty("--bg4", p[2]);

    sw1.style.background = `linear-gradient(135deg, ${p[0]}, ${vary(p[0], 7)})`;
    sw2.style.background = `linear-gradient(135deg, ${p[1]}, ${vary(p[1], 13)})`;
    sw3.style.background = `linear-gradient(135deg, ${p[2]}, ${vary(p[2], 19)})`;
  }

  // ===== overlay story: one line at a time =====
  let storyTimers = [];
  function clearStoryTimers(){
    storyTimers.forEach(id => clearTimeout(id));
    storyTimers = [];
  }

  function showOverlayWithStory(mood, palette){
  clearStoryTimers();
  startSparkles();

  // 배경 먼저 보여줌 + 움직이는 그라데이션(아래 CSS랑 같이)
  overlayBg.style.setProperty("--c1", palette[0]);
  overlayBg.style.setProperty("--c2", palette[1]);
  overlayBg.style.setProperty("--c3", palette[2]);

  overlay.classList.add("show");
  overlay.setAttribute("aria-hidden", "false");

  overlayLine.textContent = "";
  overlayLine.classList.remove("show","hide");

  const lines = [
    `오늘 당신은 "${mood}"을(를) 제일 크게 느꼈군요`,
    `수고했어요 정말`,
    `당신은 오늘도 잘 지나왔어요`,
    `내일의 당신은... 또 어떤 색일까요?`
  ];

  // ✅ 더 느리게
  const startDelay = 3500; // 배경 먼저 3.5초
  const showFor = 3200;    // 한 문장 3.2초 떠있기
  const gap = 1200;        // 문장 사이 텀 넓게

  let t = startDelay;

  // 마지막 문장 전까지는 자동으로 보여줬다 사라짐
  for(let i = 0; i < lines.length; i++){
    const text = lines[i];
    const isLast = (i === lines.length - 1);

    // show
    storyTimers.push(setTimeout(() => {
      overlayLine.textContent = text;
      overlayLine.classList.remove("hide");
      requestAnimationFrame(() => overlayLine.classList.add("show"));
    }, t));

    if(!isLast){
      // hide (위로 날아가며)
      storyTimers.push(setTimeout(() => {
        overlayLine.classList.remove("show");
        overlayLine.classList.add("hide");
      }, t + showFor));

      t += showFor + gap;
    }else{
      // ✅ 마지막 문장은 "탭할 때까지" 유지
      // (자동 hide 없음)
    }
  }
}

  function hideOverlay(){
    stopSparkles();
    clearStoryTimers();
    overlay.classList.remove("show");
    overlay.setAttribute("aria-hidden", "true");
    overlayLine.classList.remove("show","hide");
    overlayLine.textContent = "";
  }

 // ✅ 마지막 문장 상태에서만 탭하면 닫기
overlay.addEventListener("click", (e) => {
  // X 버튼 누른 건 위에서 처리되므로 제외
  if (e.target && e.target.id === "closeOverlay") return;

  // 지금 문장이 마지막 문장인지 확인
  const lastText = `내일의 당신은... 또 어떤 색일까요?`;
  if (overlay.classList.contains("show") && overlayLine.textContent === lastText){
    hideOverlay();
  }
});
  closeOverlay.addEventListener("click", hideOverlay);
  document.addEventListener("keydown", (e)=>{
    if(e.key === "Escape" && overlay.classList.contains("show")) hideOverlay();
  });

  // ===== main apply =====
  // openOverlay=false: 기본 화면 미리보기만 (엔터/칩)
  // openOverlay=true : 전체화면 + 스토리 (변환하기 버튼)
  function applyMood(m, opts = { openOverlay: false }){
    const mood = (m || "").trim() || "평온";
    const palette = pickPalette(mood);

    // 기본 화면 업데이트(항상)
    setBackground(palette);
    moodText.textContent = mood;
    hexText.textContent = palette.join("  ");

    if(opts.openOverlay){
      showOverlayWithStory(mood, palette);
    }
  }

  // ✅ 변환하기만 전체화면으로
  goBtn.addEventListener("click", () => applyMood(moodInput.value, { openOverlay: true }));

  // ✅ 엔터는 미리보기만 (오버레이 X)
  moodInput.addEventListener("keydown", (e)=> {
    if(e.key === "Enter") applyMood(moodInput.value, { openOverlay: false });
  });

  // ✅ 칩 선택도 미리보기만 (오버레이 X)
  chips.addEventListener("click", (e)=>{
    const btn = e.target.closest(".chip");
    if(!btn) return;
    moodInput.value = btn.textContent;
    applyMood(btn.textContent, { openOverlay: false });
  });

  copyBtn.addEventListener("click", async ()=>{
    const text = hexText.textContent === "—" ? "" : hexText.textContent;
    if(!text) return;
    try{
      await navigator.clipboard.writeText(text);
      copyBtn.textContent = "복사 완료 ✦";
      setTimeout(()=> copyBtn.textContent = "팔레트 복사", 900);
    }catch{
      copyBtn.textContent = "복사 실패";
      setTimeout(()=> copyBtn.textContent = "팔레트 복사", 900);
    }
  });

  shuffleBtn.addEventListener("click", ()=>{
    applyMood(moodText.textContent || moodInput.value || "평온", { openOverlay: false });
  });

  // 초기: 기본 화면만
  applyMood("설렘", { openOverlay: false });
});

const overlayStars = document.getElementById("overlayStars");
let sparkleInterval;

function createStar(){
  const star = document.createElement("div");
  star.className = "star";

  const size = Math.random() * 4 + 2;
  star.style.width = size + "px";
  star.style.height = size + "px";

  star.style.left = Math.random() * 100 + "%";
  star.style.top = Math.random() * 100 + "%";

  const duration = Math.random() * 2 + 1.5;
  star.style.setProperty("--duration", duration + "s");

  overlayStars.appendChild(star);

  setTimeout(() => {
    star.remove();
  }, duration * 1000);
}

function startSparkles(){
  sparkleInterval = setInterval(() => {
    for(let i=0; i<4; i++){
      createStar();
    }
  }, 300);
}

function stopSparkles(){
  clearInterval(sparkleInterval);
  overlayStars.innerHTML = "";
}
