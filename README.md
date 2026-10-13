# On-Chain Ballot — a simple voting dApp

A small voting app where each connected wallet can vote once for a candidate.
Votes are stored on the Ethereum Sepolia **testnet** (fake ETH, real blockchain
mechanics — no real money involved).

## How the pieces fit together

```
index.html + style.css   →  what the user sees (the ballot)
script.js                →  talks to MetaMask and to your deployed contract
MetaMask (browser ext.)  →  holds the user's wallet, approves transactions
VotingContract.sol       →  the actual voting logic, stored on the blockchain
```

When someone clicks a candidate, `script.js` asks MetaMask to send a
transaction that calls `vote()` on your contract. MetaMask pops up asking the
user to confirm. Once the network confirms the transaction, the vote count
stored *on the blockchain* updates, and the page re-reads it and shows the
new tally.

## Step 1 — Install MetaMask

Install the browser extension from **metamask.io**, create a wallet, and
save your seed phrase somewhere safe (for a testnet project the stakes are
low, but it's good practice).

In MetaMask, switch the network to **Sepolia** (top-left network dropdown →
"Show test networks" if it's hidden → select Sepolia).

## Step 2 — Get free test ETH

You need a small amount of fake ETH to pay gas fees on the testnet:

1. Copy your wallet address from MetaMask.
2. Go to a Sepolia faucet, e.g. `sepoliafaucet.com` or `www.alchemy.com/faucets/ethereum-sepolia`.
3. Paste your address and request test ETH. It usually arrives in under a minute.

## Step 3 — Deploy the smart contract with Remix

Remix is a browser-based Solidity IDE — no installation needed.

1. Go to **remix.ethereum.org**.
2. In the file explorer, create a new file called `VotingContract.sol` and
   paste in the contents of `VotingContract.sol` from this project.
3. Open the **Solidity Compiler** tab (left sidebar) and click **Compile
   VotingContract.sol**.
4. Open the **Deploy & Run Transactions** tab.
   - Set **Environment** to `Injected Provider - MetaMask`. MetaMask will
     pop up asking you to connect — approve it, and confirm you're on
     Sepolia.
   - In the constructor field next to the **Deploy** button, enter your
     candidate names as a JSON array, e.g.:
     `["Alice", "Bob", "Charlie"]`
   - Click **Deploy** and confirm the transaction in MetaMask.
5. Once deployed, find your contract under "Deployed Contracts" and copy its
   address (click the copy icon next to the contract name).

## Step 4 — Wire the frontend to your contract

Open `script.js` and paste your address in:

```js
const CONTRACT_ADDRESS = "0xYourDeployedAddressHere";
```

That's the only change needed — the ABI already matches the contract.

## Step 5 — Run it locally

You can't just double-click `index.html` (MetaMask's injected provider needs
a real server origin). Easiest options:

- **VS Code**: install the "Live Server" extension, right-click
  `index.html` → "Open with Live Server".
- **Python** (if installed): run `python -m http.server` in the project
  folder, then visit `http://localhost:8000`.

## Step 6 — Try it

1. Open the page, click **Connect MetaMask**, approve the connection.
2. Click a candidate's box. MetaMask will pop up asking you to confirm the
   transaction (it'll cost a tiny bit of your test ETH).
3. Wait a few seconds for it to be mined — the tally updates automatically.
4. Try voting again: the contract will reject it, since each wallet can only
   vote once.

## Where to go from here

- Add a countdown/deadline so voting closes after a set time.
- Let anyone add new candidates before voting opens.
- Show a live list of "who voted" using the `Voted` event.
- Swap the hardcoded candidates for an admin-only `addCandidate()` function.
