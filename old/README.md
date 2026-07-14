# ROOM 7

An interactive, browser-based 3D installation prototype for an album release.

## Run locally

```sh
npm run dev
```

Open `http://localhost:4175`.

## Controls

- Click **enter quietly** to begin.
- Look with the mouse; move with `W`, `A`, `S`, and `D`.
- When the central mark brightens, click or press `E` to interact.
- Press `Esc` for the small settings panel.

Visits and object changes persist in local storage. Use **forget this visit** in settings to reset the room.

The room is rendered with Three.js in `world.js`: it opens directly into the apartment, and the corridor is reached through its exit door. The room, furniture, perspective camera, interactions, courtyard, and depth testing are all real-time geometry.

## Visual / performance approach

This is an asset-first prototype, not a raw low-poly blockout. The live apartment uses the supplied Soviet residential FBX models for the sofa, table, CRT stand, cast-iron radiator, writing desk and chair, telephone, radio, wall shelving, dresser, cup, kettle, carpet, plants, chandelier and domestic traces. The CRT is a separate authored glTF mesh whose signal lives on the imported curved screen surface. Outside the window is the supplied **Fix Price winter-quarter FBX**: actual low-poly streets, snow, blocks and facades, placed beyond a third-floor window and allowed to fall away into scene fog. It is not an exterior photo or a flat window backdrop.

- Device pixel ratio is capped at `1.25`.
- One 1024px soft shadow map and a low-resolution bloom pass create the soft analog image without a large lighting stack.
- If a device sustains slow frames, rendering falls back once to `1x` pixel density instead of stuttering.
- The residential prop atlas is resized to 2K diffuse/normal plus 1K roughness/metalness maps; it remains shared across all room props.
- The quarter is a compact low-poly scene pack rather than a streamed city. Its single authored FBX and shared maps provide street depth while the room keeps its modest draw budget.

The generated period texture maps live in `assets/textures/generated/` so an art pass can replace them without changing any scene code.

The audio is intentionally generative placeholder audio: replace the `Sound.fragment()` calls in `world.js` with licensed album excerpts when they are ready.
