# infra/

Things only the service operator (you) touches. Peers don't run any of this.

| Path       | Purpose                                                     |
| ---------- | ----------------------------------------------------------- |
| `plugin/`  | Figma plugin source. Published to Figma Community.          |
| `server/`  | Express + WebSocket bridge. Deployed to Railway.            |

## Plugin → Figma

Local dev: Figma → Plugins → Development → Import plugin from manifest → pick
`infra/plugin/manifest.json`.

Distribution: publish to Figma Community so peers install with one click and
never see the source.

## Server → Railway

Railway is configured to deploy this repo with root directory `infra/server`.
On push to `main`, Railway runs `npm install` then `npm start`.

Set in Railway → Variables:

- `API_KEY` — long random string. The agent's tool call must send it as
  `x-api-key`.

The plugin's `WS_URL` in `infra/plugin/ui.html` points at the public Railway
domain.
