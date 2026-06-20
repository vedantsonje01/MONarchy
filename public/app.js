// ============================================================
// MONarchy — app.js
// Real API + MetaMask wallet integration
// ============================================================

// ── Contract config ─────────────────────────────────────────
const CONTRACT_ADDRESS = '0x1c8A6b2265C9c5785797f9531D3DfF5fCF060DD8';
const MONAD_CHAIN_ID    = 10143;
const MONAD_CHAIN_HEX  = '0x279F'; // 10143 in hex

const CONTRACT_ABI = [
  {
    name: 'postBounty',
    type: 'function',
    stateMutability: 'payable',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'awardBounty',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'bountyId', type: 'uint256' },
      { name: 'winner',   type: 'address'  }
    ],
    outputs: []
  },
  {
    type: 'event',
    name: 'BountyPosted',
    inputs: [
      { name: 'bountyId', type: 'uint256', indexed: true },
      { name: 'asker',    type: 'address', indexed: true },
      { name: 'amount',   type: 'uint256', indexed: false }
    ]
  },
  {
    type: 'event',
    name: 'BountyAwarded',
    inputs: [
      { name: 'bountyId', type: 'uint256', indexed: true },
      { name: 'winner',   type: 'address', indexed: true },
      { name: 'amount',   type: 'uint256', indexed: false }
    ]
  }
];

// ── State ────────────────────────────────────────────────────
let walletConnected  = false;
let walletAddress    = null;
let selectedAgents   = [];
let questionText     = '';
let isBattleRunning  = false;
let winnerId         = null;
let currentBountyId  = null; // set after postBounty()

// ── DOM refs ─────────────────────────────────────────────────
const screenSetup    = document.getElementById('screen-setup');
const screenBattle   = document.getElementById('screen-battle');
const walletBtn      = document.getElementById('wallet-btn');
const walletText     = document.getElementById('wallet-text');
const questionInput  = document.getElementById('question-input');
const agentsGrid     = document.getElementById('agents-grid');
const nextPageBtn    = document.getElementById('next-page-btn');
const selectionHint  = document.getElementById('selection-hint');
const betInput       = document.getElementById('bet-input');
const battlePanels   = document.getElementById('battle-panels');
const consoleLogs    = document.getElementById('console-logs');
const battleControls = document.getElementById('battle-controls');
const playAgainBtn   = document.getElementById('play-again-btn');
const startBattleBtn = document.getElementById('start-battle-btn');

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  renderSetupGrid();
  setupEventListeners();
  startHeroTextAnimation();
  await fetchReputationAndAddresses();
});

// ── Hero animation ───────────────────────────────────────────
function startHeroTextAnimation() {
  const words = document.querySelectorAll('.dynamic-word');
  if (words.length === 0) return;
  let currentIndex = 0;
  setInterval(() => {
    const currentWord = words[currentIndex];
    currentIndex = (currentIndex + 1) % words.length;
    const nextWord = words[currentIndex];
    currentWord.classList.remove('active');
    currentWord.classList.add('exit');
    nextWord.classList.add('active');
    setTimeout(() => currentWord.classList.remove('exit'), 500);
  }, 2000);
}

// ── Fetch agent addresses + reputation wins ──────────────────
async function fetchReputationAndAddresses() {
  try {
    const [agentsRes, repRes] = await Promise.all([
      fetch('/api/agents'),
      fetch('/api/reputation')
    ]);
    const { agents }     = await agentsRes.json();
    const { reputation } = await repRes.json();

    // Merge into CHARACTERS array
    CHARACTERS.forEach(c => {
      const remote = agents.find(a => a.id === c.apiId);
      if (remote) c.address = remote.address;
      c.wins = reputation[c.apiId] ?? 0;
    });

    // Re-render grid if visible
    if (screenSetup.classList.contains('active')) renderSetupGrid();
  } catch (e) {
    console.warn('Could not fetch reputation/agents:', e);
  }
}

