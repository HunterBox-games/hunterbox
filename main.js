/* HunterBox main app logic */

(function(){
  const AVATARS = ["🦊","🐸","🐙","🦄","🐝","🐬","🦋","🐢","🐼","🦁","🐨","🐯"];

  const lobbyView = document.getElementById("lobbyView");
  const gameShell = document.getElementById("gameShell");
  const gameGrid = document.getElementById("gameGrid");
  const stage = document.getElementById("stage");
  const backBtn = document.getElementById("backBtn");
  const scorePill = document.getElementById("scorePill");
  const gameTitleBar = document.getElementById("gameTitleBar");
  const playerChip = document.getElementById("playerChip");
  const playerAvatar = document.getElementById("playerAvatar");
  const playerName = document.getElementById("playerName");

  let currentScore = 0;
  let currentGame = null;

  /* ---------- stars background ---------- */
  function makeStars(){
    const wrap = document.getElementById("stars");
    const n = 40;
    for(let i=0;i<n;i++){
      const s = document.createElement("div");
      s.className = "star";
      const size = Math.random()*2.5+1;
      s.style.width = size+"px";
      s.style.height = size+"px";
      s.style.left = Math.random()*100+"%";
      s.style.top = Math.random()*100+"%";
      s.style.animationDelay = (Math.random()*3)+"s";
      wrap.appendChild(s);
    }
  }
  makeStars();

  /* ---------- player identity (local, casual — no accounts) ---------- */
  function loadPlayer(){
    let name = "Player";
    let avatar = AVATARS[Math.floor(Math.random()*AVATARS.length)];
    try{
      const saved = JSON.parse(localStorage.getItem("hunterbox_player") || "null");
      if(saved){ name = saved.name; avatar = saved.avatar; }
    }catch(e){}
    playerName.textContent = name;
    playerAvatar.textContent = avatar;
  }
  function savePlayer(name, avatar){
    playerName.textContent = name;
    playerAvatar.textContent = avatar;
    try{ localStorage.setItem("hunterbox_player", JSON.stringify({name, avatar})); }catch(e){}
  }
  loadPlayer();

  playerChip.onclick = () => {
    const newAvatar = AVATARS[Math.floor(Math.random()*AVATARS.length)];
    const name = prompt("What's your player name?", playerName.textContent) || playerName.textContent;
    savePlayer(name.slice(0,16), newAvatar);
  };

  /* ---------- hunters-here roster (local group list, no real internet sync) ---------- */
  const onlineChip = document.getElementById("onlineChip");
  const onlineCount = document.getElementById("onlineCount");
  const onlinePlural = document.getElementById("onlinePlural");
  const rosterOverlay = document.getElementById("rosterOverlay");
  const rosterClose = document.getElementById("rosterClose");
  const rosterList = document.getElementById("rosterList");
  const rosterInput = document.getElementById("rosterInput");
  const rosterAdd = document.getElementById("rosterAdd");

  function loadRoster(){
    try{
      const saved = JSON.parse(localStorage.getItem("hunterbox_roster") || "null");
      if(saved && Array.isArray(saved) && saved.length) return saved;
    }catch(e){}
    return [{ name: playerName.textContent, avatar: playerAvatar.textContent }];
  }
  function saveRoster(roster){
    try{ localStorage.setItem("hunterbox_roster", JSON.stringify(roster)); }catch(e){}
  }
  let roster = loadRoster();

  function renderRoster(){
    onlineCount.textContent = roster.length;
    onlinePlural.textContent = roster.length === 1 ? "" : "s";
    rosterList.innerHTML = "";
    if(roster.length === 0){
      rosterList.innerHTML = `<p style="color:var(--text-dim);font-size:13px;text-align:center;margin:10px 0;">No hunters added yet!</p>`;
    }
    roster.forEach((p, i) => {
      const row = document.createElement("div");
      row.className = "roster-row";
      row.innerHTML = `<div class="avatar">${p.avatar}</div><span>${p.name}</span><button data-i="${i}">✕</button>`;
      row.querySelector("button").onclick = () => {
        roster.splice(i,1);
        saveRoster(roster);
        renderRoster();
      };
      rosterList.appendChild(row);
    });
  }

  function addHunter(){
    const name = rosterInput.value.trim().slice(0,16);
    if(!name) return;
    const avatar = AVATARS[Math.floor(Math.random()*AVATARS.length)];
    roster.push({ name, avatar });
    saveRoster(roster);
    rosterInput.value = "";
    renderRoster();
  }

  onlineChip.onclick = () => { renderRoster(); rosterOverlay.classList.add("active"); };
  rosterClose.onclick = () => rosterOverlay.classList.remove("active");
  rosterOverlay.onclick = (e) => { if(e.target === rosterOverlay) rosterOverlay.classList.remove("active"); };
  rosterAdd.onclick = addHunter;
  rosterInput.onkeydown = (e) => { if(e.key === "Enter") addHunter(); };

  renderRoster();

  /* ---------- lobby rendering ---------- */
  function renderLobby(){
    gameGrid.innerHTML = "";
    HB_GAMES.forEach(game => {
      const card = document.createElement("div");
      card.className = "game-card";
      const p = game.players || "1+ players";
      const isGroup = p !== "1 player";
      card.innerHTML = `
        <div class="badge ${isGroup ? 'players' : ''}">${p.toUpperCase()}</div>
        <div class="icon ${game.iconClass}">${game.icon}</div>
        <h3>${game.title}</h3>
        <p>${game.desc}</p>
      `;
      card.onclick = () => openGame(game);
      gameGrid.appendChild(card);
    });
  }
  renderLobby();

  /* ---------- game shell / router ---------- */
  function openGame(game){
    currentGame = game;
    currentScore = 0;
    scorePill.textContent = "Score: 0";
    gameTitleBar.innerHTML = `<span style="font-size:20px;">${game.icon}</span> ${game.title}`;
    lobbyView.classList.remove("active");
    gameShell.classList.add("active");
    stage.innerHTML = "";

    const api = {
      setScore(n){ currentScore = n; scorePill.textContent = "Score: " + currentScore; },
      addScore(n){ currentScore += n; if(currentScore<0) currentScore=0; scorePill.textContent = "Score: " + currentScore; },
      endGame(message){ showEndScreen(message); },
      stage
    };
    game.init(stage, api);
  }

  function showEndScreen(message){
    const finalScore = currentScore;
    stage.innerHTML = `
      <div class="center-msg">
        <div class="emoji">🏆</div>
        <h3>${message}</h3>
        <p>Final score: <strong style="color:var(--yellow);font-size:20px;">${finalScore}</strong></p>
        <div style="display:flex;gap:10px;">
          <button class="big-btn" id="playAgainBtn">Play again 🔁</button>
          <button class="big-btn blue" id="toLobbyBtn">Back to games 📦</button>
        </div>
      </div>
    `;
    document.getElementById("playAgainBtn").onclick = () => openGame(currentGame);
    document.getElementById("toLobbyBtn").onclick = closeGame;
  }

  function closeGame(){
    if(currentGame && typeof currentGame.cleanup === "function"){
      currentGame.cleanup(stage);
    }
    gameShell.classList.remove("active");
    lobbyView.classList.add("active");
    currentGame = null;
  }

  backBtn.onclick = closeGame;

})();
