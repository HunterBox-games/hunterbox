/* HunterBox mini-games
   Each game object has: id, title, icon, iconClass, tag, desc, players ("1+" etc), init(stage, api)
   api = { setScore(n), addScore(n), endGame(msg), stage }
*/

const HB_GAMES = [];

/* ---------------------------------------------------------
   1. HOT POTATO TAG - pass-the-device party game
--------------------------------------------------------- */
HB_GAMES.push({
  id: "hotpotato",
  title: "Hot Potato Tag",
  icon: "🥔",
  iconClass: "tag",
  tag: "Party",
  players: "2+ players",
  desc: "Pass the device around before the potato explodes!",
  init(stage, api){
    const self = this;
    self._active = true;
    stage.innerHTML = `
      <div class="center-msg" id="hpStart">
        <div class="emoji">🥔</div>
        <h3>Hot Potato Tag</h3>
        <p>Sit in a circle. Pass the device to the next player as fast as you can. Whoever is holding it when it "pops" is out for that round!</p>
        <button class="big-btn" id="hpBegin">Start round 🔥</button>
      </div>
    `;
    document.getElementById("hpBegin").onclick = () => startRound();

    function startRound(){
      const delay = 4000 + Math.random()*7000;
      let popped = false;
      stage.innerHTML = `
        <div class="center-msg">
          <div class="emoji" id="hpPotato" style="font-size:90px;transition:transform .15s;">🥔</div>
          <h3>Pass it around!</h3>
          <p>Keep passing... don't be holding it when it pops 💥</p>
          <button class="big-btn pink" id="hpPass">I passed it! ➡️</button>
        </div>
      `;
      const potato = document.getElementById("hpPotato");
      document.getElementById("hpPass").onclick = () => {
        potato.style.transform = `scale(1.15) rotate(${Math.random()*30-15}deg)`;
        setTimeout(()=> potato.style.transform = "scale(1) rotate(0deg)", 150);
        api.addScore(1);
      };
      self._potatoTimer = setTimeout(()=>{
        if (popped || !self._active) return;
        popped = true;
        stage.innerHTML = `
          <div class="center-msg">
            <div class="emoji">💥</div>
            <h3>POP! You're out!</h3>
            <p>Whoever is holding the device now sits out this round. Everyone else, play again!</p>
            <button class="big-btn" id="hpAgain">New round 🥔</button>
          </div>
        `;
        document.getElementById("hpAgain").onclick = startRound;
      }, delay);
    }
  },
  cleanup(){
    this._active = false;
    if(this._potatoTimer) clearTimeout(this._potatoTimer);
  }
});

/* ---------------------------------------------------------
   2. WHACK-A-MOLE
--------------------------------------------------------- */
HB_GAMES.push({
  id: "whackamole",
  title: "Whack-a-Mole",
  icon: "🐹",
  iconClass: "mole",
  tag: "Reflex",
  players: "1+ players",
  desc: "Tap the moles before they hide! Fast fingers win.",
  init(stage, api){
    const self = this;
    self._active = true;
    const GRID = 9;
    let timeLeft = 30;
    let running = false;
    let moleTimer = null;
    let clockTimer = null;
    let activeIdx = -1;

    stage.innerHTML = `
      <div class="center-msg" id="wmStart">
        <div class="emoji">🐹</div>
        <h3>Whack-a-Mole</h3>
        <p>Tap the moles as they pop up. You've got 30 seconds — go for the high score!</p>
        <button class="big-btn" id="wmBegin">Start 🔨</button>
      </div>
    `;
    document.getElementById("wmBegin").onclick = begin;

    function begin(){
      api.setScore(0);
      timeLeft = 30;
      running = true;
      stage.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div style="font-weight:800;">⏱ <span id="wmTime">30</span>s</div>
        </div>
        <div id="wmGrid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;"></div>
      `;
      const grid = document.getElementById("wmGrid");
      for(let i=0;i<GRID;i++){
        const hole = document.createElement("div");
        hole.className = "wm-hole";
        hole.style.cssText = "aspect-ratio:1;border-radius:16px;background:#180d30;display:flex;align-items:center;justify-content:center;font-size:34px;cursor:pointer;overflow:hidden;box-shadow:inset 0 4px 10px rgba(0,0,0,.5);";
        hole.dataset.idx = i;
        hole.onclick = () => whack(i, hole);
        grid.appendChild(hole);
      }
      clockTimer = setInterval(()=>{
        if(!self._active){ clearInterval(clockTimer); return; }
        timeLeft--;
        const t = document.getElementById("wmTime");
        if(t) t.textContent = timeLeft;
        if(timeLeft<=0) endGame();
      },1000);
      self._clockTimer = clockTimer;
      popLoop();
    }

    function popLoop(){
      if(!running || !self._active) return;
      const holes = document.querySelectorAll(".wm-hole");
      holes.forEach(h=>{h.textContent="";h.dataset.up="0";});
      const idx = Math.floor(Math.random()*GRID);
      activeIdx = idx;
      const h = holes[idx];
      if(h){ h.textContent="🐹"; h.dataset.up="1"; }
      const speed = 550 + Math.random()*500;
      moleTimer = setTimeout(popLoop, speed);
      self._moleTimer = moleTimer;
    }

    function whack(i, hole){
      if(!running) return;
      if(hole.dataset.up === "1"){
        api.addScore(10);
        hole.textContent = "💥";
        hole.dataset.up = "0";
        setTimeout(()=>{ if(hole.dataset.up==="0") hole.textContent=""; }, 150);
      }
    }

    function endGame(){
      running = false;
      clearInterval(clockTimer);
      clearTimeout(moleTimer);
      api.endGame("Time's up! 🐹");
    }
  },
  cleanup(){
    this._active = false;
    if(this._clockTimer) clearInterval(this._clockTimer);
    if(this._moleTimer) clearTimeout(this._moleTimer);
  }
});

/* ---------------------------------------------------------
   3. TRIVIA PARTY - kid friendly Q&A, pass the device
--------------------------------------------------------- */
const HB_TRIVIA = [
  {q:"What do bees make?", a:["Honey","Milk","Bread","Silk"], c:0},
  {q:"How many legs does a spider have?", a:["6","8","10","4"], c:1},
  {q:"What planet do we live on?", a:["Mars","Venus","Earth","Jupiter"], c:2},
  {q:"What color do you get mixing blue and yellow?", a:["Purple","Green","Orange","Pink"], c:1},
  {q:"Which animal is known as the King of the Jungle?", a:["Tiger","Elephant","Lion","Bear"], c:2},
  {q:"How many days are in a week?", a:["5","6","7","8"], c:2},
  {q:"What do caterpillars turn into?", a:["Bees","Butterflies","Beetles","Birds"], c:1},
  {q:"What's the largest ocean on Earth?", a:["Atlantic","Indian","Arctic","Pacific"], c:3},
  {q:"Which shape has three sides?", a:["Square","Triangle","Circle","Hexagon"], c:1},
  {q:"What gas do plants breathe in?", a:["Oxygen","Helium","Carbon dioxide","Nitrogen"], c:2},
  {q:"How many continents are there?", a:["5","7","9","3"], c:1},
  {q:"What do you call a baby dog?", a:["Kitten","Cub","Puppy","Foal"], c:2},
  {q:"Which season comes after winter?", a:["Summer","Fall","Spring","Autumn"], c:2},
  {q:"What's the fastest land animal?", a:["Lion","Cheetah","Horse","Zebra"], c:1},
  {q:"How many colors are in a rainbow?", a:["5","6","7","8"], c:2},
];

HB_GAMES.push({
  id: "trivia",
  title: "Trivia Party",
  icon: "🧠",
  iconClass: "trivia",
  tag: "Quiz",
  players: "2+ players",
  desc: "Pass the device and answer fun kid trivia questions!",
  init(stage, api){
    const self = this;
    self._active = true;
    let qIndex = 0;
    let order = [...Array(HB_TRIVIA.length).keys()].sort(()=>Math.random()-0.5);

    stage.innerHTML = `
      <div class="center-msg">
        <div class="emoji">🧠</div>
        <h3>Trivia Party</h3>
        <p>Take turns! Pass the device to the next player for each question. Get it right to score a point for your team.</p>
        <button class="big-btn" id="trBegin">Start quiz 🎯</button>
      </div>
    `;
    document.getElementById("trBegin").onclick = ()=>{ api.setScore(0); showQ(); };

    function showQ(){
      if(qIndex >= order.length){
        api.endGame("Quiz complete! 🎉");
        return;
      }
      const item = HB_TRIVIA[order[qIndex]];
      const shuffledAnswers = item.a.map((txt,i)=>({txt,correct:i===item.c}));
      shuffledAnswers.sort(()=>Math.random()-0.5);

      stage.innerHTML = `
        <div style="text-align:center;color:var(--text-dim);font-weight:700;margin-bottom:6px;">Question ${qIndex+1} of ${order.length}</div>
        <h3 style="text-align:center;font-size:19px;margin:0 0 20px;">${item.q}</h3>
        <div id="trAnswers" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;"></div>
      `;
      const wrap = document.getElementById("trAnswers");
      shuffledAnswers.forEach(ans=>{
        const btn = document.createElement("button");
        btn.textContent = ans.txt;
        btn.style.cssText = "padding:16px 10px;border-radius:16px;border:none;background:var(--panel-light);color:var(--text);font-weight:700;font-size:15px;cursor:pointer;box-shadow:0 4px 0 rgba(0,0,0,.3);";
        btn.onclick = ()=>{
          if(ans.correct){
            btn.style.background = "var(--green)";
            btn.style.color = "#04241a";
            api.addScore(10);
          } else {
            btn.style.background = "var(--pink)";
            btn.style.color="#3a0a20";
          }
          Array.from(wrap.children).forEach(c=>c.onclick=null);
          self._triviaTimer = setTimeout(()=>{
            if(!self._active) return;
            qIndex++; showQ();
          }, 900);
        };
        wrap.appendChild(btn);
      });
    }
  },
  cleanup(){
    this._active = false;
    if(this._triviaTimer) clearTimeout(this._triviaTimer);
  }
});

/* ---------------------------------------------------------
   4. MEMORY MATCH
--------------------------------------------------------- */
HB_GAMES.push({
  id: "memory",
  title: "Memory Match",
  icon: "🃏",
  iconClass: "memory",
  tag: "Brain",
  players: "1+ players",
  desc: "Flip cards and find all the matching pairs!",
  init(stage, api){
    const EMOJI = ["🦊","🐸","🐙","🦄","🐝","🐬","🦋","🐢"];
    stage.innerHTML = `
      <div class="center-msg">
        <div class="emoji">🃏</div>
        <h3>Memory Match</h3>
        <p>Flip two cards at a time and find the matching pairs. Fewer flips = higher score!</p>
        <button class="big-btn" id="memBegin">Start 🔍</button>
      </div>
    `;
    document.getElementById("memBegin").onclick = begin;

    function begin(){
      api.setScore(0);
      let deck = [...EMOJI, ...EMOJI].sort(()=>Math.random()-0.5);
      let flipped = [];
      let matched = new Set();
      let lock = false;
      let flips = 0;

      stage.innerHTML = `<div id="memGrid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;"></div>`;
      const grid = document.getElementById("memGrid");
      deck.forEach((emoji, i)=>{
        const card = document.createElement("div");
        card.style.cssText = "aspect-ratio:1;border-radius:12px;background:var(--purple);display:flex;align-items:center;justify-content:center;font-size:26px;cursor:pointer;box-shadow:0 4px 0 var(--purple-dark);user-select:none;";
        card.dataset.idx = i;
        card.dataset.emoji = emoji;
        card.textContent = "❓";
        card.onclick = ()=> flip(card);
        grid.appendChild(card);
      });

      function flip(card){
        if(lock) return;
        if(flipped.includes(card)) return;
        if(matched.has(card.dataset.idx)) return;
        card.textContent = card.dataset.emoji;
        card.style.background = "var(--panel-light)";
        flipped.push(card);
        if(flipped.length === 2){
          flips++;
          lock = true;
          const [a,b] = flipped;
          if(a.dataset.emoji === b.dataset.emoji){
            matched.add(a.dataset.idx);
            matched.add(b.dataset.idx);
            a.style.background = "var(--green)";
            b.style.background = "var(--green)";
            api.addScore(15);
            flipped = [];
            lock = false;
            if(matched.size === deck.length){
              const bonus = Math.max(0, 100 - flips*3);
              api.addScore(bonus);
              setTimeout(()=> api.endGame("All matched! 🎉"), 500);
            }
          } else {
            setTimeout(()=>{
              a.textContent="❓"; a.style.background="var(--purple)";
              b.textContent="❓"; b.style.background="var(--purple)";
              flipped = [];
              lock = false;
            }, 700);
          }
        }
      }
    }
  }
});

/* ---------------------------------------------------------
   5. REFLEX RUMBLE - tap the target color, avoid the trap
--------------------------------------------------------- */
HB_GAMES.push({
  id: "reflex",
  title: "Reflex Rumble",
  icon: "⚡",
  iconClass: "reflex",
  tag: "Reflex",
  players: "1+ players",
  desc: "Tap the GREEN circle fast! Watch out for red traps.",
  init(stage, api){
    const self = this;
    self._active = true;
    let running = false;
    let timeLeft = 25;
    let clockTimer, spawnTimer;

    stage.innerHTML = `
      <div class="center-msg">
        <div class="emoji">⚡</div>
        <h3>Reflex Rumble</h3>
        <p>Green circles = tap fast for points! Red circles = don't touch, they cost you points. 25 seconds on the clock.</p>
        <button class="big-btn" id="rfBegin">Start ⚡</button>
      </div>
    `;
    document.getElementById("rfBegin").onclick = begin;

    function begin(){
      api.setScore(0);
      timeLeft = 25;
      running = true;
      stage.innerHTML = `
        <div style="text-align:center;font-weight:800;margin-bottom:10px;">⏱ <span id="rfTime">25</span>s</div>
        <div id="rfArena" style="position:relative;height:340px;background:#180d30;border-radius:16px;overflow:hidden;box-shadow:inset 0 4px 12px rgba(0,0,0,.4);"></div>
      `;
      clockTimer = setInterval(()=>{
        if(!self._active){ clearInterval(clockTimer); return; }
        timeLeft--;
        const t = document.getElementById("rfTime");
        if(t) t.textContent = timeLeft;
        if(timeLeft<=0) endGame();
      },1000);
      self._clockTimer = clockTimer;
      spawn();
    }

    function spawn(){
      if(!running || !self._active) return;
      const arena = document.getElementById("rfArena");
      if(!arena){ return; }
      const isTrap = Math.random() < 0.35;
      const size = 46 + Math.random()*24;
      const dot = document.createElement("div");
      const maxX = arena.clientWidth - size;
      const maxY = arena.clientHeight - size;
      dot.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;
        left:${Math.random()*maxX}px;top:${Math.random()*maxY}px;
        background:${isTrap ? "var(--pink)" : "var(--green)"};
        box-shadow:0 4px 10px rgba(0,0,0,.4);cursor:pointer;
        display:flex;align-items:center;justify-content:center;font-size:20px;`;
      dot.textContent = isTrap ? "✖" : "✓";
      let clicked = false;
      dot.onclick = ()=>{
        if(clicked) return;
        clicked = true;
        api.addScore(isTrap ? -8 : 12);
        dot.remove();
      };
      arena.appendChild(dot);
      const life = 900 + Math.random()*500;
      setTimeout(()=>{ if(!clicked) dot.remove(); }, life);
      spawnTimer = setTimeout(spawn, 400 + Math.random()*300);
      self._spawnTimer = spawnTimer;
    }

    function endGame(){
      running = false;
      clearInterval(clockTimer);
      clearTimeout(spawnTimer);
      api.endGame("Time's up! ⚡");
    }
  },
  cleanup(){
    this._active = false;
    if(this._clockTimer) clearInterval(this._clockTimer);
    if(this._spawnTimer) clearTimeout(this._spawnTimer);
  }
});