// ── Render setup grid ────────────────────────────────────────
function renderSetupGrid() {
  agentsGrid.innerHTML = '';
  CHARACTERS.forEach(agent => {
    const card = document.createElement('div');
    card.className = 'agent-card';
    card.dataset.id = agent.id;
    card.style.setProperty('--agent-color', agent.color);
    card.style.setProperty('--agent-glow', `${agent.color}40`);

    const winsBadge = agent.wins > 0
      ? `<div class="agent-wins">👑 ${agent.wins} battle win${agent.wins !== 1 ? 's' : ''}</div>`
      : '';

    card.innerHTML = `
      <div class="agent-image-wrap">
        <img src="${agent.image}" alt="${agent.name}" class="agent-card-img" loading="lazy">
        <div class="agent-image-overlay"></div>
      </div>
      <div class="agent-info-content">
        <div class="agent-header">
          <div class="agent-avatar">${agent.emoji}</div>
          <div class="agent-title-wrap">
            <h3>${agent.name}</h3>
          </div>
        </div>
        <p class="agent-tagline">${agent.tagline}</p>
        ${winsBadge}
      </div>
      <div class="agent-select-badge"></div>
    `;

    card.addEventListener('click', () => handleAgentSelection(agent, card));
    agentsGrid.appendChild(card);
  });
}

// ── Event Listeners ──────────────────────────────────────────
function setupEventListeners() {
  // Wallet connection
  walletBtn.addEventListener('click', handleWalletConnect);

  // Question input
  questionInput.addEventListener('input', () => {
    questionText = questionInput.value;
    validateSetupForm();
  });

  // Next Page
  nextPageBtn.addEventListener('click', () => {
    if (!nextPageBtn.classList.contains('disabled')) transitionToBattle();
  });

  // Start Battle button
  startBattleBtn.addEventListener('click', () => {
    startBattleBtn.classList.add('hidden');
    startBattleBtn.disabled = true;
    runBattleSequence();
  });

  // Play Again
  playAgainBtn.addEventListener('click', resetGame);
}

// ── MetaMask wallet connect ──────────────────────────────────
async function handleWalletConnect() {
  // Disconnect if already connected
  if (walletConnected) {
    walletConnected = false;
    walletAddress   = null;
    walletBtn.classList.remove('connected');
    walletText.textContent = 'Connect MONAD Wallet';
    logToConsole('Wallet disconnected.', 'muted');
    return;
  }

  if (!window.ethereum) {
    alert('MetaMask not detected. Please install MetaMask to connect a wallet.\n\nYou can still run in demo mode without a wallet.');
    return;
  }

  try {
    // Request accounts
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send('eth_requestAccounts', []);

    // Switch to Monad testnet
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: MONAD_CHAIN_HEX }]
      });
    } catch (switchErr) {
      // Chain not added yet — add it
      if (switchErr.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: MONAD_CHAIN_HEX,
            chainName: 'Monad Testnet',
            nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
            rpcUrls: ['https://testnet-rpc.monad.xyz'],
            blockExplorerUrls: ['https://testnet.monadexplorer.com']
          }]
        });
      } else {
        throw switchErr;
      }
    }

    // Confirm we're on the right chain
    const network = await provider.getNetwork();
    if (network.chainId !== MONAD_CHAIN_ID) {
      logToConsole('Please switch MetaMask to Monad Testnet.', 'red');
      return;
    }

    const signer = provider.getSigner();
    walletAddress   = await signer.getAddress();
    walletConnected = true;
    walletBtn.classList.add('connected');
    walletText.textContent = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
    logToConsole(`Wallet connected: ${walletAddress}`, 'success');
  } catch (e) {
    if (e.code === 4001) {
      logToConsole('Wallet connection rejected.', 'muted');
    } else {
      logToConsole(`Wallet error: ${e.message?.slice(0, 80) ?? e}`, 'red');
    }
  }
}

// ── Agent selection ──────────────────────────────────────────
function handleAgentSelection(agent, cardElement) {
  const index = selectedAgents.findIndex(a => a.id === agent.id);

  if (index > -1) {
    selectedAgents.splice(index, 1);
    cardElement.classList.remove('selected');
    cardElement.querySelector('.agent-select-badge').textContent = '';
    logToConsole(`${agent.name} removed from roster.`, 'muted');
  } else {
    if (selectedAgents.length < 3) {
      selectedAgents.push(agent);
      cardElement.classList.add('selected');
      logToConsole(`${agent.name} added to slot #${selectedAgents.length}.`, 'accent');
    } else {
      alert('You can select exactly 3 agents for the battle.');
      return;
    }
  }

  selectedAgents.forEach((a, i) => {
    const c = document.querySelector(`.agent-card[data-id="${a.id}"]`);
    if (c) c.querySelector('.agent-select-badge').textContent = i + 1;
  });

  validateSetupForm();
}

