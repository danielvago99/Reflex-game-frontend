# Audit frontendu, backendu a smart kontraktu (matchmaking → settle)

Dátum: 2026-02-13  
Scope: `src/*`, `server/src/*`, `solana/programs/reflex_pvp_escrow/src/lib.rs`

## Executive summary

Projekt má **2 paralelné matchmaking/settlement flowy**, ktoré si navzájom nepasujú (REST vs WebSocket). Výsledok je, že časť frontendu volá API, ktoré backend vracia v inom tvare alebo vôbec neobsluhuje tak, ako frontend čaká. V kritickom flowe ranked match → stake confirm → settle sú viaceré body, kde sa zápas ruší alebo sa on-chain settle preskočí.

Najkritickejšie problémy:
1. **Rozbitý FE/BE kontrakt odpovedí a endpointov** (`/matchmaking/*` vs `/match/*`, `success/data` wrapper vs raw JSON).
2. **`matchRecords` používa fake `onChainMatch` (nie je Solana public key)**, takže REST settle flow je nefunkčný.
3. **WS flow sám loguje, že settle vie byť preskočený** pri chýbajúcom `gameMatch` alebo adresách.
4. **Konfiguračný drift** (`frontend` default na port 3000, backend default na 4000; env kľúče v dokumentácii vs v kóde).
5. V repozitári sú **artefakty buildov (`solana/target`, `server/dist`)** a viacero nepoužívaných/legacy častí.

---

## 1) Frontend audit (hlavne matchmaking až settle)

## 1.1 Kritické FE/BE kontraktové nezhody

- `ApiClient` očakáva odpoveď v tvare `ApiResponse<T>` (`{ success, data, error }`), no backend route-y typicky vracajú raw JSON bez `success` flagu.
- `useSolana.createRankedMatch()` kontroluje `response.success` a `response.data`, ale backend `/api/matchmaking/create` vracia `{ match }`, nie serializovanú transakciu.
- Reálne serializované TX payloady sú na `/api/match/create` a `/api/match/join`, ale frontend arena flow ich nepoužíva konzistentne.

Dôsledok: frontend často vyhodnotí validnú odpoveď backendu ako chybu alebo dostane iný payload, než očakáva.

## 1.2 Matchmaking architektúra je rozdelená na 2 nekompatibilné svety

- **WS flow:** `match:find` → queue v Redis → `match_found` → `match:stake_confirmed` → `game:enter_arena`.
- **REST flow:** `/matchmaking/create|join|finish` + `matchRecordStore` (in-memory).
- Frontend lobby používa WS eventy (`match:find`, `match_found`, `match:stake_confirmed`) a REST matchmaking client je prakticky „side-path“.

Dôsledok: duplicita business logiky a drift stavu medzi WS session a REST match records.

## 1.3 Env/config drift

- Frontend v komentári uvádza `VITE_API_BASE_URL`, ale runtime používa `VITE_BACKEND_URL`.
- Frontend default API/WS smeruje na `localhost:3000`, backend default beží na porte `4000`.

Dôsledok: lokálne deploymenty „out-of-the-box“ často nefungujú bez ručného dolaďovania env.

## 1.4 Nepoužívané/legacy FE časti

- `src/features/arena/services/matchmakingClient.ts` je definovaný, ale prakticky sa nepoužíva v hlavnom lobby WS flow.
- `src/utils/api.ts` obsahuje mock vetvu + TODO poznámky, čo naznačuje nedokončený prechod na jednotný backend kontrakt.
- `src/examples/*` vyzerá ako demo kód mimo runtime flow.

---

## 2) Backend audit (matchmaking → settle)

## 2.1 Kritický bug: REST match record generuje fake on-chain identifikátor

`matchRecordStore.create()` pre `onChainMatch` fallback generuje UUID-like string skrátený na 32 znakov, čo **nie je Solana public key**. Následne `/matchmaking/:id/finish` volá settle s týmto `onChainMatch` a settlement padá pri parsovaní `PublicKey`.

Dôsledok: REST settle flow je funkčne rozbitý, ak sa `onChainMatch` nenastaví reálnou on-chain hodnotou.

