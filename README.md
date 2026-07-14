# pgnn — six

![Шесть](./public/assets/pgnn-six/six-wordmark.png)

> An apartment that remembers more than its visitor.

`pgnn — six` is a browser-native audiovisual installation built around six compositions and one endlessly returning winter world. It is not a game, an interactive album, or a collection of puzzles. The visitor wakes inside a recently interrupted apartment, follows unmarked details through twelve connected 360° spaces, and gradually discovers that the building remembers their attention.

The complete album runs invisibly through the installation. There is no player, track list, progress bar, inventory, map, or ending screen.

**[Enter the installation](https://rapcorestar.github.io/pgnn6/)** · **[Listen to the album](https://band.link/pgnn6)**

## Об альбоме

“Шесть” — концептуальный русскоязычный альбом на стыке alternative rap, spoken word, dark hip-hop и постпанковой поэзии. Альбом построен как анти-библейская история человека после шестого дня творения: от пролога “Свет” до финального “Слова”, где язык окончательно теряет способность спасать.

> Шесть дней, чтобы создать человека. Шесть треков, чтобы его разобрать.

**Подходит для плейлистов:** alternative rap, Russian rap, sad rap, spoken word, poetic rap, dark hip-hop, indie/urban.

## Experience

- Twelve connected panoramic locations: apartment, kitchen, bathroom, stairwell, courtyard, lobby, basement, corridor, elevator, attic, roof, and tram stop.
- More than eighty unmarked object and passage zones plus detailed close-up interactions.
- Rabbit-hole routes that fold one location into another instead of returning a fixed result.
- Browser persistence for visits, location returns, object touches, album position, environmental decay, and spatial mutations.
- Live music analysis driving practical light, CRT glow, exposure, dust, snow, weather, and song-specific grading.
- A continuous 21:44 album cycle that advances the apartment into another “day” instead of stopping.
- Russian interface whispers and lyrics, using the single navigation colour `#F7BB00`.
- Cinematic camera travel, restrained motion blur, chromatic aberration, handheld drift, natural blinking, film grain, and asynchronous building events.

Read [the creative manifesto](./MANIFESTO.md) before changing the experience. The relationship between the six compositions and the world is documented in [the album-space map](./ALBUM_ARCHITECTURE.md).

## Run locally

Requirements: Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Open [http://localhost:4175](http://localhost:4175).

The installation begins with sound disabled by browser policy. Click the title screen to wake the observer and start the audio system.

## Production build

```bash
npm run build
npm run preview
```

The deployable static build is written to `dist/`. Vite uses relative asset paths, so the build can be hosted at a domain root or inside a subdirectory such as GitHub Pages.

## Interaction

- Drag to look around the full 360° environment.
- Scroll to adjust the field of view.
- Passages reveal a small Russian destination whisper only when noticed.
- Objects never announce themselves. Touching one may open a matched close-up, alter the sound mix, change the current room, or create a consequence visible on a later visit.
- Close-up objects can be touched directly; selected thresholds lead deeper into the building.
- `Escape` leaves a close-up or returns toward the apartment.

## Architecture

| Path | Purpose |
| --- | --- |
| `index.html` | Minimal installation shell, title screen, overlays, and accessibility regions. |
| `room.js` | State, audio, persistence, interactions, lyrics, routes, particles, and world events. |
| `panorama.js` | Three.js panorama renderer, camera movement, hotspots, shaders, music response, and memory response. |
| `styles.css` | Cinematic presentation, close-up reactions, transitions, typography, cursor system, and film treatment. |
| `public/assets/pgnn-six/` | Current panoramic plates, matched details, wordmark, favicon, and six mastered tracks. |
| `old/` | Preserved pre-rebuild prototype and its source assets. |

The active installation deliberately uses one lightweight WebGL sphere and two canvas atmosphere layers rather than a large real-time 3D scene. Frame rate and responsiveness take priority over geometric realism.

## Persistent world

State is stored locally in the browser; there are no visitor accounts. Returning visitors retain their album position and leave accumulating physical pressure on the world:

- furniture and evidence shift;
- frost, snow, dust, patina, and colour grading evolve;
- revisited locations generate new scars and environmental arrangements;
- deeper routes select different destinations;
- completing the album advances the world and begins another cycle.

The current save key preserves migration from the earlier `ROOM_7` builds, so existing local memories are not discarded by the project rename.

## Analytics

The public installation uses Umami Cloud's cookie-free tracker, respects the browser's Do Not Track setting, and collects Core Web Vitals. Measurement is intentionally limited to pageviews and meaningful experience milestones: waking the observer, active-time thresholds, first location discoveries, meaningful object interactions, rabbit-hole entries, return visits, completed album cycles, and the outbound album link.

Camera movement, pointer position, lyrics, audio samples, personal identifiers, session replays, and heatmaps are not collected.

## Creative constraints

- No game mechanics, menus, scores, achievements, collectibles, or explanation screens.
- Attention is the primary interaction.
- Every object must have an emotional reason to exist.
- Movement should feel incidental rather than performed.
- Music is discovered as atmosphere and never exposed as interface.
- The room offers evidence, not a solved narrative.

## Archive

The previous prototype is intentionally preserved under [`old/`](./old/). Its historical `ROOM 7` naming remains unchanged so the archive accurately represents that version. Generated dependencies inside `old/node_modules/` are ignored; run `npm install` inside `old/` if the archived prototype needs to be restored locally.

## Repository note

This repository contains large original audiovisual assets. Keep generated builds and dependency folders out of Git; replace masters intentionally and verify file sizes before publishing revisions.