// ── Validate setup form ──────────────────────────────────────
function validateSetupForm() {
  const qOk = questionText.trim().length > 0;
  const aOk = selectedAgents.length === 3;

  if (qOk && aOk) {
    nextPageBtn.classList.remove('disabled');
    nextPageBtn.removeAttribute('disabled');
    selectionHint.style.color = 'var(--color-neon)';
    selectionHint.textContent = 'Roster locked! Click Next Page to start the battle.';
  } else {
    nextPageBtn.classList.add('disabled');
    nextPageBtn.setAttribute('disabled', 'true');
    selectionHint.style.color = 'var(--text-muted)';
    if (!qOk && !aOk) {
      selectionHint.textContent = 'Please enter a question and select exactly 3 agents to proceed.';
    } else if (!qOk) {
      selectionHint.textContent = `${selectedAgents.length}/3 agents selected. Now type your question.`;
    } else {
      selectionHint.textContent = `Select ${3 - selectedAgents.length} more agent(s) to build your roster.`;
    }
  }
}

// ── Console log helper ───────────────────────────────────────
function logToConsole(message, type = '') {
  const line = document.createElement('p');
  line.className = `log-line${type ? ' text-' + type : ''}`;
  line.textContent = `> ${message}`;
  consoleLogs.appendChild(line);
  consoleLogs.scrollTop = consoleLogs.scrollHeight;
}

// ── Transition to battle screen ──────────────────────────────
function transitionToBattle() {
  screenSetup.classList.remove('active');
  screenBattle.classList.add('active');
  screenBattle.classList.remove('locked');
  window.scrollTo({ top: 0, behavior: 'instant' });

  consoleLogs.innerHTML   = '';
  battlePanels.innerHTML  = '';
  battleControls.classList.add('hidden');
  startBattleBtn.classList.remove('hidden');
  startBattleBtn.disabled = false;
  winnerId        = null;
  currentBountyId = null;
  isBattleRunning = false;

  logToConsole('Battle environment ready.', 'muted');
  if (walletConnected) {
    logToConsole(`Wallet: ${walletAddress?.slice(0, 10)}... connected.`, 'success');
    logToConsole('Set your stake above, then click Start Battle.', 'accent');
  } else {
    logToConsole('No wallet connected — running in demo mode.', 'red');
    logToConsole('Click Start Battle to begin.', 'accent');
  }

  // Render empty panels for the 3 selected agents
  selectedAgents.forEach(agent => {
    const panel = document.createElement('div');
    panel.className = 'battle-agent-card';
    panel.id = `battle-panel-${agent.id}`;
    panel.style.setProperty('--agent-color', agent.color);
    panel.style.setProperty('--agent-glow', `${agent.color}40`);

    panel.innerHTML = `
      <div class="battle-agent-header">
        <div class="battle-agent-info">
          <div class="battle-agent-avatar-img-wrap">
            <img src="${agent.image}" class="battle-agent-avatar-img" alt="${agent.name}">
            <span class="battle-agent-avatar-emoji">${agent.emoji}</span>
          </div>
          <div class="battle-agent-title-wrap">
            <h3>${agent.name}</h3>
            <div class="battle-agent-personality">${agent.personality} bot</div>
          </div>
        </div>
      </div>
      <div class="bubble-stream" id="bubble-stream-${agent.id}"></div>
      <button class="vote-button hidden" id="vote-btn-${agent.id}" onclick="selectWinner(${agent.id})">
        👑 Vote ${agent.name}
      </button>
    `;

    battlePanels.appendChild(panel);
  });
}

