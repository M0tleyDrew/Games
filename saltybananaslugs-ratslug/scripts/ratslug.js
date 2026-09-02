import { RATSLUG_PROMPTS } from "./prompts.js";

const ID = "saltybananaslugs-ratslug";
const SETTING = "gameState";
const esc = s => String(s ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
const uid = () => foundry.utils.randomID();

function freshState() {
  return { phase:"lobby", paused:false, players:[], personas:{}, promptDeck:[...RATSLUG_PROMPTS], usedPrompts:[], currentPrompt:null, responses:{}, messages:[], guesses:{}, favorites:{}, revealed:[], round:1, promptNumber:0, roundPrompts:[], roundSubmissions:{}, scores:{}, favoriteTotals:{}, roundResults:[], pendingRevealCandidates:[], winnerIds:[] };
}
let state = freshState();
let activeTab = "home";
let pendingPersonaImage = null;
let seenResponseSignal = "";
let uiDraft = {};
let uiView = {};
let skipNextDraftCapture = false;
const responseSignal = () => `${state.round}:`+(state.roundPrompts||[]).map(item=>`${item.number}:${Object.keys(item.responses||{}).sort().join(",")}`).join("|");

function draftKey(element,round=state.round){const field=element.id||(element.dataset.guess?`guess-${element.dataset.guess}`:null);return field?`${activeTab}:${round}:${field}`:null;}
function captureDraft(root,round=state.round){if(!root)return;root.querySelectorAll("input[id],textarea[id],select[id],[data-guess]").forEach(element=>{if(element.type==="file")return;const key=draftKey(element,round);if(key)uiDraft[key]=element.value;});}
function restoreDraft(root){if(!root)return;root.querySelectorAll("input[id],textarea[id],select[id],[data-guess]").forEach(element=>{if(element.type==="file"||element.disabled)return;const key=draftKey(element);if(key&&Object.prototype.hasOwnProperty.call(uiDraft,key))element.value=uiDraft[key];});if(pendingPersonaImage&&!state.personas[game.user.id]){const preview=root.querySelector("#rs-image-preview");if(preview)preview.outerHTML=`<img id="rs-image-preview" src="${pendingPersonaImage}">`;}}
function viewKey(round=state.round){return `${activeTab}:${round}`;}
function captureView(root,round=state.round){if(!root)return;captureDraft(root,round);const main=root.querySelector("main"),focused=root.contains(document.activeElement)?document.activeElement:null,key=focused?draftKey(focused,round):null;uiView[viewKey(round)]={mainScroll:main?.scrollTop||0,scrolls:Object.fromEntries([...root.querySelectorAll("[data-rs-scroll]")].map(element=>[element.dataset.rsScroll,element.scrollTop])),focus:key,selectionStart:typeof focused?.selectionStart==="number"?focused.selectionStart:null,selectionEnd:typeof focused?.selectionEnd==="number"?focused.selectionEnd:null};}
function restoreView(root){if(!root)return;restoreDraft(root);const saved=uiView[viewKey()];if(!saved)return;const main=root.querySelector("main");if(main)main.scrollTop=saved.mainScroll||0;root.querySelectorAll("[data-rs-scroll]").forEach(element=>{if(Object.prototype.hasOwnProperty.call(saved.scrolls||{},element.dataset.rsScroll))element.scrollTop=saved.scrolls[element.dataset.rsScroll];});if(saved.focus){const focused=[...root.querySelectorAll("input[id],textarea[id],select[id],[data-guess]")].find(element=>draftKey(element)===saved.focus&&!element.disabled);if(focused){focused.focus({preventScroll:true});if(saved.selectionStart!==null&&typeof focused.setSelectionRange==="function")focused.setSelectionRange(saved.selectionStart,saved.selectionEnd);}}}

Hooks.once("init", () => {
  game.settings.register(ID, SETTING, {scope:"world", config:false, type:Object, default:freshState(), restricted:true});
});

Hooks.once("ready", async () => {
  state = foundry.utils.deepClone(game.settings.get(ID, SETTING) || freshState());
  const legacyRoundState = !state.roundSubmissions;
  if (legacyRoundState) {
    state.phase="lobby"; state.round=1; state.promptNumber=0; state.currentPrompt=null;
    state.responses={}; state.roundPrompts=[]; state.roundSubmissions={};
    if (game.user.isGM) await game.settings.set(ID, SETTING, state);
  }
  state.scores ??= {};
  state.favoriteTotals ??= {};
  state.roundResults ??= [];
  state.pendingRevealCandidates ??= [];
  state.winnerIds ??= [];
  game.socket.on(`module.${ID}`, receive);
  Hooks.on("renderPlayerList", (_app, html) => {
    const root = html instanceof HTMLElement ? html : html[0];
    if (!root || root.querySelector(".ratslug-launch")) return;
    const b=document.createElement("button"); b.className="ratslug-launch"; b.innerHTML='<i class="fas fa-rat"></i> RatSlug'; b.onclick=openUI; root.append(b);
  });
  if (!document.querySelector(".ratslug-fab")) {
    const fab=document.createElement("button"); fab.className="ratslug-fab"; fab.innerHTML='<i class="fas fa-rat"></i><span>RatSlug</span>'; fab.onclick=openUI; document.body.append(fab);
  }
  if (!game.user.isGM) document.body.classList.add("ratslug-player-mode");
  globalThis.ratslugOpen = openUI;
  window.setTimeout(openUI, 500);
  ui.notifications.info("RatSlug is ready. Open it from the Players list.");
});

async function save(next=state) {
  captureView(document.querySelector(".ratslug-shell"),state.round);
  if(next.phase==="lobby"&&state.phase!=="lobby"){uiDraft={};uiView={};}
  state=next;
  skipNextDraftCapture=true;
  if (game.user.isGM && ["roundResult","revealChoice","end"].includes(state.phase)) activeTab="results";
  if (game.user.isGM) await game.settings.set(ID, SETTING, state);
  game.socket.emit(`module.${ID}`, {type:"state", state});
  render();
}
function receive(data) {
  if (data.type==="state") { const previousPhase=state.phase,previousRound=state.round;captureView(document.querySelector(".ratslug-shell"),previousRound);if(data.state.phase==="lobby"&&previousPhase!=="lobby"){uiDraft={};uiView={};}state=data.state;skipNextDraftCapture=true;if(!game.user.isGM&&state.phase==="voting"&&previousPhase!=="voting")activeTab="guess";if(!game.user.isGM&&state.phase==="play"&&previousPhase==="roundResult")activeTab="prompts";if(!game.user.isGM&&["roundResult","revealChoice","end"].includes(state.phase)&&state.phase!==previousPhase)activeTab="results";render(); return; }
  if (data.type==="action" && game.user.isGM) handle(data.action, data.userId, data.payload);
}
function act(action,payload={}) {
  if (game.user.isGM) handle(action,game.user.id,payload);
  else game.socket.emit(`module.${ID}`,{type:"action",action,userId:game.user.id,payload});
}

function correctGuesses(s,playerId){const guesses=s.roundSubmissions[s.round]?.[playerId]?.guesses||{};return s.players.filter(id=>id!==playerId&&guesses[id]===id).length;}
function finishReveal(s,playerId){if(playerId&&!s.revealed.includes(playerId))s.revealed.push(playerId);const result=s.roundResults.at(-1);if(result)result.revealedId=playerId||null;s.pendingRevealCandidates=[];const survivors=s.players.filter(id=>!s.revealed.includes(id));if(survivors.length<=1){s.winnerIds=survivors;s.phase="end";}else s.phase="roundResult";}
function scoreRound(s){
  const earned={};
  for(const id of s.players){earned[id]=correctGuesses(s,id);s.scores[id]=(s.scores[id]||0)+earned[id];const favorite=s.roundSubmissions[s.round]?.[id]?.favorite;if(favorite)s.favoriteTotals[favorite]=(s.favoriteTotals[favorite]||0)+1;}
  s.roundResults.push({round:s.round,earned,revealedId:null});
  const active=s.players.filter(id=>!s.revealed.includes(id));
  const perfect=active.filter(id=>earned[id]===s.players.length-1);
  if(perfect.length){s.winnerIds=perfect;s.phase="end";return;}
  if(active.length<=1){s.winnerIds=active;s.phase="end";return;}
  if(s.round<2){s.phase="roundResult";return;}
  const lowTotal=Math.min(...active.map(id=>s.scores[id]||0));let candidates=active.filter(id=>(s.scores[id]||0)===lowTotal);
  const lowRound=Math.min(...candidates.map(id=>earned[id]));candidates=candidates.filter(id=>earned[id]===lowRound);
  if(candidates.length===1)finishReveal(s,candidates[0]);else{s.pendingRevealCandidates=candidates;s.roundResults.at(-1).revealCandidates=[...candidates];s.phase="revealChoice";}
}

function handle(action,userId,p={}) {
  const s=foundry.utils.deepClone(state); const isGM=game.users.get(userId)?.isGM;
  if(action==="join" && !s.players.includes(userId)) s.players.push(userId);
  if(action==="leave" && !s.personas[userId]) s.players=s.players.filter(x=>x!==userId);
  if(action==="persona" && !s.personas[userId] && String(p.name||"").trim()) s.personas[userId]={name:String(p.name||"").slice(0,40),bio:String(p.bio||"").slice(0,300),catchphrase:String(p.catchphrase||"").slice(0,120),image:String(p.image||"").slice(0,400000)};
  if(action==="message" && !s.paused && s.players.includes(userId) && p.text?.trim()) s.messages.push({id:uid(),userId,recipientId:p.recipientId||null,text:String(p.text).slice(0,500),at:Date.now()});
  if(action==="response" && !s.paused && s.phase==="play" && s.players.includes(userId) && String(p.text||"").trim()) {const target=s.roundPrompts.find(x=>x.number===Number(p.promptNumber));if(target&&!Object.prototype.hasOwnProperty.call(target.responses||{},userId)){target.responses??={};target.responses[userId]=String(p.text||"").slice(0,1000);if(target.number===s.promptNumber)s.responses=foundry.utils.deepClone(target.responses);}}
  if(action==="submitRound" && s.phase==="voting" && s.players.includes(userId) && !s.roundSubmissions[s.round]?.[userId]) {const others=s.players.filter(id=>id!==userId),guesses=p.guesses||{},values=Object.values(guesses);if(others.every(id=>others.includes(guesses[id]))&&values.length===others.length&&new Set(values).size===values.length&&others.includes(p.favorite)){s.roundSubmissions[s.round]??={};s.roundSubmissions[s.round][userId]={guesses,favorite:p.favorite,lockedAt:Date.now()};}}
  if(isGM && action==="start" && s.players.length>0 && s.players.every(id=>s.personas[id])) {s.phase="play";s.round=1;s.promptNumber=0;s.currentPrompt=null;s.responses={};s.roundPrompts=[];}
  if(isGM && action==="prompt" && s.phase==="play" && s.promptNumber<4) {if(s.currentPrompt)s.usedPrompts.push(s.currentPrompt);s.currentPrompt=String(p.text||"").slice(0,500);s.promptDeck=s.promptDeck.filter(x=>x!==s.currentPrompt);s.responses={};s.promptNumber++;s.roundPrompts.push({round:s.round,number:s.promptNumber,text:s.currentPrompt,responses:{}});}
  if(isGM && action==="customPrompt" && s.phase==="play" && s.promptNumber<4) {if(s.currentPrompt)s.usedPrompts.push(s.currentPrompt);s.currentPrompt=String(p.text||"").slice(0,500);s.responses={};s.promptNumber++;s.roundPrompts.push({round:s.round,number:s.promptNumber,text:s.currentPrompt,responses:{}});}
  if(isGM && action==="openVoting" && s.phase==="play" && s.promptNumber===4) {s.phase="voting";s.currentPrompt=null;s.responses={};}
  if(isGM && action==="scoreRound" && s.phase==="voting" && s.players.length>0 && s.players.every(id=>s.roundSubmissions[s.round]?.[id])) scoreRound(s);
  if(isGM && action==="chooseReveal" && s.phase==="revealChoice" && s.pendingRevealCandidates.includes(p.userId)) finishReveal(s,p.userId);
  if(isGM && action==="nextRound" && s.phase==="roundResult") {s.round++;s.promptNumber=0;s.currentPrompt=null;s.responses={};s.roundPrompts=[];s.phase="play";}
  if(isGM && action==="clearPrompt" && s.phase==="play" && s.currentPrompt) {s.usedPrompts.push(s.currentPrompt);s.roundPrompts=s.roundPrompts.filter(x=>x.number!==s.promptNumber);s.promptNumber=Math.max(0,s.promptNumber-1);s.currentPrompt=null;s.responses={};}
  if(isGM && action==="togglePause") s.paused=!s.paused;
  if(isGM && action==="resetDeck") {s.promptDeck=[...RATSLUG_PROMPTS];s.usedPrompts=[];s.currentPrompt=null;}
  if(isGM && action==="reset" && confirm("Reset the entire RatSlug game?")) return save(freshState());
  save(s);
}

function openUI(){ document.querySelector(".ratslug-shell")?.remove(); const el=document.createElement("div");el.className=`ratslug-shell ${game.user.isGM?'ratslug-host':'ratslug-player'}`;el.addEventListener("click",e=>{if(e.target.closest("[data-pause]"))act("togglePause")});document.body.append(el);render(); }
function me(){return game.user.id} function persona(id){return state.personas[id]||{name:"Unfinished Persona",bio:"",catchphrase:"",image:""}}
function avatar(id){const p=persona(id);return p.image?`<img src="${p.image}">`:`<div class="ratslug-placeholder">?</div>`}
function currentView(){const root=document.querySelector(".ratslug-shell");if(!skipNextDraftCapture)captureView(root);skipNextDraftCapture=false;return activeTab==="results"?results():activeTab==="prompts"?prompts():activeTab==="chat"?chat():activeTab==="guess"?guess():activeTab==="host"&&game.user.isGM?host():home()}
function render(){const root=document.querySelector(".ratslug-shell");if(!root)return;const signal=responseSignal(),anyResponses=state.roundPrompts.some(item=>Object.keys(item.responses||{}).length);if(activeTab==="prompts")seenResponseSignal=signal;const hasNewResponses=anyResponses&&signal!==seenResponseSignal,showResults=["roundResult","revealChoice","end"].includes(state.phase);root.innerHTML=`<header><img src="modules/${ID}/assets/ratslug.png"><div><h1>RatSlug</h1><small>Round ${state.round} · Prompt ${state.promptNumber}/4 · ${esc(state.phase)}${state.paused?' · PAUSED':''}</small></div><button data-x>×</button></header><nav><button data-tab="home" class="${activeTab==='home'?'active':''}">Game</button><button data-tab="prompts" class="${activeTab==='prompts'?'active ':''}${hasNewResponses?'has-responses':''}">Prompts</button><button data-tab="chat" class="${activeTab==='chat'?'active':''}">Chat</button><button data-tab="guess" class="${activeTab==='guess'?'active':''}">Identity Board</button>${showResults?`<button data-tab="results" class="${activeTab==='results'?'active':''}">Results</button>`:''}${game.user.isGM?`<button data-tab="host" class="${activeTab==='host'?'active':''}">Host</button>`:''}</nav><main>${state.paused?'<div class="paused-banner">The host has paused the game.</div>':''}${currentView()}</main>`;bind(root);}
function home(){const isJoined=state.players.includes(me()),locked=Object.prototype.hasOwnProperty.call(state.personas,me()),p=persona(me());return `<section><h2>${isJoined?'Your Persona':'Join the deception'}</h2>${isJoined?(locked?`<div class="rs-locked-persona">${avatar(me())}<div><h3>${esc(p.name)} <i class="fas fa-lock"></i></h3><p>${esc(p.bio)}</p><p><em>${esc(p.catchphrase)}</em></p><small>Persona locked until the host resets the game.</small></div></div>`:`<label>Character name<input id="rs-name" maxlength="40" placeholder="Required"></label><label>Biography<textarea id="rs-bio"></textarea></label><label>Catchphrase<input id="rs-catch" maxlength="120"></label><div class="ratslug-image-row"><div id="rs-image-preview" class="ratslug-placeholder">?</div><label class="ratslug-upload">Choose persona image<input id="rs-image" type="file" accept="image/*"></label></div><button data-save-persona>Save & Lock Persona</button><button data-leave class="danger">Leave Game</button>`):`<p>Create a fake identity, answer in character, and determine which liar is which.</p><button data-join>Join RatSlug</button>`}</section>`}
function prompts(){const cards=[...state.roundPrompts].reverse().map(item=>{const answered=Object.prototype.hasOwnProperty.call(item.responses||{},me());return `<article class="rs-chat-prompt ${item.number===state.promptNumber&&state.phase==='play'?'current':''}"><h3>Prompt ${item.number} of 4</h3><blockquote>${esc(item.text)}</blockquote><div class="cards" data-rs-scroll="prompt-${item.number}-responses">${Object.entries(item.responses||{}).map(([id,v])=>`<article>${avatar(id)}<b>${esc(persona(id).name)}</b><p>${esc(v)}</p></article>`).join("")}</div>${state.phase==='play'&&state.players.includes(me())?(answered?`<div class="rs-locked-answer"><i class="fas fa-lock"></i> Answer posted and locked.</div>`:`<div class="rs-response-compose"><textarea id="rs-response-${item.number}" placeholder="Answer Prompt ${item.number} in character…"></textarea><button data-response="${item.number}">Send & Lock Answer</button></div>`):''}</article>`}).join("");return `<section><h2>Round ${state.round} Prompts</h2>${cards||'<p class="rs-chat-waiting">Waiting for the host to choose a prompt.</p>'}</section>`}
function chat(){const visible=state.messages.filter(m=>!m.recipientId||game.user.isGM||m.userId===me()||m.recipientId===me());return `<section><h2>Persona Chat</h2><div class="ratslug-chat" data-rs-scroll="persona-chat">${visible.map(m=>`<div class="${m.recipientId?'rs-private-message':''}">${avatar(m.userId)}<p><b>${esc(persona(m.userId).name)}</b>${m.recipientId?`<small>Private to ${esc(persona(m.recipientId).name)}</small>`:'<small>Public</small>'}<br>${esc(m.text)}</p></div>`).join("")}</div>${state.players.includes(me())?`<div class="send rs-chat-compose"><select id="rs-recipient"><option value="">Public chat</option>${state.players.filter(id=>id!==me()).map(id=>`<option value="${id}">Private: ${esc(persona(id).name)}</option>`).join("")}</select><input id="rs-chat" maxlength="500" placeholder="Speak as ${esc(persona(me()).name)}"><button data-send>Send</button></div>`:''}</section>`}
function guess(){const chars=state.players.filter(x=>x!==me()),locked=state.roundSubmissions[state.round]?.[me()];if(state.phase!=="voting")return `<section><h2>Identity Board</h2><p>Guessing opens after the fourth prompt.</p></section>`;if(!state.players.includes(me()))return `<section><h2>Round Submissions</h2><p>Players are locking their guesses and Favorite Character votes.</p></section>`;if(locked)return `<section class="rs-round-locked"><h2><i class="fas fa-lock"></i> Round ${state.round} Locked</h2><p>Your identity guesses and Favorite Character vote have been submitted and cannot be changed.</p></section>`;return `<section><h2>Who is playing whom?</h2><p>Use every real player exactly once, then choose your favorite persona from this round.</p>${chars.map(cid=>`<label class="match">${avatar(cid)}<b>${esc(persona(cid).name)}</b><select data-guess="${cid}"><option value="">Choose player…</option>${chars.map(uid=>`<option value="${uid}">${esc(game.users.get(uid)?.name||uid)}</option>`).join("")}</select></label>`).join("")}<div class="rs-favorite-vote"><h3>Favorite Character — Round ${state.round}</h3><select id="rs-favorite"><option value="">Choose persona…</option>${chars.map(id=>`<option value="${id}">${esc(persona(id).name)}</option>`).join("")}</select></div><button data-submit-round>Lock Round Submission</button></section>`}
function host(){const unused=state.promptDeck.length,full=state.promptNumber>=4,submitted=Object.keys(state.roundSubmissions[state.round]||{}).length,allSubmitted=state.players.length>0&&submitted===state.players.length;return `<section><h2>Host Controls</h2><p>${state.players.length} players · Round ${state.round} · Prompt ${state.promptNumber}/4 · ${unused} unused prompts</p><div class="host-buttons"><button data-pause>${state.paused?'Resume Game':'Pause Game'}</button>${state.phase==='lobby'?'<button data-start>Start Game</button>':''}${state.phase==='play'?`<button data-random ${full?'disabled':''}>Random Prompt</button><button data-clear ${state.currentPrompt?'':'disabled'}>Discard & Reroll Current</button><button data-open-voting ${full?'disabled':''}>Open Identity Voting</button>`:''}${state.phase==='voting'?`<button data-score-round ${allSubmitted?'':'disabled'}>Score Round (${submitted}/${state.players.length} locked)</button>`:''}${state.phase==='roundResult'?'<button data-next-round>Start Next Round</button>':''}<button data-reset-deck>Reset Prompt Deck</button><button data-reset class="danger">Reset Whole Game</button></div>${state.phase==='play'?`<label>Choose a built-in prompt<select id="rs-prompt" ${full?'disabled':''}><option value="">Select…</option>${state.promptDeck.map(x=>`<option>${esc(x)}</option>`).join("")}</select></label><button data-chosen ${full?'disabled':''}>Use Selected</button><label>Custom prompt<textarea id="rs-custom" ${full?'disabled':''}></textarea></label><button data-custom ${full?'disabled':''}>Use Custom Prompt</button>`:''}<h3>Characters</h3>${state.players.map(id=>`<div class="host-player">${avatar(id)}<span><b>${esc(persona(id).name)}</b>${state.revealed.includes(id)?' · REVEALED':''}</span><span>${state.scores[id]||0} points ${state.phase==='voting'?(state.roundSubmissions[state.round]?.[id]?'· Locked':'· Waiting'):''}</span></div>`).join("")}</section>`}
function results(){const latest=state.roundResults.at(-1),favoriteMax=Math.max(0,...Object.values(state.favoriteTotals||{})),favoriteWinners=state.players.filter(id=>(state.favoriteTotals[id]||0)===favoriteMax&&favoriteMax>0),finalRanking=[...state.players].sort((a,b)=>(state.scores[b]||0)-(state.scores[a]||0));return `<section class="rs-results"><h2>${state.phase==='end'?'Final Results':`Round ${state.round} Results`}</h2>${latest&&state.phase!=='end'?`<div class="rs-score-grid">${state.players.map(id=>`<article class="${state.revealed.includes(id)?'revealed':''}">${avatar(id)}<h3>${esc(persona(id).name)}</h3><p>${latest.earned[id]||0} this round · ${state.scores[id]||0} total</p>${latest.revealedId===id?`<strong>Revealed as ${esc(game.users.get(id)?.name||id)}</strong>`:''}</article>`).join("")}</div>`:''}${state.phase==='revealChoice'&&game.user.isGM?`<div class="rs-tie-choice"><h3>Elimination tie</h3><p>Choose which tied lowest-scoring player is revealed.</p>${state.pendingRevealCandidates.map(id=>`<button data-choose-reveal="${id}">${esc(persona(id).name)}</button>`).join("")}</div>`:''}${state.phase==='revealChoice'&&!game.user.isGM?'<p>The host is resolving an elimination tie.</p>':''}${state.phase==='roundResult'&&game.user.isGM?'<button data-next-round>Start Next Round</button>':''}${state.phase==='end'?`<div class="rs-winners"><h2>Main Winner${state.winnerIds.length===1?'':'s'}</h2><p>${state.winnerIds.map(id=>`${esc(persona(id).name)} — ${esc(game.users.get(id)?.name||id)} · ${state.scores[id]||0} points`).join(', ')||'No winner'}</p><h2>Favorite Character${favoriteWinners.length===1?'':'s'}</h2><p>${favoriteWinners.map(id=>`${esc(persona(id).name)} — ${esc(game.users.get(id)?.name||id)} · ${state.favoriteTotals[id]} votes`).join(', ')||'No votes cast'}</p></div><div class="rs-full-reveal"><h2>Full Group Reveal</h2><div class="rs-score-grid">${finalRanking.map((id,index)=>`<article><span class="rs-rank">#${index+1}</span>${avatar(id)}<h3>${esc(persona(id).name)}</h3><strong>${esc(game.users.get(id)?.name||id)}</strong><p>${state.scores[id]||0} points · ${state.favoriteTotals[id]||0} favorite votes</p></article>`).join("")}</div></div>`:''}</section>`}

function bind(root){
  const q=s=>root.querySelector(s);
  root.querySelectorAll("input[id],textarea[id],select[id],[data-guess]").forEach(element=>{if(element.type!=="file"){const remember=()=>{const key=draftKey(element);if(key)uiDraft[key]=element.value;};element.addEventListener("input",remember);element.addEventListener("change",remember);}});
  q("[data-x]").onclick=()=>root.remove();
  root.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{activeTab=b.dataset.tab;if(activeTab==="prompts")seenResponseSignal=responseSignal();render()});
  if(q("[data-join]"))q("[data-join]").onclick=()=>act("join");
  if(q("[data-leave]"))q("[data-leave]").onclick=()=>act("leave");
  if(q("[data-save-persona]"))q("[data-save-persona]").onclick=()=>{const name=q("#rs-name").value.trim();if(!name)return ui.notifications.warn("Your persona needs a name before it can be locked.");act("persona",{name,bio:q("#rs-bio").value,catchphrase:q("#rs-catch").value,image:pendingPersonaImage||""});pendingPersonaImage=null};
  if(q("#rs-image"))q("#rs-image").onchange=e=>compress(e.target.files[0]).then(image=>{pendingPersonaImage=image;const preview=q("#rs-image-preview");preview.outerHTML=`<img id="rs-image-preview" src="${image}">`});
  root.querySelectorAll("[data-response]").forEach(button=>button.onclick=()=>{const promptNumber=Number(button.dataset.response),input=q(`#rs-response-${promptNumber}`);if(input?.value.trim())act("response",{promptNumber,text:input.value})});
  if(q("[data-send]"))q("[data-send]").onclick=()=>{const input=q("#rs-chat"),text=input.value,recipientId=q("#rs-recipient")?.value||null;if(!text.trim())return;input.value="";act("message",{text,recipientId})};
  if(q("[data-submit-round]"))q("[data-submit-round]").onclick=()=>{const guesses=Object.fromEntries([...root.querySelectorAll("[data-guess]")].map(x=>[x.dataset.guess,x.value])),values=Object.values(guesses),favorite=q("#rs-favorite").value;if(values.some(v=>!v)||new Set(values).size!==values.length)return ui.notifications.warn("Match every persona and use each real player exactly once.");if(!favorite)return ui.notifications.warn("Choose a Favorite Character before locking the round.");act("submitRound",{guesses,favorite})};
  if(q("[data-random]"))q("[data-random]").onclick=()=>{if(!state.promptDeck.length)return ui.notifications.warn("The prompt deck is empty.");act("prompt",{text:state.promptDeck[Math.floor(Math.random()*state.promptDeck.length)]})};
  if(q("[data-chosen]"))q("[data-chosen]").onclick=()=>q("#rs-prompt").value&&act("prompt",{text:q("#rs-prompt").value});
  if(q("[data-custom]"))q("[data-custom]").onclick=()=>q("#rs-custom").value.trim()&&act("customPrompt",{text:q("#rs-custom").value});
  if(q("[data-clear]"))q("[data-clear]").onclick=()=>act("clearPrompt");
  if(q("[data-reset-deck]"))q("[data-reset-deck]").onclick=()=>act("resetDeck");
  if(q("[data-start]"))q("[data-start]").onclick=()=>state.players.length>0&&state.players.every(id=>state.personas[id])?act("start"):ui.notifications.warn("Every player must save and lock a persona before the game can start.");
  if(q("[data-open-voting]"))q("[data-open-voting]").onclick=()=>{activeTab="host";act("openVoting")};
  if(q("[data-score-round]"))q("[data-score-round]").onclick=()=>act("scoreRound");
  if(q("[data-next-round]"))q("[data-next-round]").onclick=()=>act("nextRound");
  root.querySelectorAll("[data-choose-reveal]").forEach(button=>button.onclick=()=>act("chooseReveal",{userId:button.dataset.chooseReveal}));
  if(q("[data-reset]"))q("[data-reset]").onclick=()=>act("reset");
  restoreView(root);
}
async function compress(file){if(!file)return"";const bitmap=await createImageBitmap(file);const max=512,scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));const c=document.createElement("canvas");c.width=Math.round(bitmap.width*scale);c.height=Math.round(bitmap.height*scale);c.getContext("2d").drawImage(bitmap,0,0,c.width,c.height);return c.toDataURL("image/webp",.78)}