/* ---------------------------------------------------------
   6. MAZE RUNNER - arrow key / tap-controlled maze
--------------------------------------------------------- */
HB_GAMES.push({
  id: "maze",
  title: "Maze Runner",
  icon: "🧩",
  iconClass: "maze",
  tag: "Puzzle",
  players: "1 player",
  desc: "Guide your hunter through the maze to the treasure!",
  init(stage, api){
    const SIZE = 9;
    let level = 1;

    stage.innerHTML = `
      <div class="center-msg">
        <div class="emoji">🧩</div>
        <h3>Maze Runner</h3>
        <p>Use the arrow buttons (or arrow keys) to guide the hunter 🦊 to the treasure 🏆!</p>
        <button class="big-btn" id="mzBegin">Start 🗺️</button>
      </div>
    `;
    document.getElementById("mzBegin").onclick = ()=>{ api.setScore(0); buildLevel(); };

    function genMaze(n){
      const grid = Array.from({length:n},()=>Array(n).fill(1));
      function carve(x,y){
        grid[y][x]=0;
        const dirs = [[0,-2],[0,2],[-2,0],[2,0]].sort(()=>Math.random()-0.5);
        for(const [dx,dy] of dirs){
          const nx=x+dx, ny=y+dy;
          if(nx>0 && ny>0 && nx<n-1 && ny<n-1 && grid[ny][nx]===1){
            grid[y+dy/2][x+dx/2]=0;
            carve(nx,ny);
          }
        }
      }
      carve(1,1);
      grid[n-2][n-2]=0;
      return grid;
    }

    function buildLevel(){
      const maze = genMaze(SIZE);
      let px=1, py=1;
      const goal = {x:SIZE-2,y:SIZE-2};
      let moves = 0;

      stage.innerHTML = `
        <div style="text-align:center;font-weight:700;color:var(--text-dim);margin-bottom:8px;">Level ${level}</div>
        <div id="mzGrid" style="display:grid;grid-template-columns:repeat(${SIZE},1fr);gap:2px;max-width:340px;margin:0 auto 16px;"></div>
        <div style="display:grid;grid-template-columns:56px 56px 56px;grid-template-rows:56px 56px;gap:6px;justify-content:center;">
          <div></div>
          <button class="mz-btn" data-d="up" style="grid-column:2;">⬆️</button>
          <div></div>
          <button class="mz-btn" data-d="left">⬅️</button>
          <button class="mz-btn" data-d="down">⬇️</button>
          <button class="mz-btn" data-d="right">➡️</button>
        </div>
      `;
      document.querySelectorAll(".mz-btn").forEach(b=>{
        b.style.cssText += "border:none;border-radius:12px;background:var(--panel-light);font-size:22px;cursor:pointer;box-shadow:0 4px 0 rgba(0,0,0,.3);";
        b.onclick = ()=> move(b.dataset.d);
      });

      const grid = document.getElementById("mzGrid");
      function render(){
        grid.innerHTML = "";
        for(let y=0;y<SIZE;y++){
          for(let x=0;x<SIZE;x++){
            const cell = document.createElement("div");
            let content = "";
            let bg = maze[y][x]===1 ? "#3a2166" : "#180d30";
            if(x===px && y===py){ content="🦊"; }
            else if(x===goal.x && y===goal.y){ content="🏆"; }
            cell.style.cssText = `aspect-ratio:1;background:${bg};border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:13px;`;
            cell.textContent = content;
            grid.appendChild(cell);
          }
        }
      }
      render();

      function move(dir){
        let nx=px, ny=py;
        if(dir==="up") ny--;
        if(dir==="down") ny++;
        if(dir==="left") nx--;
        if(dir==="right") nx++;
        if(nx<0||ny<0||nx>=SIZE||ny>=SIZE) return;
        if(maze[ny][nx]===1) return;
        px=nx; py=ny; moves++;
        render();
        if(px===goal.x && py===goal.y){
          const bonus = Math.max(10, 60 - moves);
          api.addScore(bonus);
          setTimeout(()=>{
            level++;
            if(level>3){
              api.endGame("You escaped every maze! 🏆");
            } else {
              buildLevel();
            }
          }, 400);
        }
      }

      function keyHandler(e){
        const map = {ArrowUp:"up",ArrowDown:"down",ArrowLeft:"left",ArrowRight:"right"};
        if(map[e.key]) move(map[e.key]);
      }
      document.addEventListener("keydown", keyHandler);
      stage._mazeKeyHandler = keyHandler;
    }
  },
  cleanup(stage){
    if(stage._mazeKeyHandler){
      document.removeEventListener("keydown", stage._mazeKeyHandler);
    }
  }
});