// ── Post bounty on Monad ─────────────────────────────────────
async function postBountyOnChain() {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer   = provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    const betMON = parseFloat(betInput.value) || 0.05;
    logToConsole(`Posting ${betMON} MON bounty to Monad...`, 'muted');

    const tx = await contract.postBounty({
      value: ethers.utils.parseEther(String(betMON))
    });

    logToConsole('Waiting for Monad confirmation (~1s)...', 'muted');
    const receipt = await tx.wait();

    // Parse BountyPosted event to extract bountyId
    const bountyEvent = receipt.events?.find(e => e.event === 'BountyPosted');
    if (bountyEvent) {
      const id = Number(bountyEvent.args.bountyId);
      logToConsole(`Bounty #${id} locked on Monad. ✅`, 'success');
      return id;
    }
    return null;
  } catch (e) {
    if (e.code === 4001) {
      logToConsole('Bounty transaction rejected.', 'muted');
    } else {
      logToConsole(`Bounty error: ${e.message?.slice(0, 80) ?? e}`, 'red');
    }
    return null;
  }
}

// ── Award bounty to winner on Monad ─────────────────────────
async function awardBountyOnChain(bountyId, winnerAddress) {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer   = provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    logToConsole(`Sending payout to ${winnerAddress.slice(0, 10)}...`, 'muted');
    const tx      = await contract.awardBounty(bountyId, winnerAddress);
    const receipt = await tx.wait();
    logToConsole(`✅ MON paid out! Tx: ${receipt.transactionHash.slice(0, 20)}...`, 'success');

    // Refresh reputation badges after payout
    await fetchReputationAndAddresses();
  } catch (e) {
    if (e.code === 4001) {
      logToConsole('Payout transaction rejected.', 'muted');
    } else {
      logToConsole(`Payout error: ${e.message?.slice(0, 80) ?? e}`, 'red');
    }
  }
}

// ── Main battle sequence ─────────────────────────────────────
async function runBattleSequence() {
  isBattleRunning  = true;
  currentBountyId  = null;

  const selectedApiIds = selectedAgents.map(a => a.apiId);

  // STEP 1: Post bounty on-chain (if wallet connected)
  if (walletConnected && window.ethereum) {
    const id = await postBountyOnChain();
    if (id !== null) currentBountyId = id;
  }

  // STEP 2: Broadcast question
  await wait(500);
  logToConsole(`Broadcasting: "${questionText}"`, 'accent');

  // Show typing indicators for all agents simultaneously
  selectedAgents.forEach(a => showTypingIndicator(a.id));

  // STEP 3: Fetch answers from API
  let answers;
  try {
    logToConsole('Summoning agents...', 'muted');
    const res = await fetch('/api/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: questionText,
        selectedAgentIds: selectedApiIds
      })
    });

    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json();
    answers = data.answers; // [{ agentId, name, emoji, color, answer }]
  } catch (e) {
    selectedAgents.forEach(a => hideTypingIndicator(a.id));
    logToConsole(`Failed to reach answer API: ${e.message}`, 'red');
    isBattleRunning = false;
    startBattleBtn.classList.remove('hidden');
    startBattleBtn.disabled = false;
    return;
  }

  // Display answers one by one
  selectedAgents.forEach(a => hideTypingIndicator(a.id));

  for (const ans of answers) {
    const fa = selectedAgents.find(a => a.apiId === ans.agentId);
    if (!fa) continue;
    appendDialogueBubble(fa.id, 'answer', ans.answer);
    logToConsole(`${ans.name} answered.`, 'success');
    await wait(400);
  }

  // STEP 4: Roast phase
  await wait(1200);
  logToConsole('Round 1 complete. Initiating cross-agent roast engine...', 'red');
  selectedAgents.forEach(a => showTypingIndicator(a.id));

  let roasts;
  try {
    const res = await fetch('/api/roast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: questionText,
        answers   // forward the full answers array the API returned
      })
    });

    if (!res.ok) throw new Error(`Roast API ${res.status}`);
    const data = await res.json();
    roasts = data.roasts; // [{ fromAgentId, fromName, toAgentId, toName, roast }]
  } catch (e) {
    logToConsole(`Roast API error: ${e.message}`, 'red');
  }

  selectedAgents.forEach(a => hideTypingIndicator(a.id));

  if (roasts?.length) {
    for (const roast of roasts) {
      const fa = selectedAgents.find(a => a.apiId === roast.fromAgentId);
      if (!fa) continue;
      appendDialogueBubble(fa.id, 'roast', roast.roast, roast.toName);
      logToConsole(`${roast.fromName} roasted ${roast.toName}! 🔥`, 'red');
      await wait(400);
    }
  }

  // STEP 5: Unlock voting
  await wait(800);
  logToConsole('Battle complete! Cast your vote.', 'accent');

  selectedAgents.forEach(agent => {
    const btn = document.getElementById(`vote-btn-${agent.id}`);
    if (btn) btn.classList.remove('hidden');
  });

  battleControls.classList.remove('hidden');
  isBattleRunning = false;
}

