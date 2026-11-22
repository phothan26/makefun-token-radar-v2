# makefun-token-radar-v2

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/phothan26/makefun-token-radar-v2/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/phothan26/makefun-token-radar-v2/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

TOKEN TIDE — The Momentum 758: a token-launch radar that ranks 758 pre-token protocols by TVL growth momentum, not by size. A small protocol doubling in a week can outrank a $2B giant standing still. The board holds 250 rows (the 40 watchlist protocols plus the 210 highest-momentum pre-token protocols), each with a momentum score built from six auditable factors — velocity, trend persistence, category momentum, a core cap, a weak scale gate, chain breadth, and a no-token bonus — and a time-boxed momentum farm plan generated from the protocol's own figures. The dashboard is a light paper research desk: a Top Movers strip, a sortable board, a detail view with the full factor breakdown, filters, and inline-SVG charts, plus a visible methodology section.

## Run it

```sh
node main.ts
```

Reads `/input/snapshot.json` and writes `/output/board.json`, `/output/dashboard/` (the page plus its generated data), `/output/screenshots/` (three views rendered from the real dashboard with a headless browser), and `/output/dossier.json`. Node 22, standard library only; no network, no clock, no randomness — the same snapshot always produces the same board byte for byte.

---

<sub>Entered on [make.fun](https://make.fun/?ref=t7e39kme&utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards</sub>