/* ---------------------------------------------------------
   7. SIMON SAYS - color sequence memory
--------------------------------------------------------- */
HB_GAMES.push({
  id: "simon",
  title: "Simon Says",
  icon: "🎵",
  iconClass: "memory",
  tag: "Brain",
  players: "1+ players",
  desc: "Watch the color pattern, then repeat it back!",
  init(stage, api){
    const self = this;
    self._active = true;
    self._timers = [];
    const COLORS = [
      {name:"red", bg:"#e24b4a", lit:"#ff8b8a"},
      {name:"blue", bg:"#378add", lit:"#7fc0ff"},
      {name:"green", bg:"#639922", lit:"#a6e05a"},
      {name:"yellow", bg:"#ef9f27", lit:"#ffd27a"},
    ];
    let sequence = [];
    let playerStep = 0;
    let round = 0;
    let accepting = false;

    stage.innerHTML = `
      <div class="center-msg">
        <div class="emoji">🎵</div>
        <h3>Simon Says</h3>
        <p>Watch the pattern light up, then tap the colors back in the same order. Each round adds one more step!</p>
        <button class="big-btn" id="smBegin">Start 🎶</button>
      </div>
    `;
    document.getElementById("smBegin").onclick = begin;

    function begin(){
      api.setScore(0);
      sequence = [];
      round = 0;
      stage.innerHTML = `
        <div style="text-align:center;color:var(--text-dim);font-weight:700;margin-bottom:14px;" id="smStatus">Watch closely...</div>
        <div id="smGrid" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;max-width:280px;margin:0 auto;"></div>
      `;
      const grid = document.getElementById("smGrid");
      COLORS.forEach((c,i)=>{
        const btn = document.createElement("div");
        btn.dataset.idx = i;
        btn.style.cssText = `aspect-ratio:1;border-radius:16px;background:${c.bg};cursor:pointer;box-shadow:0 5px 0 rgba(0,0,0,.35);transition:filter .1s;`;
        btn.onclick = ()=> handlePress(i, btn);
        grid.appendChild(btn);
      });
      nextRound();
    }

    function nextRound(){
      if(!self._active) return;
      round++;
      playerStep = 0;
      accepting = false;
      sequence.push(Math.floor(Math.random()*COLORS.length));
      const status = document.getElementById("smStatus");
      if(status) status.textContent = `Round ${round} — watch closely...`;
      playSequence();
    }

    function playSequence(){
      let i = 0;
      function step(){
        if(!self._active) return;
        if(i >= sequence.length){
          accepting = true;
          const status = document.getElementById("smStatus");
          if(status) status.textContent = "Your turn — repeat it!";
          return;
        }
        flash(sequence[i]);
        i++;
        const t = setTimeout(step, 650);
        self._timers.push(t);
      }
      const t0 = setTimeout(step, 500);
      self._timers.push(t0);
    }

    function flash(idx){
      const el = document.querySelector(`#smGrid [data-idx="${idx}"]`);
      if(!el) return;
      el.style.filter = "brightness(1.7)";
      const t = setTimeout(()=>{ if(el) el.style.filter = "none"; }, 350);
      self._timers.push(t);
    }

    function handlePress(idx, btn){
      if(!accepting || !self._active) return;
      flash(idx);
      if(idx === sequence[playerStep]){
        playerStep++;
        if(playerStep === sequence.length){
          accepting = false;
          api.addScore(round * 10);
          const status = document.getElementById("smStatus");
          if(status) status.textContent = "Nice! Get ready for the next round...";
          const t = setTimeout(nextRound, 900);
          self._timers.push(t);
        }
      } else {
        accepting = false;
        api.endGame(`Game over — you reached round ${round}! 🎵`);
      }
    }
  },
  cleanup(){
    this._active = false;
    (this._timers||[]).forEach(t=>clearTimeout(t));
    this._timers = [];
  }
});

/* ---------------------------------------------------------
   8. MATH BLITZ - quick arithmetic against the clock
--------------------------------------------------------- */
HB_GAMES.push({
  id: "mathblitz",
  title: "Math Blitz",
  icon: "➕",
  iconClass: "trivia",
  tag: "Brain",
  players: "1+ players",
  desc: "Solve as many quick sums as you can before time runs out!",
  init(stage, api){
    const self = this;
    self._active = true;
    let timeLeft = 30;

    stage.innerHTML = `
      <div class="center-msg">
        <div class="emoji">➕</div>
        <h3>Math Blitz</h3>
        <p>Pick the correct answer as fast as you can. You've got 30 seconds — how many can you solve?</p>
        <button class="big-btn" id="mbBegin">Start ⏱️</button>
      </div>
    `;
    document.getElementById("mbBegin").onclick = begin;

    function begin(){
      api.setScore(0);
      timeLeft = 30;
      self._clockTimer = setInterval(()=>{
        if(!self._active){ clearInterval(self._clockTimer); return; }
        timeLeft--;
        const t = document.getElementById("mbTime");
        if(t) t.textContent = timeLeft;
        if(timeLeft<=0){
          clearInterval(self._clockTimer);
          api.endGame("Time's up! ➕");
        }
      },1000);
      nextProblem();
    }

    function nextProblem(){
      if(!self._active) return;
      const ops = ["+","-","x"];
      const op = ops[Math.floor(Math.random()*ops.length)];
      let a = Math.floor(Math.random()*12)+1;
      let b = Math.floor(Math.random()*12)+1;
      if(op==="-" && b>a){ [a,b]=[b,a]; }
      let correct;
      if(op==="+") correct = a+b;
      else if(op==="-") correct = a-b;
      else correct = a*b;

      const options = new Set([correct]);
      while(options.size < 4){
        const delta = Math.floor(Math.random()*9)-4;
        const candidate = correct + delta;
        if(candidate >= 0 && candidate !== correct) options.add(candidate);
      }
      const shuffled = [...options].sort(()=>Math.random()-0.5);

      stage.innerHTML = `
        <div style="text-align:center;font-weight:800;margin-bottom:8px;">⏱ <span id="mbTime">${timeLeft}</span>s</div>
        <h3 style="text-align:center;font-size:32px;margin:20px 0;">${a} ${op} ${b} = ?</h3>
        <div id="mbAnswers" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;"></div>
      `;
      const wrap = document.getElementById("mbAnswers");
      shuffled.forEach(val=>{
        const btn = document.createElement("button");
        btn.textContent = val;
        btn.style.cssText = "padding:18px 10px;border-radius:16px;border:none;background:var(--panel-light);color:var(--text);font-weight:800;font-size:20px;cursor:pointer;box-shadow:0 4px 0 rgba(0,0,0,.3);";
        btn.onclick = ()=>{
          if(!self._active) return;
          if(val === correct){
            btn.style.background = "var(--green)";
            api.addScore(10);
          } else {
            btn.style.background = "var(--pink)";
          }
          Array.from(wrap.children).forEach(c=>c.onclick=null);
          self._nextTimer = setTimeout(nextProblem, 500);
        };
        wrap.appendChild(btn);
      });
    }
  },
  cleanup(){
    this._active = false;
    if(this._clockTimer) clearInterval(this._clockTimer);
    if(this._nextTimer) clearTimeout(this._nextTimer);
  }
});

/* ---------------------------------------------------------
   9. WORD SCRAMBLE
--------------------------------------------------------- */
const HB_WORDS = ["puppy","rainbow","dragon","castle","planet","pirate","jungle","rocket","wizard","dolphin","volcano","penguin","treasure","unicorn","garden"];

HB_GAMES.push({
  id: "scramble",
  title: "Word Scramble",
  icon: "🔤",
  iconClass: "trivia",
  tag: "Word",
  players: "1+ players",
  desc: "Unscramble the mixed-up letters to find the word!",
  init(stage, api){
    const self = this;
    self._active = true;
    let order = [...HB_WORDS].sort(()=>Math.random()-0.5).slice(0,8);
    let idx = 0;

    stage.innerHTML = `
      <div class="center-msg">
        <div class="emoji">🔤</div>
        <h3>Word Scramble</h3>
        <p>The letters are all mixed up! Type the real word to score points.</p>
        <button class="big-btn" id="wsBegin">Start ✏️</button>
      </div>
    `;
    document.getElementById("wsBegin").onclick = ()=>{ api.setScore(0); showWord(); };

    function scramble(word){
      let letters = word.split("");
      let scrambled;
      do {
        scrambled = [...letters].sort(()=>Math.random()-0.5).join("");
      } while(scrambled === word && word.length>1);
      return scrambled;
    }

    function showWord(){
      if(idx >= order.length){
        api.endGame("All words solved! 🔤");
        return;
      }
      const word = order[idx];
      const scrambled = scramble(word);
      stage.innerHTML = `
        <div style="text-align:center;color:var(--text-dim);font-weight:700;margin-bottom:6px;">Word ${idx+1} of ${order.length}</div>
        <h3 style="text-align:center;font-size:30px;letter-spacing:6px;margin:20px 0;">${scrambled.toUpperCase()}</h3>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
          <input id="wsInput" type="text" placeholder="Type your answer" autocomplete="off"
            style="padding:12px 16px;border-radius:14px;border:2px solid var(--purple-dark);background:var(--panel-light);color:var(--text);font-size:16px;font-family:inherit;text-align:center;max-width:220px;">
        </div>
        <div style="display:flex;gap:10px;justify-content:center;margin-top:14px;">
          <button class="big-btn" id="wsSubmit">Check ✅</button>
          <button class="big-btn blue" id="wsSkip">Skip ⏭️</button>
        </div>
        <div id="wsFeedback" style="text-align:center;margin-top:14px;font-weight:700;min-height:20px;"></div>
      `;
      const input = document.getElementById("wsInput");
      input.focus();
      const feedback = document.getElementById("wsFeedback");

      function submit(){
        if(!self._active) return;
        const guess = input.value.trim().toLowerCase();
        if(guess === word){
          feedback.textContent = "Correct! 🎉";
          feedback.style.color = "var(--green)";
          api.addScore(15);
        } else {
          feedback.textContent = `Not quite — it was "${word}"`;
          feedback.style.color = "var(--pink)";
        }
        input.disabled = true;
        document.getElementById("wsSubmit").disabled = true;
        self._nextTimer = setTimeout(()=>{ idx++; showWord(); }, 1100);
      }
      document.getElementById("wsSubmit").onclick = submit;
      document.getElementById("wsSkip").onclick = ()=>{ idx++; showWord(); };
      input.onkeydown = (e)=>{ if(e.key === "Enter") submit(); };
    }
  },
  cleanup(){
    this._active = false;
    if(this._nextTimer) clearTimeout(this._nextTimer);
  }
});