// ── Dialogue bubbles ─────────────────────────────────────────
function appendDialogueBubble(agentId, type, text, targetName = '') {
  const stream = document.getElementById(`bubble-stream-${agentId}`);
  if (!stream) return;

  const bubble = document.createElement('div');
  bubble.className = `dialogue-bubble ${type}`;

  if (type === 'answer') {
    bubble.innerHTML = `
      <div class="bubble-label ans-lbl">💡 ANSWER</div>
      <p>${text}</p>
    `;
  } else {
    bubble.innerHTML = `
      <div class="bubble-label rst-lbl">🔥 ROASTING @${targetName.toUpperCase()}</div>
      <p>${text}</p>
    `;
  }

  stream.appendChild(bubble);
  stream.scrollTop = stream.scrollHeight;
}

function showTypingIndicator(agentId) {
  const stream = document.getElementById(`bubble-stream-${agentId}`);
  if (!stream) return;
  const el = document.createElement('div');
  el.className = 'typing-indicator';
  el.id = `typing-indicator-${agentId}`;
  el.innerHTML = '<span></span><span></span><span></span>';
  stream.appendChild(el);
  stream.scrollTop = stream.scrollHeight;
}

function hideTypingIndicator(agentId) {
  const el = document.getElementById(`typing-indicator-${agentId}`);
  if (el) el.remove();
}

// ── Select winner + on-chain payout ─────────────────────────
async function selectWinner(agentId) {
  if (winnerId !== null) return; // prevent double-vote
  winnerId = agentId;

  const winningAgent = selectedAgents.find(a => a.id === agentId);
  logToConsole(`Voted for ${winningAgent.name}!`, 'success');

  // UI: mark winner panel
  const winningPanel = document.getElementById(`battle-panel-${agentId}`);
  if (winningPanel) {
    winningPanel.classList.add('winner');
    const crown = document.createElement('span');
    crown.className = 'winner-crown';
    crown.textContent = '👑';
    winningPanel.appendChild(crown);
  }

  // UI: update vote buttons
  selectedAgents.forEach(agent => {
    const btn = document.getElementById(`vote-btn-${agent.id}`);
    if (btn) {
      if (agent.id === agentId) btn.textContent = '👑 Match Winner!';
      else btn.classList.add('hidden');
    }
  });

  // On-chain payout
  if (walletConnected && currentBountyId !== null && winningAgent.address) {
    logToConsole('Processing on-chain payout...', 'muted');
    await awardBountyOnChain(currentBountyId, winningAgent.address);
  } else if (!walletConnected) {
    logToConsole(`Demo mode: ${winningAgent.name} wins! Connect wallet for real MON payout.`, 'accent');
  } else if (currentBountyId === null) {
    logToConsole(`${winningAgent.name} wins! (Bounty not posted — no on-chain payout.)`, 'accent');
  } else {
    logToConsole(`${winningAgent.name} wins! (Agent address unknown — no on-chain payout.)`, 'accent');
  }
}

// ── Reset game ───────────────────────────────────────────────
function resetGame() {
  questionInput.value = '';
  questionText        = '';
  selectedAgents      = [];
  winnerId            = null;
  currentBountyId     = null;

  renderSetupGrid();
  validateSetupForm();

  screenBattle.classList.remove('active');
  screenBattle.classList.add('locked');
  screenSetup.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'instant' });
}

// ── Utility ──────────────────────────────────────────────────
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
