# Tandem — family savings prototype

Tandem is a guided household-savings demo built on the supplied React/Vite frontend, Express AI backend, and deployed Celo Sepolia savings contract.

## Updated user journey

1. **Connect a wallet.** The user signs in by connecting MetaMask or WalletConnect. The wallet must be on Celo Sepolia before a goal can be created.
2. **Name the family space.** The user gives their shared savings workspace a name.
3. **Choose a savings goal.** The user selects a goal category, edits the target amount, and chooses a time horizon.
4. **Create the goal on-chain.** The final action calls the existing `createGoal(uint256 targetAmount, uint256 targetDate)` contract function. Onboarding completes only after the transaction confirms.
5. **Use the dashboard.** The workspace is split into Overview, Family activity, AI insights, and Blockchain record pages.
6. **Record named contributions.** A family member's name, demo amount, date, and optional note are stored in the browser ledger. The updated balance, progress, monthly history and AI payload update from that entry.
7. **Compare member contributions.** The member leaderboard groups entries by contributor name, ranks members by their total, calculates each person’s percentage of the family contribution total, and lets the family export the breakdown as CSV. A compact top-three leaderboard also appears on the Overview page.
8. **Generate AI insights.** The AI insights page calls `POST /ai/analyse-savings` on the supplied Express backend. If the backend is unavailable, a clearly labelled local rules-based fallback is shown.

## Important demo boundaries

- Wallet connection and the `createGoal`, `getGoal`, and `recordContribution` contract calls use Celo Sepolia.
- The contract stores numerical goal and contribution records only. It does not custody, transfer, or verify money.
- Named contribution entries and the dashboard balance are demo-only browser state, persisted in `localStorage`. They are not a bank deposit or a real token transfer.
- The name of the contributor is kept in the family activity ledger. The supplied contract ABI has no contributor-name field, so names are not stored on-chain.
- The new family flow does not invent household income or expense data. The backend accepts zero/unknown monthly income and tells the AI analysis that spending cannot be assessed without that information.
- The default backend `AI_MODE=mock` returns the supplied deterministic fallback analysis. Set `AI_MODE=live` and configure Mistral credentials to use live model analysis.

## Project structure

- `frontend/src/components/Onboarding.jsx` — three-step wallet, family, and goal signup; creates the goal on-chain before completing.
- `frontend/src/App.jsx` — app shell, navigation, family dashboard state, local persistence, and contribution updates.
- `frontend/src/components/ActivityPage.jsx` — named contribution ledger, per-member contribution leaderboard, and sample transaction history.
- `frontend/src/components/MemberLeaderboard.jsx` — reusable family leaderboard with ranked members, contribution totals, percentage bars, and CSV export.
- `frontend/src/lib/memberLeaderboard.js` — case-insensitive aggregation and per-member percentage calculations used by the leaderboard.
- `frontend/src/components/ContributionModal.jsx` — named demo contribution form.
- `frontend/src/components/AIPanel.jsx` — dedicated AI insights page and endpoint trigger.
- `frontend/src/components/OnchainPanel.jsx` — wallet-linked contract read/create/record interactions.
- `frontend/src/components/OffchainPanels.jsx` — retained goal progress and savings rhythm panels.
- `frontend/src/hooks/useWallet.js` — existing MetaMask/WalletConnect provider and Celo Sepolia switching.
- `frontend/src/lib/savingsContract.js` — existing smart-contract adapter.
- `frontend/src/lib/ai.js` — backend payload, AI endpoint call, and local fallback.
- `frontend/src/styles.css` — responsive onboarding, navigation, page layouts, panels and mobile navigation.
- `backend/` — supplied Express endpoint and AI/fallback services, with validation adjusted for a new family that has not provided monthly income.

## Requirements

- Node.js 20 or newer recommended
- npm
- MetaMask or WalletConnect for wallet and Celo Sepolia contract actions
- Testnet CELO in the connected wallet for contract gas

## Run locally

Open two terminals from the project root.

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`.

The backend listens on `http://localhost:4000`. Its `.env.example` uses `AI_MODE=mock`, so the endpoint works without a Mistral key.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`.

Open the Vite URL printed in the terminal, normally `http://localhost:5173`.

The frontend's `.env.example` points `VITE_AI_API_URL` to `http://localhost:4000`. It retains the Apidog data source settings for compatibility with the supplied template, but the new family workspace begins with an empty demo balance and no invented income/expense entries.

### Live Mistral analysis (optional)

In `backend/.env`, set:

```env
AI_MODE=live
MISTRAL_API_KEY=your_key
MISTRAL_MODEL=your_model
```

Restart the backend after changing environment variables.

## Celo Sepolia settings

The existing settings remain configurable through `frontend/.env`:

```env
VITE_CHAIN_ID=11142220
VITE_RPC_URL=https://forno.celo-sepolia.celo-testnet.org
VITE_EXPLORER_URL=https://celo-sepolia.blockscout.com
VITE_CONTRACT_ADDRESS=0xf3bF2289BB778bE70829DC4E7C630db4B348f5DE
```

WalletConnect additionally requires `VITE_WALLETCONNECT_PROJECT_ID`.

## Build

```bash
cd frontend
npm run build
```

For a local production preview:

```bash
npm run preview
```

Do not use real funds, private keys, seed phrases, or personal financial data in this prototype.
