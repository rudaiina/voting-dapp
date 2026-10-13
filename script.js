/* ------------------------------------------------------------------
   1. CONFIG — fill these in after you deploy the contract (see README)
   ------------------------------------------------------------------ */

// Paste the address Remix gives you after deployment, e.g. "0xAbC123..."
const CONTRACT_ADDRESS = "0xea3Aa48e13706dEDBe595EcbF4cd47cf74F82C9B";

// This is the contract's "ABI" — a JSON description of its functions,
// so ethers.js knows how to call them. This matches VotingContract.sol
// exactly; you don't need to change it unless you change the contract.
const CONTRACT_ABI = [
  "function vote(uint256 candidateIndex) external",
  "function getCandidates() external view returns (string[] memory names, uint256[] memory voteCounts)",
  "function candidateCount() external view returns (uint256)",
  "function hasVoted(address) external view returns (bool)",
  "event Voted(uint256 indexed candidateIndex, address indexed voter)"
];

/* ------------------------------------------------------------------
   2. STATE
   ------------------------------------------------------------------ */

let provider;      // reads blockchain data
let signer;        // represents the connected wallet, can send transactions
let contract;      // our deployed contract, wired up with the ABI above
let userAddress = null;
let userHasVoted = false;

/* ------------------------------------------------------------------
   3. DOM REFERENCES
   ------------------------------------------------------------------ */

const connectBtn = document.getElementById("connectBtn");
const statusDot = document.getElementById("statusDot");
const voterStatusText = document.getElementById("voterStatusText");
const candidateList = document.getElementById("candidateList");
const footerMessage = document.getElementById("footerMessage");
const contractAddressDisplay = document.getElementById("contractAddressDisplay");
const toast = document.getElementById("toast");

contractAddressDisplay.textContent =
  CONTRACT_ADDRESS.startsWith("PASTE") ? "not deployed yet" : CONTRACT_ADDRESS;

/* ------------------------------------------------------------------
   4. TOAST HELPER — small popup for status/errors
   ------------------------------------------------------------------ */

let toastTimer;
function showToast(message, isError = false) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.toggle("error", isError);
  toast.classList.add("show");
  toastTimer = setTimeout(() => toast.classList.remove("show"), 4000);
}

/* ------------------------------------------------------------------
   5. CONNECT WALLET
   ------------------------------------------------------------------ */

async function connectWallet() {
  if (typeof window.ethereum === "undefined") {
    showToast("MetaMask isn't installed. Install it from metamask.io first.", true);
    return;
  }

  try {
    connectBtn.disabled = true;
    connectBtn.textContent = "Connecting…";

    // Ask MetaMask to show the "connect" popup and return the approved account.
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    userAddress = accounts[0];

    // ethers.js wraps MetaMask's provider so we can read chain data...
    provider = new ethers.BrowserProvider(window.ethereum);
    // ...and get a "signer", which can approve/send transactions on the user's behalf.
    signer = await provider.getSigner();

    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    updateVoterStatus();
    await loadCandidates();

    // If the user switches accounts in MetaMask, refresh everything.
    window.ethereum.on("accountsChanged", () => window.location.reload());

    connectBtn.textContent = "Wallet Connected";
  } catch (err) {
    console.error(err);
    showToast(err?.info?.error?.message || err.message || "Could not connect wallet.", true);
    connectBtn.disabled = false;
    connectBtn.textContent = "Connect MetaMask";
  }
}

function updateVoterStatus() {
  const short = `${userAddress.slice(0, 6)}…${userAddress.slice(-4)}`;
  voterStatusText.textContent = `Connected as ${short}`;
  statusDot.classList.add("connected");
  footerMessage.textContent = "Tap a candidate's box to cast your vote. You can only vote once.";
}

/* ------------------------------------------------------------------
   6. LOAD CANDIDATES FROM THE CONTRACT
   ------------------------------------------------------------------ */

async function loadCandidates() {
  try {
    const [names, voteCounts] = await contract.getCandidates();
    userHasVoted = await contract.hasVoted(userAddress);

    renderCandidates(names, voteCounts);

    if (userHasVoted) {
      statusDot.classList.add("voted");
      footerMessage.textContent = "You've already cast your vote on this ballot. Thanks for voting!";
    }
  } catch (err) {
    console.error(err);
    showToast("Couldn't load candidates. Check the contract address in script.js.", true);
  }
}

function renderCandidates(names, voteCounts) {
  const totalVotes = voteCounts.reduce((sum, v) => sum + Number(v), 0) || 1;

  candidateList.innerHTML = "";

  names.forEach((name, index) => {
    const count = Number(voteCounts[index]);
    const percent = Math.round((count / totalVotes) * 100);

    const row = document.createElement("button");
    row.className = "candidate-row";
    row.disabled = userHasVoted;
    if (userHasVoted && index === lastVotedIndex()) {
      row.classList.add("voted-for");
    }

    row.innerHTML = `
      <span class="ballot-box"></span>
      <span class="candidate-name">${escapeHtml(name)}</span>
      <span class="vote-tally">
        <span class="tally-bar-track"><span class="tally-bar-fill" style="width:${percent}%"></span></span>
        ${count}
      </span>
    `;

    row.addEventListener("click", () => castVote(index, row));
    candidateList.appendChild(row);
  });
}

// Tracks which candidate the connected wallet voted for, purely for the UI checkmark.
let votedIndex = null;
function lastVotedIndex() {
  return votedIndex;
}

/* ------------------------------------------------------------------
   7. CAST A VOTE
   ------------------------------------------------------------------ */

async function castVote(candidateIndex, rowEl) {
  if (userHasVoted) return;

  try {
    rowEl.style.opacity = "0.6";
    showToast("Confirm the transaction in MetaMask…");

    // This opens MetaMask asking the user to approve sending this transaction.
    const tx = await contract.vote(candidateIndex);

    showToast("Transaction sent — waiting for it to be mined…");

    // Wait for the transaction to actually be included in a block.
    await tx.wait();

    votedIndex = candidateIndex;
    userHasVoted = true;
    showToast("Your vote was recorded on-chain!");

    await loadCandidates();
  } catch (err) {
    console.error(err);
    rowEl.style.opacity = "1";
    const message = err?.reason || err?.info?.error?.message || err.message || "Vote failed.";
    showToast(message, true);
  }
}

/* ------------------------------------------------------------------
   8. HELPERS
   ------------------------------------------------------------------ */

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* ------------------------------------------------------------------
   9. INIT
   ------------------------------------------------------------------ */

connectBtn.addEventListener("click", connectWallet);