## 2.2 WS settle má explicitné skip vetvy

Pri finalize ranked zápasu backend loguje:
- `On-chain settle skipped: missing gameMatch public key`
- `On-chain settle skipped: missing one or more wallet addresses`

To znamená, že aj pri dokončení hry môže skončiť iba DB zápis bez on-chain settlementu.

## 2.3 In-memory stav a riziko po reštarte

- `matchRecordStore` je `Map` v RAM.
- Pri reštarte procesu sa strácajú match records, idempotency index a audit logy týchto matchov.

Dôsledok: slabá obnoviteľnosť a problematická incident forenzika.

## 2.4 Endpointy sú redundantné a nejednotné

- `/api/match/*` rieši Solana TX create/join.
- `/api/matchmaking/*` rieši iný lifecycle nad in-memory store.
- `/ws` zároveň riadi hlavný gameplay lifecycle.

Dôsledok: vysoké riziko regressií a nesúladu medzi source-of-truth.

---

## 3) Smart kontrakt audit (`reflex_pvp_escrow`)

## 3.1 Pozitíva

- `settle` striktne vyžaduje `server_authority == config.server_authority`.
- `winner_pubkey` je validovaný na `{player_a, player_b}`.
- PDA vault derivácia je konzistentná (`["vault", game_match]`).

## 3.2 Riziká / otvorené body

- `join_match` môže zavolať ktokoľvek ako `player_b` signer (to môže byť zámer), no bez extra aplikačných guardov to otvára griefing scenáre.
- `timeout_refund` je public (bez role guardu), čo je často OK, ale treba to explicitne pokryť v threat modeli.
- `settle` nekontroluje `settle_deadline_ts`; po deadlinu stále vie settle prejsť (ak backend neaplikuje policy mimo chain).

---

## 4) Konkrétne nepotrebné / problematické artefakty v repozitári

- Commitnuté build artefakty:
  - `solana/target/**`
  - `server/dist/**`
- Viacero interných markdown auditov a guide dokumentov v `src/` zvyšuje šum pre maintenance (nie runtime bug, ale zhoršuje orientáciu).

---

## 5) Odporúčaný plán nápravy (prioritizovaný)

### P0 (hneď)
1. Zjednotiť gameplay backend na **jeden flow**:
   - buď WS-first + `/api/match/*` pre tx payloady,
   - alebo REST-first; ale nie oboje paralelne.
2. Opraviť FE/BE response kontrakt:
   - buď backend vracia jednotne `{ success, data, error }`,
   - alebo frontend prestane tento wrapper vyžadovať.
3. Zakázať fallback fake `onChainMatch` a vynútiť validný base58 public key.
4. Opraviť env defaults (frontend port/API base) aby sedeli s backendom.

### P1 (krátkodobo)
1. Odstrániť dead code cesty (`matchmakingClient` ak sa nepoužíva, mock vetvy, nepotrebné API metódy).
2. Presunúť match lifecycle store z RAM do DB/Redis.
3. Zaviesť integračné testy pre flow:
   - `match:find` → `match_found` → `match:stake_confirmed` → `game:enter_arena` → `game:end` → on-chain `settle`.

### P2 (strednodobo)
1. Dopísať explicitné policy okolo `settle_deadline` (on-chain vs off-chain enforcement).
2. Vyčistiť repo od build artefaktov (`target`, `dist`) + nastaviť `.gitignore`/CI kontrolu.
3. Zjednotiť dokumentáciu env premenných a endpointov.

---

## 6) Rýchly verdict na tvoju poznámku „api a aj tak to nefunguje správne"

Máš pravdu. Aktuálne to nefunguje spoľahlivo hlavne preto, že:
- frontend a backend sa nezhodnú na API kontrakte,
- v kode sú 2 čiastočne prekryté gameplay/settlement systémy,
- a v jednej vetve sa používa nevalidný `onChainMatch` identifikátor.

Kým sa tieto tri body nezjednotia, bude flow od matchmakingu po settle nestabilný aj po menších fixoch.