/* ---------------------------------------------------------
   10. ROCK PAPER SCISSORS - vs CPU, first to 5 wins
--------------------------------------------------------- */
HB_GAMES.push({
  id: "rps",
  title: "Rock Paper Scissors",
  icon: "✊",
  iconClass: "reflex",
  tag: "Battle",
  players: "1 player",
  desc: "Battle the computer! First to 5 wins takes the crown.",
  init(stage, api){
    const self = this;
    self._active = true;
    const MOVES = [{k:"rock",e:"🪨"},{k:"paper",e:"📄"},{k:"scissors",e:"✂️"}];
    let wins = 0, losses = 0;

    stage.innerHTML = `
      <div class="center-msg">
        <div class="emoji">✊</div>
        <h3>Rock Paper Scissors</h3>
        <p>Pick your move and battle the computer. First to 5 wins takes the crown!</p>
        <button class="big-btn" id="rpsBegin">Start ⚔️</button>
      </div>
    `;
    document.getElementById("rpsBegin").onclick = ()=>{ api.setScore(0); wins=0; losses=0; render(); };

    function render(resultHtml){
      stage.innerHTML = `
        <div style="display:flex;justify-content:center;gap:30px;font-weight:800;margin-bottom:16px;">
          <div>You: <span style="color:var(--green);">${wins}</span></div>
          <div>Computer: <span style="color:var(--pink);">${losses}</span></div>
        </div>
        <div id="rpsResult" style="text-align:center;min-height:70px;font-size:15px;color:var(--text-dim);">${resultHtml || "Choose your move!"}</div>
        <div style="display:flex;gap:14px;justify-content:center;margin-top:10px;" id="rpsMoves"></div>
      `;
      const wrap = document.getElementById("rpsMoves");
      MOVES.forEach(m=>{
        const btn = document.createElement("button");
        btn.textContent = m.e;
        btn.style.cssText = "font-size:36px;padding:16px 20px;border-radius:18px;border:none;background:var(--panel-light);cursor:pointer;box-shadow:0 5px 0 rgba(0,0,0,.35);";
        btn.onclick = ()=> play(m.k);
        wrap.appendChild(btn);
      });
    }

    function play(playerMove){
      if(!self._active) return;
      const cpuMove = MOVES[Math.floor(Math.random()*MOVES.length)].k;
      const playerEmoji = MOVES.find(m=>m.k===playerMove).e;
      const cpuEmoji = MOVES.find(m=>m.k===cpuMove).e;
      let outcome;
      if(playerMove === cpuMove) outcome = "tie";
      else if(
        (playerMove==="rock" && cpuMove==="scissors") ||
        (playerMove==="paper" && cpuMove==="rock") ||
        (playerMove==="scissors" && cpuMove==="paper")
      ) outcome = "win";
      else outcome = "lose";

      let msg;
      if(outcome==="win"){ wins++; api.addScore(10); msg = `<strong style="color:var(--green);">You win this round!</strong>`; }
      else if(outcome==="lose"){ losses++; msg = `<strong style="color:var(--pink);">Computer wins this round!</strong>`; }
      else msg = `<strong>It's a tie!</strong>`;

      const resultHtml = `<div style="font-size:34px;margin-bottom:6px;">${playerEmoji} vs ${cpuEmoji}</div>${msg}`;

      if(wins >= 5 || losses >= 5){
        self._nextTimer = setTimeout(()=>{
          if(!self._active) return;
          api.endGame(wins>=5 ? "You win the battle! 🏆" : "The computer wins this time! 🤖");
        }, 1200);
        render(resultHtml);
        return;
      }
      render(resultHtml);
    }
  },
  cleanup(){
    this._active = false;
    if(this._nextTimer) clearTimeout(this._nextTimer);
  }
});

/* ---------------------------------------------------------
   11. TIC-TAC-TOE - 2 player pass and play
--------------------------------------------------------- */
HB_GAMES.push({
  id: "tictactoe",
  title: "Tic-Tac-Toe",
  icon: "⭕",
  iconClass: "maze",
  tag: "Party",
  players: "2 players",
  desc: "Classic X's and O's — pass the device between turns!",
  init(stage, api){
    const self = this;
    self._active = true;
    let board, turn, gameOver;
    const WIN_LINES = [
      [0,1,2],[3,4,5],[6,7,8],
      [0,3,6],[1,4,7],[2,5,8],
      [0,4,8],[2,4,6]
    ];

    stage.innerHTML = `
      <div class="center-msg">
        <div class="emoji">⭕</div>
        <h3>Tic-Tac-Toe</h3>
        <p>Two players take turns tapping squares. Get three in a row to win — pass the device each turn!</p>
        <button class="big-btn" id="tttBegin">Start ✖️</button>
      </div>
    `;
    document.getElementById("tttBegin").onclick = begin;

    function begin(){
      api.setScore(0);
      board = Array(9).fill(null);
      turn = "X";
      gameOver = false;
      render();
    }

    function render(){
      stage.innerHTML = `
        <div style="text-align:center;font-weight:800;margin-bottom:14px;" id="tttStatus">${gameOver ? "" : `Player ${turn}'s turn`}</div>
        <div id="tttGrid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-width:270px;margin:0 auto;"></div>
        <div style="text-align:center;margin-top:16px;">
          <button class="big-btn blue" id="tttReset">New game 🔁</button>
        </div>
      `;
      const grid = document.getElementById("tttGrid");
      board.forEach((val,i)=>{
        const cell = document.createElement("div");
        cell.style.cssText = "aspect-ratio:1;background:var(--panel-light);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:800;cursor:pointer;box-shadow:0 4px 0 rgba(0,0,0,.3);";
        cell.textContent = val || "";
        if(val === "X") cell.style.color = "var(--blue)";
        if(val === "O") cell.style.color = "var(--pink)";
        cell.onclick = ()=> mark(i);
        grid.appendChild(cell);
      });
      document.getElementById("tttReset").onclick = begin;
    }

    function mark(i){
      if(gameOver || board[i] || !self._active) return;
      board[i] = turn;
      const winLine = WIN_LINES.find(line => line.every(idx => board[idx] === turn));
      if(winLine){
        gameOver = true;
        api.addScore(20);
        render();
        const status = document.getElementById("tttStatus");
        if(status){ status.textContent = `Player ${turn} wins! 🎉`; status.style.color = "var(--green)"; }
        return;
      }
      if(board.every(v=>v)){
        gameOver = true;
        render();
        const status = document.getElementById("tttStatus");
        if(status){ status.textContent = "It's a draw!"; }
        return;
      }
      turn = turn === "X" ? "O" : "X";
      render();
    }
  },
  cleanup(){
    this._active = false;
  }
});

/* ---------------------------------------------------------
   12. SNAKE - classic arcade, solo
--------------------------------------------------------- */
HB_GAMES.push({
  id: "snake",
  title: "Snake",
  icon: "🐍",
  iconClass: "reflex",
  tag: "Arcade",
  players: "1 player",
  desc: "Guide the snake to eat food and grow — don't hit yourself!",
  init(stage, api){
    const self = this;
    self._active = true;
    const SIZE = 14;
    let snake, dir, nextDir, food, loopTimer;

    stage.innerHTML = `
      <div class="center-msg">
        <div class="emoji">🐍</div>
        <h3>Snake</h3>
        <p>Use the arrow buttons (or arrow keys) to steer. Eat the food to grow — don't run into yourself or the walls!</p>
        <button class="big-btn" id="snBegin">Start 🍎</button>
      </div>
    `;
    document.getElementById("snBegin").onclick = begin;

    function begin(){
      api.setScore(0);
      snake = [{x:6,y:7},{x:5,y:7},{x:4,y:7}];
      dir = "right";
      nextDir = "right";
      placeFood();

      stage.innerHTML = `
        <div id="snGrid" style="display:grid;grid-template-columns:repeat(${SIZE},1fr);gap:1px;max-width:320px;margin:0 auto 16px;background:#180d30;padding:4px;border-radius:12px;"></div>
        <div style="display:grid;grid-template-columns:52px 52px 52px;grid-template-rows:52px 52px;gap:6px;justify-content:center;">
          <div></div>
          <button class="sn-btn" data-d="up" style="grid-column:2;">⬆️</button>
          <div></div>
          <button class="sn-btn" data-d="left">⬅️</button>
          <button class="sn-btn" data-d="down">⬇️</button>
          <button class="sn-btn" data-d="right">➡️</button>
        </div>
      `;
      document.querySelectorAll(".sn-btn").forEach(b=>{
        b.style.cssText += "border:none;border-radius:12px;background:var(--panel-light);font-size:20px;cursor:pointer;box-shadow:0 4px 0 rgba(0,0,0,.3);";
        b.onclick = ()=> steer(b.dataset.d);
      });

      const cells = [];
      const grid = document.getElementById("snGrid");
      for(let i=0;i<SIZE*SIZE;i++){
        const c = document.createElement("div");
        c.style.cssText = "aspect-ratio:1;background:#0e0824;border-radius:2px;";
        grid.appendChild(c);
        cells.push(c);
      }

      function draw(){
        cells.forEach(c=>{ c.style.background = "#0e0824"; });
        cells[food.y*SIZE+food.x].style.background = "var(--yellow)";
        snake.forEach((seg,i)=>{
          const cell = cells[seg.y*SIZE+seg.x];
          if(cell) cell.style.background = i===0 ? "var(--green)" : "#2fae7e";
        });
      }
      draw();

      function keyHandler(e){
        const map = {ArrowUp:"up",ArrowDown:"down",ArrowLeft:"left",ArrowRight:"right"};
        if(map[e.key]) steer(map[e.key]);
      }
      document.addEventListener("keydown", keyHandler);
      self._keyHandler = keyHandler;

      function steer(d){
        const opposite = {up:"down",down:"up",left:"right",right:"left"};
        if(opposite[d] === dir) return;
        nextDir = d;
      }

      function placeFood(){
        let fx, fy, clash;
        do{
          fx = Math.floor(Math.random()*SIZE);
          fy = Math.floor(Math.random()*SIZE);
          clash = snake && snake.some(s=>s.x===fx && s.y===fy);
        } while(clash);
        food = {x:fx,y:fy};
      }

      function tick(){
        if(!self._active) return;
        dir = nextDir;
        const head = {...snake[0]};
        if(dir==="up") head.y--;
        if(dir==="down") head.y++;
        if(dir==="left") head.x--;
        if(dir==="right") head.x++;

        if(head.x<0||head.y<0||head.x>=SIZE||head.y>=SIZE || snake.some(s=>s.x===head.x && s.y===head.y)){
          document.removeEventListener("keydown", keyHandler);
          api.endGame("Game over! 🐍");
          return;
        }
        snake.unshift(head);
        if(head.x===food.x && head.y===food.y){
          api.addScore(10);
          placeFood();
        } else {
          snake.pop();
        }
        draw();
        loopTimer = setTimeout(tick, 160);
        self._loopTimer = loopTimer;
      }
      loopTimer = setTimeout(tick, 160);
      self._loopTimer = loopTimer;
    }
  },
  cleanup(){
    this._active = false;
    if(this._loopTimer) clearTimeout(this._loopTimer);
    if(this._keyHandler) document.removeEventListener("keydown", this._keyHandler);
  }
});

/* ---------------------------------------------------------
   13. COLOR RUSH - Stroop-style match/no-match
--------------------------------------------------------- */
HB_GAMES.push({
  id: "colorrush",
  title: "Color Rush",
  icon: "🌈",
  iconClass: "brainy",
  tag: "Brain",
  players: "1+ players",
  desc: "Does the word match its color? Decide fast before time runs out!",
  init(stage, api){
    const self = this;
    self._active = true;
    const COLOR_DEFS = [
      {name:"RED", hex:"#ff5d5d"},
      {name:"BLUE", hex:"#3fb6ff"},
      {name:"GREEN", hex:"#3ddc97"},
      {name:"YELLOW", hex:"#ffd23f"},
      {name:"PINK", hex:"#ff5da2"},
    ];
    let timeLeft = 25;

    stage.innerHTML = `
      <div class="center-msg">
        <div class="emoji">🌈</div>
        <h3>Color Rush</h3>
        <p>A color word will appear, sometimes printed in a different color! Tap MATCH if the word and its color are the same, or NO MATCH if they're different.</p>
        <button class="big-btn" id="crBegin">Start ⚡</button>
      </div>
    `;
    document.getElementById("crBegin").onclick = begin;

    function begin(){
      api.setScore(0);
      timeLeft = 25;
      self._clockTimer = setInterval(()=>{
        if(!self._active){ clearInterval(self._clockTimer); return; }
        timeLeft--;
        const t = document.getElementById("crTime");
        if(t) t.textContent = timeLeft;
        if(timeLeft<=0){
          clearInterval(self._clockTimer);
          api.endGame("Time's up! 🌈");
        }
      },1000);
      nextRound();
    }

    function nextRound(){
      if(!self._active) return;
      const wordDef = COLOR_DEFS[Math.floor(Math.random()*COLOR_DEFS.length)];
      const isMatch = Math.random() < 0.5;
      let colorDef = wordDef;
      if(!isMatch){
        const others = COLOR_DEFS.filter(c=>c.name!==wordDef.name);
        colorDef = others[Math.floor(Math.random()*others.length)];
      }
      stage.innerHTML = `
        <div style="text-align:center;font-weight:800;margin-bottom:8px;">⏱ <span id="crTime">${timeLeft}</span>s</div>
        <h3 style="text-align:center;font-size:38px;margin:24px 0;color:${colorDef.hex};">${wordDef.name}</h3>
        <div style="display:flex;gap:14px;justify-content:center;">
          <button class="big-btn" id="crMatch">✅ Match</button>
          <button class="big-btn pink" id="crNoMatch">❌ No Match</button>
        </div>
      `;
      document.getElementById("crMatch").onclick = ()=> answer(isMatch);
      document.getElementById("crNoMatch").onclick = ()=> answer(!isMatch);
    }

    function answer(correct){
      if(!self._active) return;
      if(correct) api.addScore(10);
      nextRound();
    }
  },
  cleanup(){
    this._active = false;
    if(this._clockTimer) clearInterval(this._clockTimer);
  }
});

/* ---------------------------------------------------------
   14. BALLOON POP
--------------------------------------------------------- */
HB_GAMES.push({
  id: "balloonpop",
  title: "Balloon Pop",
  icon: "🎈",
  iconClass: "tag",
  tag: "Arcade",
  players: "1+ players",
  desc: "Pop the rising balloons before they float away — watch out for bombs!",
  init(stage, api){
    const self = this;
    self._active = true;
    let timeLeft = 30;
    let running = false;

    stage.innerHTML = `
      <div class="center-msg">
        <div class="emoji">🎈</div>
        <h3>Balloon Pop</h3>
        <p>Balloons float up from the bottom — tap to pop them for points! Avoid the bomb balloons 💣.</p>
        <button class="big-btn" id="bpBegin">Start 🎈</button>
      </div>
    `;
    document.getElementById("bpBegin").onclick = begin;

    function begin(){
      api.setScore(0);
      timeLeft = 30;
      running = true;
      self._elemTimers = [];
      stage.innerHTML = `
        <div style="text-align:center;font-weight:800;margin-bottom:8px;">⏱ <span id="bpTime">30</span>s</div>
        <div id="bpArena" style="position:relative;height:360px;background:linear-gradient(180deg,#1c2a5e,#180d30);border-radius:16px;overflow:hidden;"></div>
      `;
      self._clockTimer = setInterval(()=>{
        if(!running || !self._active){ clearInterval(self._clockTimer); return; }
        timeLeft--;
        const t = document.getElementById("bpTime");
        if(t) t.textContent = timeLeft;
        if(timeLeft<=0) endGame();
      },1000);
      spawnLoop();
    }

    function spawnLoop(){
      if(!running || !self._active) return;
      const arena = document.getElementById("bpArena");
      if(arena){
        const isBomb = Math.random() < 0.22;
        const size = 46 + Math.random()*20;
        const b = document.createElement("div");
        const left = Math.random() * Math.max(0, arena.clientWidth - size);
        const duration = 2600 + Math.random()*1400;
        b.style.cssText = `position:absolute;left:${left}px;bottom:-60px;width:${size}px;height:${size}px;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;
          background:${isBomb ? "#2a2a2a" : ["#ff5da2","#3fb6ff","#3ddc97","#ffd23f","#ff8c42"][Math.floor(Math.random()*5)]};
          display:flex;align-items:center;justify-content:center;font-size:20px;cursor:pointer;
          transition:bottom ${duration}ms linear;box-shadow:0 4px 10px rgba(0,0,0,.3);`;
        b.textContent = isBomb ? "💣" : "";
        arena.appendChild(b);
        requestAnimationFrame(()=>{ b.style.bottom = (arena.clientHeight + 60) + "px"; });
        let popped = false;
        b.onclick = ()=>{
          if(popped || !self._active) return;
          popped = true;
          api.addScore(isBomb ? -8 : 10);
          b.remove();
        };
        const et = setTimeout(()=>{ if(!popped) b.remove(); }, duration + 100);
        self._elemTimers.push(et);
      }
      self._spawnTimer = setTimeout(spawnLoop, 450 + Math.random()*350);
    }

    function endGame(){
      running = false;
      clearInterval(self._clockTimer);
      clearTimeout(self._spawnTimer);
      api.endGame("Time's up! 🎈");
    }
  },
  cleanup(){
    this._active = false;
    if(this._clockTimer) clearInterval(this._clockTimer);
    if(this._spawnTimer) clearTimeout(this._spawnTimer);
    (this._elemTimers||[]).forEach(t=>clearTimeout(t));
    this._elemTimers = [];
  }
});

/* ---------------------------------------------------------
   15. ODD ONE OUT
--------------------------------------------------------- */
const HB_EMOJI_PAIRS = [
  {base:"🍎", odd:"🍏"},
  {base:"🐶", odd:"🐺"},
  {base:"⭐", odd:"🌟"},
  {base:"🔵", odd:"🟣"},
  {base:"🐱", odd:"🐯"},
  {base:"🍩", odd:"🥯"},
  {base:"🎈", odd:"🎉"},
  {base:"🦋", odd:"🐛"},
];

HB_GAMES.push({
  id: "oddoneout",
  title: "Odd One Out",
  icon: "🔍",
  iconClass: "memory",
  tag: "Brain",
  players: "1+ players",
  desc: "Spot the one emoji that's different from all the rest!",
  init(stage, api){
    const self = this;
    self._active = true;
    let round = 0;
    const TOTAL_ROUNDS = 8;

    stage.innerHTML = `
      <div class="center-msg">
        <div class="emoji">🔍</div>
        <h3>Odd One Out</h3>
        <p>Every square looks the same except one. Tap the different one as fast as you can!</p>
        <button class="big-btn" id="ooBegin">Start 🔍</button>
      </div>
    `;
    document.getElementById("ooBegin").onclick = ()=>{ api.setScore(0); round=0; nextRound(); };

    function nextRound(){
      if(!self._active) return;
      round++;
      if(round > TOTAL_ROUNDS){
        api.endGame("Sharp eyes! 🔍");
        return;
      }
      const pair = HB_EMOJI_PAIRS[Math.floor(Math.random()*HB_EMOJI_PAIRS.length)];
      const gridSize = Math.min(4 + Math.floor(round/2), 6);
      const total = gridSize * gridSize;
      const oddIdx = Math.floor(Math.random()*total);

      stage.innerHTML = `
        <div style="text-align:center;color:var(--text-dim);font-weight:700;margin-bottom:10px;">Round ${round} of ${TOTAL_ROUNDS}</div>
        <div id="ooGrid" style="display:grid;grid-template-columns:repeat(${gridSize},1fr);gap:6px;max-width:320px;margin:0 auto;"></div>
      `;
      const grid = document.getElementById("ooGrid");
      for(let i=0;i<total;i++){
        const cell = document.createElement("div");
        cell.style.cssText = "aspect-ratio:1;background:var(--panel-light);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:20px;cursor:pointer;";
        cell.textContent = i === oddIdx ? pair.odd : pair.base;
        cell.onclick = ()=>{
          if(!self._active) return;
          if(i === oddIdx){
            api.addScore(15);
            nextRound();
          }
        };
        grid.appendChild(cell);
      }
    }
  },
  cleanup(){ this._active = false; }
});

/* ---------------------------------------------------------
   16. CONNECT FOUR
--------------------------------------------------------- */
HB_GAMES.push({
  id: "connect4",
  title: "Connect Four",
  icon: "🔴",
  iconClass: "party",
  tag: "Party",
  players: "2 players",
  desc: "Drop discs and connect four in a row — pass the device between turns!",
  init(stage, api){
    const self = this;
    self._active = true;
    const COLS = 7, ROWS = 6;
    let board, turn, gameOver;

    stage.innerHTML = `
      <div class="center-msg">
        <div class="emoji">🔴</div>
        <h3>Connect Four</h3>
        <p>Two players take turns dropping discs. Get four in a row — across, up-and-down, or diagonal — to win!</p>
        <button class="big-btn" id="c4Begin">Start 🟡</button>
      </div>
    `;
    document.getElementById("c4Begin").onclick = begin;

    function begin(){
      api.setScore(0);
      board = Array.from({length:ROWS},()=>Array(COLS).fill(null));
      turn = "R";
      gameOver = false;
      render();
    }

    function render(status){
      const color = turn === "R" ? "🔴" : "🟡";
      stage.innerHTML = `
        <div style="text-align:center;font-weight:800;margin-bottom:12px;" id="c4Status">${status || (gameOver ? "" : `Player ${color}'s turn`)}</div>
        <div id="c4Grid" style="display:grid;grid-template-columns:repeat(${COLS},1fr);gap:4px;max-width:340px;margin:0 auto;background:#1c2a5e;padding:6px;border-radius:12px;"></div>
        <div style="text-align:center;margin-top:16px;">
          <button class="big-btn blue" id="c4Reset">New game 🔁</button>
        </div>
      `;
      const grid = document.getElementById("c4Grid");
      for(let r=0;r<ROWS;r++){
        for(let c=0;c<COLS;c++){
          const cell = document.createElement("div");
          const val = board[r][c];
          cell.style.cssText = "aspect-ratio:1;background:#0e0824;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;cursor:pointer;";
          cell.textContent = val === "R" ? "🔴" : val === "Y" ? "🟡" : "";
          cell.onclick = ()=> drop(c);
          grid.appendChild(cell);
        }
      }
      document.getElementById("c4Reset").onclick = begin;
    }

    function drop(col){
      if(gameOver || !self._active) return;
      let row = -1;
      for(let r=ROWS-1;r>=0;r--){
        if(!board[r][col]){ row = r; break; }
      }
      if(row === -1) return;
      const mark = turn === "R" ? "R" : "Y";
      board[row][col] = mark;
      if(checkWin(row,col,mark)){
        gameOver = true;
        api.addScore(20);
        render(`Player ${turn==="R"?"🔴":"🟡"} wins! 🎉`);
        return;
      }
      if(board.every(r=>r.every(c=>c))){
        gameOver = true;
        render("It's a draw!");
        return;
      }
      turn = turn === "R" ? "Y" : "R";
      render();
    }

    function checkWin(row,col,mark){
      const dirs = [[0,1],[1,0],[1,1],[1,-1]];
      for(const [dr,dc] of dirs){
        let count = 1;
        for(let s=1;s<4;s++){
          const r=row+dr*s, c=col+dc*s;
          if(r<0||r>=ROWS||c<0||c>=COLS||board[r][c]!==mark) break;
          count++;
        }
        for(let s=1;s<4;s++){
          const r=row-dr*s, c=col-dc*s;
          if(r<0||r>=ROWS||c<0||c>=COLS||board[r][c]!==mark) break;
          count++;
        }
        if(count>=4) return true;
      }
      return false;
    }
  },
  cleanup(){ this._active = false; }
});

/* ---------------------------------------------------------
   17. DODGE BLOCKS
--------------------------------------------------------- */
HB_GAMES.push({
  id: "dodgeblocks",
  title: "Dodge Blocks",
  icon: "🚧",
  iconClass: "reflex",
  tag: "Arcade",
  players: "1 player",
  desc: "Move left and right to dodge the falling blocks — survive as long as you can!",
  init(stage, api){
    const self = this;
    self._active = true;
    const LANES = 5, ROWS = 8;
    let playerLane, blocks, tickMs, elapsed, running;

    stage.innerHTML = `
      <div class="center-msg">
        <div class="emoji">🚧</div>
        <h3>Dodge Blocks</h3>
        <p>Blocks fall from the top — move your hunter left or right to dodge them. The longer you survive, the higher your score!</p>
        <button class="big-btn" id="dbBegin">Start 🏃</button>
      </div>
    `;
    document.getElementById("dbBegin").onclick = begin;

    function begin(){
      api.setScore(0);
      playerLane = 2;
      blocks = [];
      tickMs = 400;
      elapsed = 0;
      running = true;

      stage.innerHTML = `
        <div id="dbGrid" style="display:grid;grid-template-columns:repeat(${LANES},1fr);grid-template-rows:repeat(${ROWS},1fr);gap:3px;max-width:280px;aspect-ratio:${LANES}/${ROWS};margin:0 auto 16px;background:#180d30;padding:4px;border-radius:12px;"></div>
        <div style="display:flex;gap:16px;justify-content:center;">
          <button class="big-btn" id="dbLeft">⬅️</button>
          <button class="big-btn" id="dbRight">➡️</button>
        </div>
      `;
      document.getElementById("dbLeft").onclick = ()=> movePlayer(-1);
      document.getElementById("dbRight").onclick = ()=> movePlayer(1);

      function keyHandler(e){
        if(e.key === "ArrowLeft") movePlayer(-1);
        if(e.key === "ArrowRight") movePlayer(1);
      }
      document.addEventListener("keydown", keyHandler);
      self._keyHandler = keyHandler;

      draw();
      loop();
    }

    function movePlayer(delta){
      playerLane = Math.max(0, Math.min(LANES-1, playerLane+delta));
      draw();
    }

    function draw(){
      const grid = document.getElementById("dbGrid");
      if(!grid) return;
      grid.innerHTML = "";
      const cells = [];
      for(let r=0;r<ROWS;r++){
        cells[r] = [];
        for(let l=0;l<LANES;l++){
          const cell = document.createElement("div");
          cell.style.cssText = "background:#0e0824;border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:16px;";
          grid.appendChild(cell);
          cells[r][l] = cell;
        }
      }
      blocks.forEach(b=>{ if(cells[b.row]) cells[b.row][b.lane].textContent = "🧱"; });
      if(cells[ROWS-1]) cells[ROWS-1][playerLane].textContent = "🦊";
    }

    function loop(){
      if(!running || !self._active) return;
      blocks.forEach(b=> b.row++);
      let collided = false;
      blocks = blocks.filter(b=>{
        if(b.row === ROWS-1 && b.lane === playerLane){
          collided = true;
          return true;
        }
        if(b.row >= ROWS){
          api.addScore(2);
          return false;
        }
        return true;
      });
      if(Math.random() < 0.5){
        blocks.push({ lane: Math.floor(Math.random()*LANES), row: 0 });
      }
      draw();
      if(collided){ gameOver(); return; }
      elapsed++;
      if(elapsed % 8 === 0 && tickMs > 180) tickMs -= 20;
      if(running){
        self._loopTimer = setTimeout(loop, tickMs);
      }
    }

    function gameOver(){
      running = false;
      clearTimeout(self._loopTimer);
      document.removeEventListener("keydown", self._keyHandler);
      api.endGame("Ouch! Game over 🚧");
    }
  },
  cleanup(){
    this._active = false;
    if(this._loopTimer) clearTimeout(this._loopTimer);
    if(this._keyHandler) document.removeEventListener("keydown", this._keyHandler);
  }
});

/* ---------------------------------------------------------
   18. GUESS THE NUMBER
--------------------------------------------------------- */
HB_GAMES.push({
  id: "guessnumber",
  title: "Guess the Number",
  icon: "🔢",
  iconClass: "trivia",
  tag: "Brain",
  players: "1+ players",
  desc: "Can you guess the secret number in 7 tries or less?",
  init(stage, api){
    const self = this;
    self._active = true;
    let secret, guessesLeft, history;

    stage.innerHTML = `
      <div class="center-msg">
        <div class="emoji">🔢</div>
        <h3>Guess the Number</h3>
        <p>I'm thinking of a number between 1 and 50. You've got 7 guesses — I'll tell you higher or lower!</p>
        <button class="big-btn" id="gnBegin">Start 🎯</button>
      </div>
    `;
    document.getElementById("gnBegin").onclick = begin;

    function begin(){
      api.setScore(0);
      secret = Math.floor(Math.random()*50)+1;
      guessesLeft = 7;
      history = [];
      render();
    }

    function render(feedback){
      stage.innerHTML = `
        <div style="text-align:center;font-weight:700;color:var(--text-dim);margin-bottom:6px;">Guesses left: ${guessesLeft}</div>
        <h3 style="text-align:center;font-size:16px;min-height:24px;">${feedback || "Pick a number between 1 and 50"}</h3>
        <div style="display:flex;gap:10px;justify-content:center;margin:16px 0;">
          <input id="gnInput" type="number" min="1" max="50" placeholder="?"
            style="width:100px;padding:12px;border-radius:14px;border:2px solid var(--purple-dark);background:var(--panel-light);color:var(--text);font-size:20px;text-align:center;font-family:inherit;">
          <button class="big-btn" id="gnSubmit">Guess ✅</button>
        </div>
        <div style="text-align:center;color:var(--text-dim);font-size:12.5px;">Tried: ${history.join(", ") || "—"}</div>
      `;
      const input = document.getElementById("gnInput");
      input.focus();
      document.getElementById("gnSubmit").onclick = submitGuess;
      input.onkeydown = (e)=>{ if(e.key==="Enter") submitGuess(); };
    }

    function submitGuess(){
      if(!self._active) return;
      const input = document.getElementById("gnInput");
      const val = parseInt(input.value, 10);
      if(isNaN(val)) return;
      history.push(val);
      guessesLeft--;
      if(val === secret){
        api.addScore(guessesLeft*15 + 20);
        api.endGame(`You got it — it was ${secret}! 🎉`);
        return;
      }
      if(guessesLeft <= 0){
        api.endGame(`Out of guesses! The number was ${secret}.`);
        return;
      }
      render(val < secret ? "Higher! ⬆️" : "Lower! ⬇️");
    }
  },
  cleanup(){ this._active = false; }
});

/* ---------------------------------------------------------
   19. CHARADES PARTY
--------------------------------------------------------- */
const HB_CHARADES = [
  "an elephant stomping","brushing your teeth","a superhero flying","riding a bike","a sleepy cat",
  "playing the drums","a rocket launching","swimming like a fish","a robot walking","blowing out birthday candles",
  "a kangaroo hopping","eating spaghetti","a monkey climbing","driving a car","a ghost saying boo",
  "a chicken laying an egg","fishing","a snowman melting","playing basketball","a dinosaur roaring"
];

HB_GAMES.push({
  id: "charades",
  title: "Charades Party",
  icon: "🎭",
  iconClass: "party",
  tag: "Party",
  players: "3+ players",
  desc: "Act it out! Pass the device and let one player mime the prompt.",
  init(stage, api){
    const self = this;
    self._active = true;
    let order = [...HB_CHARADES].sort(()=>Math.random()-0.5);
    let idx = 0;

    stage.innerHTML = `
      <div class="center-msg">
        <div class="emoji">🎭</div>
        <h3>Charades Party</h3>
        <p>One player looks at the prompt and acts it out — no talking! Everyone else guesses. Tap Got It when they guess right.</p>
        <button class="big-btn" id="chBegin">Start 🎬</button>
      </div>
    `;
    document.getElementById("chBegin").onclick = ()=>{ api.setScore(0); idx=0; showPrompt(); };

    function showPrompt(){
      if(idx >= order.length){
        api.endGame("Great acting, everyone! 🎭");
        return;
      }
      stage.innerHTML = `
        <div class="center-msg">
          <div style="color:var(--text-dim);font-weight:700;">Act out:</div>
          <h3 style="font-size:24px;text-align:center;">${order[idx]}</h3>
          <div style="display:flex;gap:12px;">
            <button class="big-btn" id="chGot">Got it! ✅</button>
            <button class="big-btn blue" id="chSkip">Skip ⏭️</button>
          </div>
        </div>
      `;
      document.getElementById("chGot").onclick = ()=>{ api.addScore(10); idx++; showPrompt(); };
      document.getElementById("chSkip").onclick = ()=>{ idx++; showPrompt(); };
    }
  },
  cleanup(){ this._active = false; }
});

/* ---------------------------------------------------------
   20. WOULD YOU RATHER
--------------------------------------------------------- */
const HB_WYR = [
  ["have the power to fly","have the power to turn invisible"],
  ["be able to talk to animals","be able to speak every language"],
  ["always be too hot","always be too cold"],
  ["have a pet dragon","have a pet unicorn"],
  ["eat pizza every day","eat ice cream every day"],
  ["live in a treehouse","live in a submarine"],
  ["be the fastest kid alive","be the strongest kid alive"],
  ["have super hearing","have super eyesight"],
  ["only be able to whisper","only be able to shout"],
  ["explore outer space","explore the deep ocean"],
];

HB_GAMES.push({
  id: "wouldyourather",
  title: "Would You Rather",
  icon: "🤔",
  iconClass: "trivia",
  tag: "Party",
  players: "2+ players",
  desc: "No wrong answers! Vote and see what the group picks.",
  init(stage, api){
    const self = this;
    self._active = true;
    let order = [...HB_WYR].sort(()=>Math.random()-0.5);
    let idx = 0;

    stage.innerHTML = `
      <div class="center-msg">
        <div class="emoji">🤔</div>
        <h3>Would You Rather</h3>
        <p>Pick your answer, then talk about why with the group. There's no wrong choice!</p>
        <button class="big-btn" id="wyrBegin">Start 💭</button>
      </div>
    `;
    document.getElementById("wyrBegin").onclick = ()=>{ api.setScore(0); idx=0; showQ(); };

    function showQ(){
      if(idx >= order.length){
        api.endGame("Nice chatting! 🤔");
        return;
      }
      const [a,b] = order[idx];
      stage.innerHTML = `
        <div style="text-align:center;color:var(--text-dim);font-weight:700;margin-bottom:12px;">Would you rather...</div>
        <div style="display:flex;flex-direction:column;gap:12px;">
          <button class="big-btn" id="wyrA" style="white-space:normal;">${a}</button>
          <div style="text-align:center;font-weight:800;color:var(--text-dim);">— OR —</div>
          <button class="big-btn pink" id="wyrB" style="white-space:normal;">${b}</button>
        </div>
      `;
      document.getElementById("wyrA").onclick = ()=> pick();
      document.getElementById("wyrB").onclick = ()=> pick();
      function pick(){
        api.addScore(5);
        idx++;
        showQ();
      }
    }
  },
  cleanup(){ this._active = false; }
});

/* ---------------------------------------------------------
   21. COIN FLIP DUEL
--------------------------------------------------------- */
HB_GAMES.push({
  id: "coinflip",
  title: "Coin Flip Duel",
  icon: "🪙",
  iconClass: "mole",
  tag: "Party",
  players: "2 players",
  desc: "Call heads or tails and flip the coin — best of 6 wins!",
  init(stage, api){
    const self = this;
    self._active = true;
    let round, callerIsP1, p1Wins, p2Wins;
    const TOTAL_ROUNDS = 6;

    stage.innerHTML = `
      <div class="center-msg">
        <div class="emoji">🪙</div>
        <h3>Coin Flip Duel</h3>
        <p>Players take turns calling heads or tails before the flip. Most correct calls after 6 rounds wins!</p>
        <button class="big-btn" id="cfBegin">Start 🪙</button>
      </div>
    `;
    document.getElementById("cfBegin").onclick = begin;

    function begin(){
      api.setScore(0);
      round = 1;
      callerIsP1 = true;
      p1Wins = 0; p2Wins = 0;
      showCallScreen();
    }

    function showCallScreen(){
      if(round > TOTAL_ROUNDS){
        const msg = p1Wins===p2Wins ? "It's a tie! 🤝" : (p1Wins>p2Wins ? "Player 1 wins the duel! 🏆" : "Player 2 wins the duel! 🏆");
        api.endGame(msg);
        return;
      }
      const caller = callerIsP1 ? "Player 1" : "Player 2";
      stage.innerHTML = `
        <div class="center-msg">
          <div style="color:var(--text-dim);font-weight:700;">Round ${round} of ${TOTAL_ROUNDS}</div>
          <div style="display:flex;gap:24px;font-weight:800;margin:6px 0;">
            <div>P1: <span style="color:var(--green);">${p1Wins}</span></div>
            <div>P2: <span style="color:var(--pink);">${p2Wins}</span></div>
          </div>
          <h3>${caller}, call it!</h3>
          <div style="display:flex;gap:14px;">
            <button class="big-btn" id="cfHeads">🙂 Heads</button>
            <button class="big-btn blue" id="cfTails">⭐ Tails</button>
          </div>
        </div>
      `;
      document.getElementById("cfHeads").onclick = ()=> flip("heads");
      document.getElementById("cfTails").onclick = ()=> flip("tails");
    }

    function flip(call){
      if(!self._active) return;
      const result = Math.random() < 0.5 ? "heads" : "tails";
      const correct = call === result;
      if(correct){
        if(callerIsP1){ p1Wins++; } else { p2Wins++; }
        api.addScore(10);
      }
      stage.innerHTML = `
        <div class="center-msg">
          <div class="emoji">${result === "heads" ? "🙂" : "⭐"}</div>
          <h3>${result.toUpperCase()}! ${correct ? "Correct call! 🎉" : "Not this time!"}</h3>
          <button class="big-btn" id="cfNext">Next round ➡️</button>
        </div>
      `;
      document.getElementById("cfNext").onclick = ()=>{
        round++;
        callerIsP1 = !callerIsP1;
        showCallScreen();
      };
    }
  },
  cleanup(){ this._active = false; }
});

/* ---------------------------------------------------------
   22. SPEED TAP CHALLENGE
--------------------------------------------------------- */
HB_GAMES.push({
  id: "speedtap",
  title: "Speed Tap Challenge",
  icon: "👆",
  iconClass: "reflex",
  tag: "Reflex",
  players: "1+ players",
  desc: "Tap as fast as you can in 5 seconds — then pass it on and beat the score!",
  init(stage, api){
    const self = this;
    self._active = true;
    let taps = 0;
    let timeLeft = 5;

    stage.innerHTML = `
      <div class="center-msg">
        <div class="emoji">👆</div>
        <h3>Speed Tap Challenge</h3>
        <p>When the timer starts, tap the button as many times as you can in 5 seconds!</p>
        <button class="big-btn" id="stBegin">Get ready 🚀</button>
      </div>
    `;
    document.getElementById("stBegin").onclick = countdown;

    function countdown(){
      let n = 3;
      stage.innerHTML = `<div class="center-msg"><div class="emoji" id="stCount">${n}</div></div>`;
      self._countTimer = setInterval(()=>{
        if(!self._active){ clearInterval(self._countTimer); return; }
        n--;
        const el = document.getElementById("stCount");
        if(n>0){
          if(el) el.textContent = n;
        } else {
          clearInterval(self._countTimer);
          startTap();
        }
      }, 700);
    }

    function startTap(){
      api.setScore(0);
      taps = 0;
      timeLeft = 5;
      stage.innerHTML = `
        <div class="center-msg">
          <div style="font-weight:800;">⏱ <span id="stTime">5</span>s</div>
          <button class="big-btn" id="stButton" style="font-size:20px;padding:40px;border-radius:50%;">TAP! 👆</button>
          <div style="font-weight:800;font-size:18px;">Taps: <span id="stTaps">0</span></div>
        </div>
      `;
      document.getElementById("stButton").onclick = ()=>{
        taps++;
        const t = document.getElementById("stTaps");
        if(t) t.textContent = taps;
      };
      self._tapClock = setInterval(()=>{
        if(!self._active){ clearInterval(self._tapClock); return; }
        timeLeft--;
        const t = document.getElementById("stTime");
        if(t) t.textContent = timeLeft;
        if(timeLeft<=0){
          clearInterval(self._tapClock);
          api.addScore(taps*2);
          api.endGame(`${taps} taps! Pass it to the next hunter 🔥`);
        }
      },1000);
    }
  },
  cleanup(){
    this._active = false;
    if(this._countTimer) clearInterval(this._countTimer);
    if(this._tapClock) clearInterval(this._tapClock);
  }
});

/* ---------------------------------------------------------
   23. DON'T PRESS THE BUTTON
--------------------------------------------------------- */
HB_GAMES.push({
  id: "dontpress",
  title: "Don't Press the Button!",
  icon: "🔘",
  iconClass: "reflex",
  tag: "Reflex",
  players: "1+ players",
  desc: "Green means go — press it! Red means stop, or the button gets ANGRY.",
  init(stage, api){
    const self = this;
    self._active = true;
    let timeLeft = 30;
    let state = "green";
    let running = false;

    stage.innerHTML = `
      <div class="center-msg">
        <div class="emoji">🔘</div>
        <h3>Don't Press the Button!</h3>
        <p>Tap the button when it's GREEN. If it turns RED, don't touch it, or it'll get angry!</p>
        <button class="big-btn" id="dpBegin">Start 🚦</button>
      </div>
    `;
    document.getElementById("dpBegin").onclick = begin;

    function begin(){
      api.setScore(0);
      timeLeft = 30;
      running = true;
      state = "green";
      stage.innerHTML = `
        <div style="text-align:center;font-weight:800;margin-bottom:16px;">⏱ <span id="dpTime">30</span>s</div>
        <div class="center-msg" style="min-height:260px;">
          <button id="dpButton" style="width:160px;height:160px;border-radius:50%;border:none;font-size:44px;cursor:pointer;transition:transform .1s;"></button>
        </div>
      `;
      self._clockTimer = setInterval(()=>{
        if(!running || !self._active){ clearInterval(self._clockTimer); return; }
        timeLeft--;
        const t = document.getElementById("dpTime");
        if(t) t.textContent = timeLeft;
        if(timeLeft<=0) endGame();
      },1000);
      updateButton();
      cycleState();
    }

    function updateButton(){
      const btn = document.getElementById("dpButton");
      if(!btn) return;
      if(state === "green"){
        btn.style.background = "linear-gradient(135deg,var(--green),#20a06a)";
        btn.textContent = "😊";
        btn.style.boxShadow = "0 6px 0 #0f5a3d";
      } else {
        btn.style.background = "linear-gradient(135deg,#e24b4a,#8f1f1f)";
        btn.textContent = "😐";
        btn.style.boxShadow = "0 6px 0 #5e1414";
      }
      btn.onclick = () => handlePress();
    }

    function handlePress(){
      if(!running || !self._active) return;
      const btn = document.getElementById("dpButton");
      if(state === "green"){
        api.addScore(10);
        if(btn){
          btn.textContent = "🤩";
          btn.style.transform = "scale(1.1)";
          setTimeout(()=>{ if(btn) btn.style.transform = "scale(1)"; }, 120);
        }
      } else {
        api.addScore(-8);
        if(btn){
          btn.textContent = "😡";
          btn.style.animation = "dpShake .4s";
          setTimeout(()=>{ if(btn) btn.style.animation = ""; }, 400);
        }
      }
    }

    function cycleState(){
      if(!running || !self._active) return;
      state = Math.random() < 0.55 ? "green" : "red";
      updateButton();
      self._stateTimer = setTimeout(cycleState, 700 + Math.random()*1000);
    }

    function endGame(){
      running = false;
      clearInterval(self._clockTimer);
      clearTimeout(self._stateTimer);
      api.endGame("Time's up! 🔘");
    }
  },
  cleanup(){
    this._active = false;
    if(this._clockTimer) clearInterval(this._clockTimer);
    if(this._stateTimer) clearTimeout(this._stateTimer);
  }
});

/* ---------------------------------------------------------
   24. FLOOR IS LAVA
--------------------------------------------------------- */
HB_GAMES.push({
  id: "floorislava",
  title: "Floor is Lava!",
  icon: "🌋",
  iconClass: "party",
  tag: "Party",
  players: "1+ players",
  desc: "When it says LAVA, everyone jump off the floor — fast!",
  init(stage, api){
    const self = this;
    self._active = true;
    let round = 0;
    const TOTAL = 8;

    stage.innerHTML = `
      <div class="center-msg">
        <div class="emoji">🌋</div>
        <h3>Floor is Lava!</h3>
        <p>Wait for it... when the screen turns to LAVA, everyone jump onto a chair, couch, or anything off the floor — then tap the button as fast as you can!</p>
        <button class="big-btn" id="flBegin">Start 🌋</button>
      </div>
    `;
    document.getElementById("flBegin").onclick = ()=>{ api.setScore(0); round=0; nextRound(); };

    function nextRound(){
      if(!self._active) return;
      round++;
      if(round > TOTAL){
        api.endGame("Everyone survived the lava! 🌋");
        return;
      }
      stage.innerHTML = `
        <div class="center-msg" style="min-height:300px;">
          <div style="color:var(--text-dim);font-weight:700;">Round ${round} of ${TOTAL}</div>
          <div class="emoji">😌</div>
          <h3>Floor is safe... for now</h3>
          <p>Get ready!</p>
        </div>
      `;
      const delay = 2000 + Math.random()*4000;
      self._delayTimer = setTimeout(()=>{
        if(!self._active) return;
        showLava();
      }, delay);
    }

    function showLava(){
      const startTime = Date.now();
      let resolved = false;
      stage.innerHTML = `
        <div class="center-msg" style="min-height:300px;background:linear-gradient(160deg,#ff5d3a,#c21b1b);border-radius:20px;">
          <div class="emoji">🌋</div>
          <h3 style="font-size:26px;">FLOOR IS LAVA!!</h3>
          <button class="big-btn" id="flSafe" style="background:#fff;color:#c21b1b;box-shadow:0 5px 0 #999;">I'm off the floor! ⬆️</button>
        </div>
      `;
      document.getElementById("flSafe").onclick = ()=>{
        if(resolved || !self._active) return;
        resolved = true;
        clearTimeout(self._timeoutTimer);
        const reaction = Date.now() - startTime;
        const points = Math.max(5, 30 - Math.floor(reaction/150));
        api.addScore(points);
        nextRound();
      };
      self._timeoutTimer = setTimeout(()=>{
        if(!self._active || resolved) return;
        nextRound();
      }, 4000);
    }
  },
  cleanup(){
    this._active = false;
    if(this._delayTimer) clearTimeout(this._delayTimer);
    if(this._timeoutTimer) clearTimeout(this._timeoutTimer);
  }
});

/* ---------------------------------------------------------
   25. FREEZE DANCE
--------------------------------------------------------- */
HB_GAMES.push({
  id: "freezedance",
  title: "Freeze Dance",
  icon: "💃",
  iconClass: "party",
  tag: "Party",
  players: "1+ players",
  desc: "Dance it out! But when the music stops, freeze — don't get caught moving.",
  init(stage, api){
    const self = this;
    self._active = true;
    let timeLeft = 30;
    let state = "dance";
    let running = false;

    stage.innerHTML = `
      <div class="center-msg">
        <div class="emoji">💃</div>
        <h3>Freeze Dance</h3>
        <p>Dance around while it says DANCE! When it suddenly says FREEZE, stop moving and tap the button fast!</p>
        <button class="big-btn" id="fdBegin">Start 🎶</button>
      </div>
    `;
    document.getElementById("fdBegin").onclick = begin;

    function begin(){
      api.setScore(0);
      timeLeft = 30;
      running = true;
      state = "dance";
      stage.innerHTML = `
        <div style="text-align:center;font-weight:800;margin-bottom:14px;">⏱ <span id="fdTime">30</span>s</div>
        <div class="center-msg" style="min-height:260px;" id="fdStage"></div>
      `;
      self._clockTimer = setInterval(()=>{
        if(!running || !self._active){ clearInterval(self._clockTimer); return; }
        timeLeft--;
        const t = document.getElementById("fdTime");
        if(t) t.textContent = timeLeft;
        if(timeLeft<=0) endGame();
      },1000);
      renderState();
      cycleState();
    }

    function renderState(){
      const wrap = document.getElementById("fdStage");
      if(!wrap) return;
      if(state === "dance"){
        wrap.innerHTML = `
          <div class="emoji">💃🕺</div>
          <h3 style="color:var(--blue);">KEEP DANCING!</h3>
        `;
      } else {
        wrap.innerHTML = `
          <div class="emoji">❄️</div>
          <h3 style="color:var(--pink);">FREEZE!</h3>
          <button class="big-btn" id="fdTap">I froze! 🧊</button>
        `;
        const btn = document.getElementById("fdTap");
        if(btn) btn.onclick = ()=>{
          if(state !== "freeze" || !self._active) return;
          api.addScore(15);
          state = "dance";
          renderState();
        };
      }
    }

    function cycleState(){
      if(!running || !self._active) return;
      state = state === "dance" ? "freeze" : "dance";
      renderState();
      const delay = state === "freeze" ? (1500 + Math.random()*1000) : (1800 + Math.random()*2200);
      self._stateTimer = setTimeout(cycleState, delay);
    }

    function endGame(){
      running = false;
      clearInterval(self._clockTimer);
      clearTimeout(self._stateTimer);
      api.endGame("Time's up! 💃");
    }
  },
  cleanup(){
    this._active = false;
    if(this._clockTimer) clearInterval(this._clockTimer);
    if(this._stateTimer) clearTimeout(this._stateTimer);
  }
});

/* ---------------------------------------------------------
   26. RED LIGHT, GREEN LIGHT
--------------------------------------------------------- */
HB_GAMES.push({
  id: "redlightgreenlight",
  title: "Red Light, Green Light",
  icon: "🚦",
  iconClass: "party",
  tag: "Party",
  players: "1+ players",
  desc: "Tap fast on green to run — freeze on red or you'll get caught!",
  init(stage, api){
    const self = this;
    self._active = true;
    let state, progress, running, finished, timeLeft;

    stage.innerHTML = `
      <div class="center-msg">
        <div class="emoji">🚦</div>
        <h3>Red Light, Green Light</h3>
        <p>Tap the button as fast as you can on GREEN to run forward. Freeze on RED — tapping during red sends you back!</p>
        <button class="big-btn" id="rlBegin">Start 🏁</button>
      </div>
    `;
    document.getElementById("rlBegin").onclick = begin;

    function begin(){
      api.setScore(0);
      progress = 0;
      running = true;
      finished = false;
      state = "green";
      timeLeft = 40;
      stage.innerHTML = `
        <div id="rlLightLabel" style="text-align:center;font-weight:800;font-size:20px;margin-bottom:10px;color:var(--green);">GREEN LIGHT — GO!</div>
        <div style="background:#0e0824;border-radius:999px;height:26px;margin-bottom:20px;overflow:hidden;">
          <div id="rlBar" style="height:100%;width:0%;background:linear-gradient(90deg,var(--green),var(--blue));transition:width .15s;"></div>
        </div>
        <div class="center-msg" style="min-height:160px;">
          <button class="big-btn" id="rlTap" style="font-size:20px;padding:26px 40px;">🏃 RUN</button>
        </div>
      `;
      document.getElementById("rlTap").onclick = tap;

      self._clockTimer = setInterval(()=>{
        if(!running || !self._active){ clearInterval(self._clockTimer); return; }
        timeLeft--;
        if(timeLeft<=0 && !finished) endGame("Time's up! 🚦");
      },1000);

      cycleState();
    }

    function updateBar(){
      const bar = document.getElementById("rlBar");
      if(bar) bar.style.width = Math.max(0, Math.min(100, progress)) + "%";
      const label = document.getElementById("rlLightLabel");
      if(label){
        if(state === "green"){
          label.textContent = "GREEN LIGHT — GO!";
          label.style.color = "var(--green)";
        } else {
          label.textContent = "RED LIGHT — FREEZE!";
          label.style.color = "var(--pink)";
        }
      }
    }

    function tap(){
      if(!running || !self._active || finished) return;
      if(state === "green"){
        progress += 6;
        api.addScore(2);
      } else {
        progress = Math.max(0, progress - 20);
        const label = document.getElementById("rlLightLabel");
        if(label){ label.textContent = "CAUGHT! Sent back!"; }
      }
      updateBar();
      if(progress >= 100 && !finished){
        finished = true;
        api.addScore(30);
        endGame("You made it to the finish line! 🏁");
      }
    }

    function cycleState(){
      if(!running || !self._active || finished) return;
      state = Math.random() < 0.55 ? "green" : "red";
      updateBar();
      self._stateTimer = setTimeout(cycleState, 1000 + Math.random()*1400);
    }

    function endGame(msg){
      running = false;
      clearTimeout(self._stateTimer);
      clearInterval(self._clockTimer);
      api.endGame(msg);
    }
  },
  cleanup(){
    this._active = false;
    if(this._stateTimer) clearTimeout(this._stateTimer);
    if(this._clockTimer) clearInterval(this._clockTimer);
  }
});

/* ---------------------------------------------------------
   27. BALLOON KEEP-UP
--------------------------------------------------------- */
HB_GAMES.push({
  id: "balloonkeepup",
  title: "Balloon Keep-Up",
  icon: "🎈",
  iconClass: "reflex",
  tag: "Arcade",
  players: "1 player",
  desc: "Keep tapping to keep the balloon from touching the ground!",
  init(stage, api){
    const self = this;
    self._active = true;
    let y, vy, running, elapsed;
    const GRAVITY = 0.35;
    const BOOP = -6;
    const GROUND = 320;

    stage.innerHTML = `
      <div class="center-msg">
        <div class="emoji">🎈</div>
        <h3>Balloon Keep-Up</h3>
        <p>Tap anywhere on the balloon area to boop the balloon up. Don't let it touch the ground!</p>
        <button class="big-btn" id="bkBegin">Start 🎈</button>
      </div>
    `;
    document.getElementById("bkBegin").onclick = begin;

    function begin(){
      api.setScore(0);
      y = 150;
      vy = 0;
      elapsed = 0;
      running = true;
      stage.innerHTML = `
        <div id="bkArena" style="position:relative;height:${GROUND+20}px;background:linear-gradient(180deg,#1c2a5e,#180d30);border-radius:16px;overflow:hidden;cursor:pointer;">
          <div id="bkBalloon" style="position:absolute;left:calc(50% - 30px);width:60px;height:70px;font-size:50px;text-align:center;line-height:70px;">🎈</div>
          <div style="position:absolute;left:0;right:0;bottom:0;height:6px;background:var(--pink);"></div>
        </div>
      `;
      document.getElementById("bkArena").onclick = boop;
      self._loopTimer = setInterval(tick, 30);
    }

    function boop(){
      if(!running || !self._active) return;
      vy = BOOP;
    }

    function tick(){
      if(!running || !self._active){ clearInterval(self._loopTimer); return; }
      vy += GRAVITY;
      y += vy;
      if(y < 0){ y = 0; vy = 0; }
      const balloon = document.getElementById("bkBalloon");
      if(balloon) balloon.style.top = y + "px";
      elapsed++;
      if(elapsed % 33 === 0) api.addScore(1);
      if(y >= GROUND){
        running = false;
        clearInterval(self._loopTimer);
        api.endGame("The balloon touched down! 🎈");
      }
    }
  },
  cleanup(){
    this._active = false;
    if(this._loopTimer) clearInterval(this._loopTimer);
  }
});