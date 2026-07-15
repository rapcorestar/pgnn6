import * as THREE from 'three';

// These are places, not slides. Each plate is a full equirectangular room or exterior
// that can be looked around in; only doors and a few objects respond.
const PANORAMAS = {
  foyer: {
    src: [
      './assets/pgnn-six/panorama-apartment-shoes-desk.png',
      './assets/pgnn-six/panorama-apartment-return-1-shoes.png',
      './assets/pgnn-six/panorama-apartment-return-2-shoes.png',
    ],
    hotspots: [
      { u: .07, v: .54, action: 'window', radiusU: .075, radiusV: .16 },
      { u: .16, v: .43, action: 'plant', radiusU: .055, radiusV: .1 },
      // The whole CRT body should read as a threshold, not only a tiny patch of glass.
      // Keep it before the notebook so their close hit areas resolve toward the screen.
      { u: .31, v: .44, action: 'crt', radiusU: .052, radiusV: .105 },
      { u: .27, v: .38, action: 'notebook', radiusU: .04, radiusV: .065 },
      { u: .25, v: .48, action: 'lamp', radiusU: .035, radiusV: .09 },
      { u: .35, v: .39, action: 'cup', radiusU: .032, radiusV: .07 },
      { u: .49, v: .34, action: 'chair', radiusU: .055, radiusV: .11 },
      { u: .63, v: .48, to: 'kitchen', radiusU: .055, radiusV: .15 },
      { u: .76, v: .48, to: 'bathroom', radiusU: .052, radiusV: .15 },
      { u: .35, v: .21, action: 'shoes', radiusU: .045, radiusV: .065 },
      { u: .96, v: .25, action: 'record-player', radiusU: .038, radiusV: .08 },
      { u: .43, v: .42, action: 'phone', radiusU: .032, radiusV: .06 },
      { u: .54, v: .42, action: 'bed', radiusU: .05, radiusV: .085 },
      { u: .11, v: .33, action: 'radiator', radiusU: .05, radiusV: .09 },
      { u: .39, v: .70, action: 'shelf', radiusU: .055, radiusV: .08 },
      { u: .87, v: .48, to: 'stairwell', radiusU: .052, radiusV: .16 },
    ],
  },
  kitchen: {
    src: './assets/pgnn-six/panorama-kitchen.png',
    hotspots: [
      { u: .50, v: .48, to: 'foyer', radiusU: .055, radiusV: .15 },
      { u: .84, v: .40, action: 'cassette', radiusU: .06, radiusV: .08 },
      { u: .36, v: .43, action: 'sink', radiusU: .055, radiusV: .1 },
      { u: .25, v: .47, action: 'fridge', radiusU: .06, radiusV: .14 },
      { u: .59, v: .40, action: 'kettle', radiusU: .045, radiusV: .075 },
      { u: .82, v: .34, action: 'kitchen-table', radiusU: .09, radiusV: .11 },
      { u: .04, v: .50, action: 'kitchen-window', radiusU: .055, radiusV: .14 },
      { u: .66, v: .31, action: 'stove', radiusU: .05, radiusV: .07 },
      { u: .45, v: .58, action: 'jars', radiusU: .065, radiusV: .08 },
      { u: .78, v: .56, action: 'boombox', radiusU: .06, radiusV: .08 },
      { u: .70, v: .28, action: 'kitchen-cup', radiusU: .04, radiusV: .06 },
    ],
  },
  bathroom: {
    src: './assets/pgnn-six/panorama-bathroom.png',
    hotspots: [
      { u: .82, v: .48, to: 'foyer', radiusU: .06, radiusV: .17 },
      { u: .28, v: .55, action: 'cabinet', radiusU: .065, radiusV: .11 },
      { u: .61, v: .56, action: 'mirror', radiusU: .07, radiusV: .12 },
      { u: .60, v: .35, action: 'tap', radiusU: .045, radiusV: .075 },
      { u: .30, v: .31, action: 'washer', radiusU: .07, radiusV: .1 },
      { u: .18, v: .48, action: 'bathroom-pipe', radiusU: .055, radiusV: .12 },
      { u: .43, v: .58, action: 'towel', radiusU: .055, radiusV: .1 },
      { u: .57, v: .67, action: 'toothbrush', radiusU: .04, radiusV: .06 },
      { u: .10, v: .31, action: 'bath', radiusU: .075, radiusV: .1 },
    ],
  },
  stairwell: {
    src: './assets/pgnn-six/panorama-stairwell.png',
    hotspots: [
      { u: .86, v: .50, to: 'foyer', radiusU: .055, radiusV: .16 },
      { u: .34, v: .54, action: 'stair-window', radiusU: .07, radiusV: .14 },
      { u: .62, v: .40, action: 'rail', radiusU: .055, radiusV: .12 },
      { u: .82, v: .62, action: 'stair-lamp', radiusU: .045, radiusV: .08 },
      { u: .10, v: .42, to: 'courtyard', radiusU: .065, radiusV: .15 },
      { u: .62, v: .55, to: 'corridor', radiusU: .065, radiusV: .14 },
      { u: .96, v: .50, to: 'lobby', radiusU: .04, radiusV: .15 },
      { u: .53, v: .24, action: 'stair-step', radiusU: .07, radiusV: .1 },
      { u: .75, v: .48, to: 'attic', radiusU: .05, radiusV: .13 },
    ],
  },
  courtyard: {
    src: './assets/pgnn-six/panorama-courtyard.png',
    hotspots: [
      { u: .12, v: .52, to: 'lobby', radiusU: .065, radiusV: .16 },
      { u: .51, v: .50, action: 'tram', radiusU: .11, radiusV: .08 },
      { u: .67, v: .31, action: 'bench', radiusU: .085, radiusV: .1 },
      { u: .12, v: .47, action: 'courtyard-gate', radiusU: .035, radiusV: .07 },
      { u: .88, v: .50, to: 'stairwell', radiusU: .06, radiusV: .16 },
      { u: .84, v: .28, loop: true, radiusU: .07, radiusV: .1 },
      { u: .48, v: .35, action: 'tracks', radiusU: .08, radiusV: .07 },
      { u: .76, v: .24, action: 'snowbank', radiusU: .07, radiusV: .08 },
      { u: .27, v: .66, action: 'building-window', radiusU: .06, radiusV: .09 },
      { u: .74, v: .50, to: 'tramstop', radiusU: .055, radiusV: .14 },
      { u: .97, v: .49, to: 'supermarket-front', radiusU: .055, radiusV: .16 },
    ],
  },
  lobby: {
    src: './assets/pgnn-six/panorama-lobby.png',
    hotspots: [
      { u: .50, v: .49, to: 'courtyard', radiusU: .065, radiusV: .17 },
      { u: .08, v: .64, action: 'mailboxes', radiusU: .07, radiusV: .12 },
      { u: .33, v: .54, action: 'intercom', radiusU: .04, radiusV: .09 },
      { u: .34, v: .64, action: 'lobby-light', radiusU: .04, radiusV: .075 },
      { u: .75, v: .51, to: 'stairwell', radiusU: .07, radiusV: .18 },
      { u: .18, v: .48, to: 'basement', radiusU: .065, radiusV: .16 },
      { u: .95, v: .50, to: 'corridor', radiusU: .04, radiusV: .16 },
      { u: .55, v: .30, action: 'lobby-door', radiusU: .055, radiusV: .08 },
      { u: .66, v: .33, action: 'lobby-shadow', radiusU: .06, radiusV: .08 },
    ],
  },
  basement: {
    src: './assets/pgnn-six/panorama-basement.png',
    hotspots: [
      { u: .79, v: .50, to: 'lobby', radiusU: .065, radiusV: .16 },
      { u: .28, v: .58, action: 'pipes', radiusU: .09, radiusV: .13 },
      { u: .20, v: .49, action: 'valve', radiusU: .055, radiusV: .09 },
      { u: .70, v: .47, action: 'boiler', radiusU: .09, radiusV: .13 },
      { u: .49, v: .62, action: 'basement-window', radiusU: .06, radiusV: .09 },
      { u: .03, v: .49, action: 'basement-door', radiusU: .05, radiusV: .14 },
      { u: .96, v: .49, loop: true, radiusU: .045, radiusV: .15 },
      { u: .55, v: .48, action: 'steam', radiusU: .06, radiusV: .08 },
      { u: .87, v: .26, action: 'basement-stairs', radiusU: .065, radiusV: .1 },
    ],
  },
  corridor: {
    src: './assets/pgnn-six/panorama-corridor.png',
    hotspots: [
      { u: .62, v: .51, to: 'stairwell', radiusU: .06, radiusV: .16 },
      { u: .30, v: .56, action: 'corridor-window', radiusU: .055, radiusV: .12 },
      { u: .50, v: .51, to: 'elevator', radiusU: .055, radiusV: .16 },
      { u: .33, v: .68, action: 'corridor-lamp', radiusU: .04, radiusV: .07 },
      { u: .77, v: .50, action: 'corridor-door', radiusU: .05, radiusV: .13 },
      { u: .12, v: .50, to: 'lobby', radiusU: .055, radiusV: .14 },
      { u: .94, v: .50, loop: true, radiusU: .045, radiusV: .14 },
      { u: .40, v: .34, action: 'corridor-radiator', radiusU: .055, radiusV: .08 },
      { u: .55, v: .22, action: 'corridor-floor', radiusU: .07, radiusV: .07 },
    ],
  },
  elevator: {
    src: './assets/pgnn-six/panorama-elevator.png',
    hotspots: [
      { u: .48, v: .50, to: 'corridor', radiusU: .065, radiusV: .17 },
      { u: .68, v: .55, action: 'elevator-mirror', radiusU: .075, radiusV: .14 },
      { u: .60, v: .51, action: 'elevator-button', radiusU: .035, radiusV: .13 },
      { u: .51, v: .88, action: 'elevator-ceiling', radiusU: .07, radiusV: .075 },
      { u: .82, v: .50, to: 'basement', radiusU: .055, radiusV: .15 },
      { u: .92, v: .50, loop: true, radiusU: .045, radiusV: .14 },
      { u: .73, v: .34, action: 'elevator-rail', radiusU: .055, radiusV: .08 },
      { u: .50, v: .20, action: 'elevator-floor', radiusU: .07, radiusV: .07 },
    ],
  },
  attic: {
    src: './assets/pgnn-six/panorama-attic.png',
    hotspots: [
      { u: .16, v: .31, to: 'stairwell', radiusU: .07, radiusV: .12 },
      { u: .70, v: .49, to: 'roof', radiusU: .065, radiusV: .15 },
      { u: .47, v: .19, action: 'attic-suitcase', radiusU: .09, radiusV: .1 },
      { u: .28, v: .48, action: 'attic-cable', radiusU: .07, radiusV: .1 },
      { u: .30, v: .51, action: 'attic-shirt', radiusU: .055, radiusV: .1 },
      { u: .84, v: .29, action: 'attic-chair', radiusU: .055, radiusV: .1 },
      { u: .65, v: .58, action: 'attic-bulb', radiusU: .04, radiusV: .06 },
      { u: .50, v: .50, action: 'attic-window', radiusU: .07, radiusV: .1 },
      { u: .89, v: .34, action: 'attic-boxes', radiusU: .075, radiusV: .1 },
    ],
  },
  roof: {
    src: './assets/pgnn-six/panorama-roof.png',
    hotspots: [
      { u: .48, v: .30, to: 'attic', radiusU: .075, radiusV: .12 },
      { u: .43, v: .65, action: 'roof-antenna', radiusU: .075, radiusV: .12 },
      { u: .42, v: .44, action: 'roof-cable', radiusU: .08, radiusV: .08 },
      { u: .42, v: .22, action: 'roof-tracks', radiusU: .09, radiusV: .08 },
      { u: .70, v: .46, action: 'roof-vent', radiusU: .065, radiusV: .1 },
      { u: .48, v: .36, action: 'roof-hatch-light', radiusU: .055, radiusV: .07 },
      { u: .82, v: .53, action: 'roof-edge', radiusU: .09, radiusV: .12 },
    ],
  },
  tramstop: {
    src: './assets/pgnn-six/panorama-tramstop.png',
    hotspots: [
      { u: .12, v: .49, to: 'courtyard', radiusU: .065, radiusV: .14 },
      { u: .27, v: .53, to: 'basement', radiusU: .065, radiusV: .13 },
      { u: .48, v: .52, action: 'tramstop-glass', radiusU: .09, radiusV: .15 },
      { u: .51, v: .25, action: 'tramstop-bench', radiusU: .075, radiusV: .08 },
      { u: .72, v: .50, action: 'tramstop-tram', radiusU: .12, radiusV: .08 },
      { u: .80, v: .28, action: 'tramstop-rails', radiusU: .11, radiusV: .07 },
      { u: .91, v: .32, action: 'tramstop-snow', radiusU: .07, radiusV: .08 },
      { u: .35, v: .60, action: 'tramstop-light', radiusU: .05, radiusV: .08 },
    ],
  },
  'supermarket-front': {
    src: './assets/pgnn-six/panorama-supermarket-front.png',
    flipX: true,
    hotspots: [
      { u: .88, v: .50, to: 'courtyard', radiusU: .065, radiusV: .15 },
      { u: .50, v: .50, to: 'supermarket-inside', radiusU: .07, radiusV: .16 },
      { u: .50, v: .79, action: 'market-sign', radiusU: .12, radiusV: .07 },
      { u: .65, v: .36, action: 'market-trolley', radiusU: .075, radiusV: .1 },
      { u: .29, v: .34, action: 'market-cart', radiusU: .065, radiusV: .09 },
      { u: .70, v: .12, action: 'market-receipt', radiusU: .055, radiusV: .055 },
      { u: .30, v: .55, action: 'market-window', radiusU: .085, radiusV: .12 },
    ],
  },
  'supermarket-inside': {
    src: './assets/pgnn-six/panorama-supermarket-inside.png',
    flipX: true,
    hotspots: [
      { u: .38, v: .55, to: 'supermarket-front', radiusU: .07, radiusV: .16 },
      { u: .25, v: .38, action: 'market-water', radiusU: .045, radiusV: .08 },
      { u: .29, v: .40, action: 'market-checkout-receipt', radiusU: .055, radiusV: .06 },
      { u: .33, v: .47, action: 'market-scanner', radiusU: .045, radiusV: .075 },
      { u: .40, v: .22, action: 'market-basket', radiusU: .06, radiusV: .075 },
      { u: .98, v: .66, action: 'market-mirror', radiusU: .045, radiusV: .07 },
      { u: .64, v: .53, action: 'market-freezer', radiusU: .08, radiusV: .15 },
      { u: .20, v: .55, action: 'market-cigarettes', radiusU: .075, radiusV: .13 },
      { u: .09, v: .49, action: 'market-backroom', radiusU: .055, radiusV: .14 },
      { u: .50, v: .79, action: 'market-fluorescent', radiusU: .09, radiusV: .07 },
    ],
  },
};

export function createPanorama(root, onPortal, onGesture, onHover) {
  if (!root) return {
    setActive() {}, setView() {}, setAudio() {}, setMemory() {}, react() {}, resize() {}, hasView() { return false; },
  };

  const scene = new THREE.Scene();
  const MAX_FOV = 88;
  const camera = new THREE.PerspectiveCamera(MAX_FOV, 1, .1, 100);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  root.append(renderer.domElement);

  const placeCode = view => ({ foyer: 1, kitchen: 2, courtyard: 3, elevator: 4, basement: 5, bathroom: 6, corridor: 7, stairwell: 8, lobby: 9, attic: 10, roof: 11, tramstop: 12, 'supermarket-front': 13, 'supermarket-inside': 14 }[view] || 0);
  function panoramaMaterial(transparent = false) {
    return new THREE.ShaderMaterial({
      side: THREE.BackSide,
      transparent,
      depthTest: !transparent,
      depthWrite: !transparent,
      uniforms: {
        uMap: { value: null },
        uFlipX: { value: 0 },
        uTime: { value: 0 },
        uPlace: { value: 0 },
        uCycle: { value: 0 },
        uReturn: { value: 0 },
        uMotion: { value: 0 },
        uMotionVector: { value: new THREE.Vector2(0, 0) },
        uRadialMotion: { value: 0 },
        uAudio: { value: new THREE.Vector4(0, 0, 0, 0) },
        uChapter: { value: 0 },
        uMemory: { value: new THREE.Vector4(0, 0, 0, 0) },
        uReaction: { value: new THREE.Vector2(0, 0) },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uOpacity: { value: transparent ? 0 : 1 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform sampler2D uMap;
        uniform float uFlipX;
        uniform float uTime;
        uniform float uPlace;
        uniform float uCycle;
        uniform float uReturn;
        uniform float uMotion;
        uniform vec2 uMotionVector;
        uniform float uRadialMotion;
        uniform vec4 uAudio;
        uniform float uChapter;
        uniform vec4 uMemory;
        uniform vec2 uReaction;
        uniform vec2 uResolution;
        uniform float uOpacity;
        float softEllipse(vec2 uv, vec2 centre, vec2 radius) {
          float distanceFromCentre = length((uv - centre) / radius);
          return 1.0 - smoothstep(.54, 1.0, distanceFromCentre);
        }
        float hash21(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }
        float noise21(vec2 p) {
          vec2 cell = floor(p);
          vec2 local = fract(p);
          local = local * local * (3.0 - 2.0 * local);
          float a = hash21(cell);
          float b = hash21(cell + vec2(1.0, 0.0));
          float c = hash21(cell + vec2(0.0, 1.0));
          float d = hash21(cell + vec2(1.0, 1.0));
          return mix(mix(a, b, local.x), mix(c, d, local.x), local.y);
        }
        float snowDot(vec2 p, float threshold) {
          vec2 id = floor(p);
          vec2 cell = fract(p) - .5;
          vec2 offset = vec2(hash21(id + 7.13), hash21(id + 31.71)) - .5;
          float present = step(threshold, hash21(id + 19.4));
          return (1.0 - smoothstep(.025, .105, length(cell - offset * .72))) * present;
        }
        void main() {
          vec2 textureUv = vec2(mix(vUv.x, 1.0 - vUv.x, uFlipX), vUv.y);
          vec4 source = texture2D(uMap, textureUv);
          if (uMotion > .001) {
            vec2 screenUv = gl_FragCoord.xy / max(uResolution, vec2(1.0));
            vec2 radialVelocity = (screenUv - .5) * (.014 * uRadialMotion);
            vec2 walkingVelocity = vec2(.0018, -.00055) * uRadialMotion;
            vec2 lookVelocity = uMotionVector * (.0048 * uMotion);
            vec2 smear = radialVelocity + walkingVelocity + lookVelocity;
            vec2 textureSmear = vec2(mix(smear.x, -smear.x, uFlipX), smear.y);
            vec3 motionColour = source.rgb * .26;
            motionColour += texture2D(uMap, textureUv - textureSmear * 1.15).rgb * .18;
            motionColour += texture2D(uMap, textureUv - textureSmear * .56).rgb * .2;
            motionColour += texture2D(uMap, textureUv + textureSmear * .42).rgb * .2;
            motionColour += texture2D(uMap, textureUv + textureSmear * .9).rgb * .16;
            vec2 chroma = (screenUv - .5) * (.0055 * uRadialMotion)
              + vec2(.00115, -.0003) * uRadialMotion
              + uMotionVector * (.0014 * uMotion);
            vec2 textureChroma = vec2(mix(chroma.x, -chroma.x, uFlipX), chroma.y);
            float separatedRed = texture2D(uMap, textureUv + textureChroma - textureSmear * .34).r;
            float separatedBlue = texture2D(uMap, textureUv - textureChroma + textureSmear * .28).b;
            source.rgb = mix(motionColour, vec3(separatedRed, motionColour.g, separatedBlue), .74 * uMotion);
          }
          vec3 colour = source.rgb;
          colour = pow(max(colour * 1.12, vec3(0.0)), vec3(.97));
          float soundtrackBreath = uAudio.x * .052 + uAudio.y * .022;
          colour *= 1.0 + soundtrackBreath;
          colour = mix(colour, colour * vec3(1.025, 1.0, .975), uAudio.x * .12);
          float albumEnergy = clamp(uAudio.x * .48 + uAudio.y * .34 + uAudio.z * .18, 0.0, 1.0);
          if (uChapter < .5) {
            // НОРМАЛЬНО: domestic warmth and the cold intelligence of the CRT.
            colour = mix(colour, colour * vec3(1.022, 1.003, .978), albumEnergy * .2);
          } else if (uChapter < 1.5) {
            // ПРЫЖОК: a barely stable green-grey field, never quite landing.
            float jumpBreath = .5 + .5 * sin(uTime * .62 + uAudio.w * 12.566);
            colour = mix(colour, colour * vec3(.982, 1.018, .992) * (1.0 + jumpBreath * .018), albumEnergy * .3);
          } else if (uChapter < 2.5) {
            // КАСТИНГ: contrast behaves like an unreliable stage light.
            colour = mix(colour, (colour - .5) * (1.0 + albumEnergy * .075) + .5, albumEnergy * .62);
          } else if (uChapter < 3.5) {
            // СОСТОЯНИЕ ВОДЫ: blue hour slowly occupies the room.
            colour = mix(colour, colour * vec3(.965, 1.012, 1.055) + vec3(.004, .009, .014), albumEnergy * .34);
          } else if (uChapter < 4.5) {
            // НОКАУТ: low frequencies land as restrained exposure punches.
            colour *= 1.0 - uAudio.x * .038;
            colour = mix(colour, colour * vec3(1.028, .99, .975), albumEnergy * .22);
          } else {
            // СЛОВО: saturation and certainty erode together.
            float wordLuma = dot(colour, vec3(.299, .587, .114));
            colour = mix(colour, vec3(wordLuma) * vec3(1.025, .995, .965), albumEnergy * .18);
          }
          float livedInField = noise21(vUv * vec2(11.0, 6.0) + vec2(uPlace * 3.1, uMemory.w * 7.0));
          colour *= 1.0 - smoothstep(.72, .96, livedInField) * uMemory.w * .065;
          if (uReaction.y > .001) {
            if (uReaction.x < 1.5) {
              colour += vec3(.01, .025, .045) * uReaction.y;
            } else if (uReaction.x < 2.5) {
              colour = mix(colour, colour * vec3(.94, 1.015, 1.07), uReaction.y * .42);
            } else if (uReaction.x < 3.5) {
              float movementWave = .5 + .5 * sin(vUv.y * 31.0 + uTime * 11.0);
              colour *= 1.0 + movementWave * uReaction.y * .035;
            } else {
              float reactionLuma = dot(colour, vec3(.299, .587, .114));
              colour = mix(colour, vec3(reactionLuma) * vec3(1.025, .995, .965), uReaction.y * .2);
            }
          }
          if (uCycle > .5 && uCycle < 1.5) colour *= vec3(.96, 1.0, 1.055);
          if (uCycle > 1.5 && uCycle < 2.5) colour *= vec3(1.055, 1.01, .94);
          if (uCycle > 2.5) colour = mix(colour, vec3(dot(colour, vec3(.299,.587,.114))), .09) * vec3(.99, 1.015, 1.035);
          float returnStage = min(uReturn, 4.0);
          if (returnStage > .0) {
            colour *= vec3(1.0 - returnStage * .028, 1.0 - returnStage * .016, 1.0 + returnStage * .015);
            float luma = dot(colour, vec3(.299,.587,.114));
            colour = mix(colour, vec3(luma), returnStage * .052);
            float ageField = noise21(vUv * vec2(9.0, 5.0) + vec2(uPlace * 2.7, floor(uReturn) * 5.1));
            float agePatch = smoothstep(.67, .92, ageField) * returnStage * .042;
            colour *= 1.0 - agePatch;
            float settledDust = snowDot(
              vUv * vec2(170.0, 96.0) + vec2(floor(uReturn) * 7.7, floor(uReturn) * 13.1),
              .992 - returnStage * .0011
            ) * (.05 + returnStage * .026);
            colour += vec3(.12, .105, .082) * settledDust;
            vec2 scarCentre = vec2(
              .18 + .64 * hash21(vec2(uPlace * 7.13, floor(uReturn) * 3.71)),
              .28 + .42 * hash21(vec2(uPlace * 4.17, floor(uReturn) * 8.31))
            );
            float memoryScar = softEllipse(vUv, scarCentre, vec2(.15 + uPlace * .002, .21));
            colour *= 1.0 - memoryScar * min(.12, returnStage * .028);
          }
          if (uPlace == 1.0) {
            float glass = softEllipse(vUv, vec2(.075, .545), vec2(.082, .17));
            float nearFlake = snowDot(vec2(vUv.x * 92.0, vUv.y * 66.0 + uTime * 2.1), .87);
            float farFlake = snowDot(vec2(vUv.x * 178.0, vUv.y * 124.0 + uTime * 1.35), .94);
            colour += vec3(.21, .27, .31) * glass * (nearFlake * .5 + farFlake * .28) * (1.0 + uMemory.y * .72 + uAudio.z * .34);
            float rememberedCrt = softEllipse(vUv, vec2(.31, .44), vec2(.058, .088));
            float crtCurrent = .42 + uMemory.x * .7 + uAudio.y * .72 + uAudio.z * .22;
            colour += vec3(.018, .047, .072) * rememberedCrt * crtCurrent;
            float displacedObjects = max(
              softEllipse(vUv, vec2(.49, .34), vec2(.07, .12)),
              softEllipse(vUv, vec2(.35, .21), vec2(.06, .08))
            );
            vec3 shiftedObjects = texture2D(uMap, vUv + vec2(.0045 * uMemory.z, -.0015 * uMemory.z)).rgb;
            colour = mix(colour, shiftedObjects, displacedObjects * uMemory.z * .2);
          }
          if (uPlace == 2.0) {
            // The source already contains the ceiling lamp. Keep its response
            // close to the fixture instead of painting an amber cloud over the room.
            float kitchenCurrent = softEllipse(vUv, vec2(.68, .38), vec2(.046, .055));
            float kettleBreath = softEllipse(vUv, vec2(.59, .40), vec2(.055, .08));
            colour += vec3(.022, .009, .001) * kitchenCurrent * (.2 + uAudio.x * .46 + uMemory.x * .16);
            colour = mix(colour, colour * vec3(1.018, 1.007, .989), kettleBreath * (uMemory.y * .085 + uAudio.y * .03));
          }
          if (uPlace == 3.0) {
            float tram = softEllipse(vUv, vec2(.51, .50), vec2(.145, .05));
            vec2 movingUv = vec2(vUv.x + sin(uTime * .38) * .006, vUv.y);
            vec3 movingTram = texture2D(uMap, movingUv).rgb;
            colour = mix(colour, movingTram, tram * .34);
            float windows = softEllipse(vUv, vec2(.51 + sin(uTime * .38) * .006, .515), vec2(.12, .012));
            colour += vec3(.045, .02, .005) * windows * (.55 + .45 * sin(uTime * 3.0) + uAudio.x * .65);
            float lampA = softEllipse(vUv, vec2(.39, .61), vec2(.011, .018));
            float lampB = softEllipse(vUv, vec2(.57, .65), vec2(.011, .018));
            colour += vec3(.04, .015, .003) * (lampA + lampB) * (.55 + .45 * sin(uTime * 1.17) + uAudio.x * .5);
          }
          if (uPlace == 4.0) {
            float lamp = softEllipse(vUv, vec2(.51, .88), vec2(.07, .024));
            colour += vec3(.05, .018, .004) * lamp * (.55 + .45 * sin(uTime * 2.2) + uAudio.x * .66 + uMemory.x * .2);
          }
          if (uPlace == 5.0) {
            float boiler = softEllipse(vUv, vec2(.67, .54), vec2(.085, .07));
            colour += vec3(.026, .006, .001) * boiler * (.5 + .5 * sin(uTime * .7) + uAudio.x * .7 + uMemory.x * .34);
          }
          if (uPlace == 6.0) {
            float bathroomLamp = softEllipse(vUv, vec2(.51, .90), vec2(.045, .027));
            colour += vec3(.055, .025, .006) * bathroomLamp * (.72 + .28 * sin(uTime * 1.38) + uAudio.x * .55);
            float mirrorMemory = softEllipse(vUv, vec2(.61, .56), vec2(.075, .12));
            colour = mix(colour, colour * vec3(.94, .985, 1.04), mirrorMemory * (uMemory.w * .16 + uMemory.y * .08));
          }
          if (uPlace == 7.0) {
            float corridorLamp = softEllipse(vUv, vec2(.33, .69), vec2(.04, .025));
            colour += vec3(.06, .024, .004) * corridorLamp * (.66 + .34 * sin(uTime * 1.08) + uAudio.x * .62 + uMemory.x * .22);
          }
          if (uPlace == 8.0) {
            float stairLamp = softEllipse(vUv, vec2(.82, .66), vec2(.038, .025));
            colour += vec3(.052, .021, .004) * stairLamp * (.7 + .3 * sin(uTime * .82) + uAudio.x * .58);
          }
          if (uPlace == 9.0) {
            float lobbyLamp = softEllipse(vUv, vec2(.34, .64), vec2(.036, .026));
            colour += vec3(.06, .023, .004) * lobbyLamp * (.72 + .28 * sin(uTime * 1.22) + uAudio.x * .6 + uMemory.x * .18);
          }
          if (uPlace == 10.0) {
            float atticBulb = softEllipse(vUv, vec2(.65, .58), vec2(.034, .026));
            float unstableCurrent = .72 + .28 * sin(uTime * 1.46) + .12 * step(.96, sin(uTime * .31)) + uAudio.x * .7 + uMemory.x * .26;
            colour += vec3(.072, .029, .004) * atticBulb * unstableCurrent;
            float cable = softEllipse(vUv, vec2(.28, .49), vec2(.075, .018));
            vec3 cableShift = texture2D(uMap, vec2(vUv.x + sin(uTime * 2.1) * .0015, vUv.y)).rgb;
            colour = mix(colour, cableShift, cable * .18);
          }
          if (uPlace == 11.0) {
            float nearSnow = snowDot(vec2(vUv.x * 76.0 + uTime * .62, vUv.y * 52.0 + uTime * 1.86), .88);
            float farSnow = snowDot(vec2(vUv.x * 154.0 + uTime * .38, vUv.y * 108.0 + uTime * 1.21), .945);
            colour += vec3(.18, .22, .25) * (nearSnow * .42 + farSnow * .2) * (1.0 + uMemory.y * .65 + uAudio.z * .42);
            float antenna = softEllipse(vUv, vec2(.43, .65), vec2(.075, .13));
            vec3 antennaShift = texture2D(uMap, vec2(vUv.x + sin(uTime * .7) * .0018, vUv.y)).rgb;
            colour = mix(colour, antennaShift, antenna * .17);
          }
          if (uPlace == 12.0) {
            float arrivingTram = softEllipse(vUv, vec2(.72, .50), vec2(.15, .07));
            float tramOffset = sin(uTime * .23) * .018;
            vec3 shiftedTram = texture2D(uMap, vec2(vUv.x + tramOffset, vUv.y)).rgb;
            colour = mix(colour, shiftedTram, arrivingTram * (.44 + uAudio.x * .08));
            float glassBreath = softEllipse(vUv, vec2(.48, .52), vec2(.105, .17));
            colour = mix(colour, colour * vec3(.94, .985, 1.035), glassBreath * (.12 + .08 * sin(uTime * .34)));
          }
          gl_FragColor = vec4(colour, source.a * uOpacity);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    });
  }

  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(20, 64, 40),
    panoramaMaterial(),
  );
  scene.add(sphere);
  const incoming = new THREE.Mesh(
    new THREE.SphereGeometry(19.8, 64, 40),
    panoramaMaterial(true),
  );
  incoming.visible = false;
  incoming.renderOrder = 2;
  scene.add(incoming);

  const textureLoader = new THREE.TextureLoader();
  const textureCache = new Map();
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let yaw = 0;
  let pitch = 0;
  let active = false;
  let dragging = false;
  let moved = false;
  let startX = 0;
  let startY = 0;
  let currentKey = 'foyer';
  let textureRequest = 0;
  let cameraFrame = 0;
  let focusFrame = 0;
  let focusTimer = 0;
  let focusReturnFov = MAX_FOV;
  let blendFrame = 0;
  let travelTimer = 0;
  let travelRoll = 0;
  let travelMotion = 0;
  let lookMotion = 0;
  let lookMotionX = 0;
  let lookMotionY = 0;
  let lastMotionFrame = performance.now();
  let lastLookMove = 0;
  let ambientFrame = 0;
  let reactionFrame = 0;
  let lastAmbientRender = 0;
  const entryYaw = view => ({
    foyer: 2.82,
    kitchen: .18,
    bathroom: .94,
    stairwell: 1.25,
    courtyard: 1.57,
    lobby: 1.57,
    basement: .5,
    corridor: 1.57,
    elevator: .82,
    attic: 1.56,
    roof: 1.54,
    tramstop: 1.57,
    'supermarket-front': -1.57,
    'supermarket-inside': 3.33,
  }[view] || 0);
  const entryPitch = view => ({
    foyer: -.42,
    kitchen: -.045,
    bathroom: -.035,
    stairwell: -.035,
    courtyard: -.025,
    lobby: -.04,
    basement: -.045,
    corridor: -.035,
    elevator: -.035,
    attic: -.05,
    roof: -.08,
    tramstop: -.045,
    'supermarket-front': .27,
    'supermarket-inside': -.045,
  }[view] || 0);

  function render(frameTime) {
    // The room is never perfectly still: a nearly imperceptible hand-held breath
    // keeps the viewer present without hijacking their control of the camera.
    const now = frameTime || performance.now();
    const elapsed = Math.min(64, Math.max(0, now - lastMotionFrame));
    lastMotionFrame = now;
    if (!dragging && lookMotion > .0005) lookMotion *= Math.exp(-elapsed / 85);
    if (lookMotion < .0005) lookMotion = 0;
    const motionStrength = Math.max(travelMotion, lookMotion);
    const lookShare = motionStrength > 0 ? lookMotion / motionStrength : 0;
    const motionX = lookMotionX * lookShare;
    const motionY = lookMotionY * lookShare;
    sphere.material.uniforms.uMotion.value = motionStrength;
    incoming.material.uniforms.uMotion.value = motionStrength;
    sphere.material.uniforms.uRadialMotion.value = travelMotion;
    incoming.material.uniforms.uRadialMotion.value = travelMotion;
    sphere.material.uniforms.uMotionVector.value.set(motionX, motionY);
    incoming.material.uniforms.uMotionVector.value.set(motionX, motionY);
    const breath = active && !dragging ? Math.sin(now / 4700) * .0032 + Math.sin(now / 1180) * .00055 : 0;
    const sway = active && !dragging ? Math.sin(now / 8100) * .0024 + Math.sin(now / 1730) * .00045 : 0;
    sphere.material.uniforms.uTime.value = now * .001;
    incoming.material.uniforms.uTime.value = now * .001;
    camera.rotation.set(pitch + breath, yaw + sway, travelRoll, 'YXZ');
    renderer.render(scene, camera);
  }

  function resize() {
    const rect = root.getBoundingClientRect();
    camera.aspect = Math.max(.1, rect.width / Math.max(1, rect.height));
    camera.updateProjectionMatrix();
    renderer.setSize(rect.width, rect.height, false);
    const pixelRatio = renderer.getPixelRatio();
    sphere.material.uniforms.uResolution.value.set(rect.width * pixelRatio, rect.height * pixelRatio);
    incoming.material.uniforms.uResolution.value.set(rect.width * pixelRatio, rect.height * pixelRatio);
    render();
  }

  function loadTexture(source, done) {
    const cached = textureCache.get(source);
    if (cached) { done(cached); return; }
    textureLoader.load(source, texture => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      textureCache.set(source, texture);
      done(texture);
    });
  }

  function tweenFov(to, duration) {
    cancelAnimationFrame(cameraFrame);
    const from = camera.fov;
    const began = performance.now();
    const frame = now => {
      const progress = Math.min(1, (now - began) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      camera.fov = from + (to - from) * eased;
      camera.updateProjectionMatrix();
      render();
      if (progress < 1) cameraFrame = requestAnimationFrame(frame);
    };
    cameraFrame = requestAnimationFrame(frame);
  }

  function tweenPose(to, duration) {
    cancelAnimationFrame(focusFrame);
    const from = { fov: camera.fov, yaw, pitch };
    const began = performance.now();
    const frame = now => {
      const progress = Math.min(1, (now - began) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      camera.fov = from.fov + (to.fov - from.fov) * eased;
      yaw = from.yaw + (to.yaw - from.yaw) * eased;
      pitch = from.pitch + (to.pitch - from.pitch) * eased;
      camera.updateProjectionMatrix();
      render();
      if (progress < 1) focusFrame = requestAnimationFrame(frame);
    };
    focusFrame = requestAnimationFrame(frame);
  }

  function blendTexture(texture, duration, done, travelTarget = null) {
    if (!sphere.material.uniforms.uMap.value) {
      sphere.material.uniforms.uMap.value = texture;
      sphere.material.uniforms.uFlipX.value = incoming.material.uniforms.uFlipX.value;
      sphere.material.uniforms.uPlace.value = incoming.material.uniforms.uPlace.value;
      sphere.material.uniforms.uCycle.value = incoming.material.uniforms.uCycle.value;
      sphere.material.uniforms.uReturn.value = incoming.material.uniforms.uReturn.value;
      travelMotion = 0;
      lookMotion = 0;
      done();
      return;
    }
    cancelAnimationFrame(blendFrame);
    incoming.material.uniforms.uMap.value = texture;
    incoming.material.uniforms.uOpacity.value = 0;
    travelMotion = 0;
    incoming.visible = true;
    const began = performance.now();
    const startPose = { fov: camera.fov, yaw, pitch };
    const smooth = value => value * value * (3 - 2 * value);
    const clamp01 = value => Math.max(0, Math.min(1, value));
    const targetYaw = travelTarget ? entryYaw(travelTarget) : yaw;
    const targetPitch = travelTarget ? entryPitch(travelTarget) : pitch;
    const angleDelta = Math.atan2(Math.sin(targetYaw - startPose.yaw), Math.cos(targetYaw - startPose.yaw));
    const frame = now => {
      const progress = Math.min(1, (now - began) / Math.max(1, duration));
      if (travelTarget) {
        const textureMix = smooth(clamp01((progress - .31) / .43));
        const travelEnvelope = Math.sin(progress * Math.PI);
        const motionEnvelope = Math.pow(travelEnvelope, .78);
        const stride = Math.sin(progress * Math.PI * 6);
        const forward = travelEnvelope * 2.35;
        const turn = smooth(clamp01((progress - .47) / .53));
        yaw = startPose.yaw + angleDelta * turn;
        pitch = startPose.pitch + (targetPitch - startPose.pitch) * turn + Math.abs(stride) * .006 * travelEnvelope;
        travelRoll = stride * .0075 * travelEnvelope;
        camera.position.set(-Math.sin(yaw) * forward, Math.abs(stride) * .085 * travelEnvelope, -Math.cos(yaw) * forward);
        const fovProgress = progress < .5 ? smooth(progress / .5) : smooth((progress - .5) / .5);
        camera.fov = progress < .5
          ? startPose.fov + (46 - startPose.fov) * fovProgress
          : 46 + (MAX_FOV - 46) * fovProgress;
        camera.updateProjectionMatrix();
        travelMotion = motionEnvelope;
        incoming.material.uniforms.uOpacity.value = textureMix;
      } else {
        travelMotion = 0;
        incoming.material.uniforms.uOpacity.value = smooth(progress);
      }
      render();
      if (progress < 1) { blendFrame = requestAnimationFrame(frame); return; }
      sphere.material.uniforms.uMap.value = texture;
      sphere.material.uniforms.uFlipX.value = incoming.material.uniforms.uFlipX.value;
      sphere.material.uniforms.uPlace.value = incoming.material.uniforms.uPlace.value;
      sphere.material.uniforms.uCycle.value = incoming.material.uniforms.uCycle.value;
      sphere.material.uniforms.uReturn.value = incoming.material.uniforms.uReturn.value;
      incoming.visible = false;
      incoming.material.uniforms.uOpacity.value = 0;
      travelMotion = 0;
      camera.position.set(0, 0, 0);
      travelRoll = 0;
      done();
    };
    blendFrame = requestAnimationFrame(frame);
  }

  function setView(view, travel = false) {
    const next = PANORAMAS[view];
    if (!next) return false;
    const travelStartedAt = performance.now();
    if (!travel) {
      currentKey = view;
      root.dataset.location = view;
    } else root.dataset.destination = view;
    root.dataset.detail = '';
    root.classList.remove('focused');
    clearTimeout(focusTimer);
    const variants = Array.isArray(next.src) ? next.src : [next.src];
    const loop = Math.max(0, Number(root.dataset.loop) || 0);
    const variant = Math.max(0, Number(root.dataset.variant) || 0);
    const cycle = Math.max(0, Number(root.dataset.cycle) || 0) % 4;
    const returnCount = Math.max(0, Number(root.dataset.returnCount) || 0);
    const source = variants[Math.max(loop, variant) % variants.length];
    const request = ++textureRequest;
    incoming.material.uniforms.uPlace.value = placeCode(view);
    incoming.material.uniforms.uFlipX.value = next.flipX ? 1 : 0;
    incoming.material.uniforms.uCycle.value = cycle;
    incoming.material.uniforms.uReturn.value = returnCount;
    const passage = typeof travel === 'object' ? travel : null;
    if (travel) {
      root.classList.add('travelling');
      const screenX = THREE.MathUtils.clamp(passage?.screenX ?? .5, 0, 1);
      const screenY = THREE.MathUtils.clamp(passage?.screenY ?? .5, 0, 1);
      const horizontalFov = THREE.MathUtils.degToRad(camera.fov) * camera.aspect;
      const verticalFov = THREE.MathUtils.degToRad(camera.fov);
      tweenPose({
        fov: 62,
        yaw: yaw - (screenX - .5) * horizontalFov,
        pitch: THREE.MathUtils.clamp(pitch + (screenY - .5) * verticalFov * .42, -.55, .55),
      }, 460);
    }
    loadTexture(source, texture => {
      if (request !== textureRequest) return;
      const beginBlend = () => {
        if (request !== textureRequest) return;
        blendTexture(texture, travel ? 1780 : 0, () => {
          if (request !== textureRequest) return;
          yaw = entryYaw(view);
          pitch = entryPitch(view);
          camera.fov = MAX_FOV;
          camera.updateProjectionMatrix();
          currentKey = view;
          root.dataset.location = view;
          delete root.dataset.destination;
          root.classList.remove('travelling');
          render();
        }, travel ? view : null);
      };
      clearTimeout(travelTimer);
      if (travel) travelTimer = window.setTimeout(beginBlend, Math.max(0, 470 - (performance.now() - travelStartedAt)));
      else beginBlend();
    });
    return true;
  }

  function hotspotAt(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObject(sphere, false)[0];
    if (!hit?.uv) return null;
    const u = hit.uv.x;
    const v = hit.uv.y;
    return PANORAMAS[currentKey].hotspots.find(point => (
      Math.min(Math.abs(point.u - u), 1 - Math.abs(point.u - u)) < (point.radiusU || .075)
      && Math.abs(point.v - v) < (point.radiusV || .24)
    ));
  }

  function portalAt(event) {
    const hotspot = hotspotAt(event);
    if (hotspot) {
      const rect = renderer.domElement.getBoundingClientRect();
      root.dataset.hover = '';
      onHover?.(null, null);
      if (hotspot.action) focusAt(event, hotspot);
      onPortal({
        ...hotspot,
        from: currentKey,
        screenX: (event.clientX - rect.left) / Math.max(1, rect.width),
        screenY: (event.clientY - rect.top) / Math.max(1, rect.height),
      });
    }
  }

  function focusAt(event, hotspot) {
    clearTimeout(focusTimer);
    const rect = renderer.domElement.getBoundingClientRect();
    const horizontalFov = THREE.MathUtils.degToRad(camera.fov) * camera.aspect;
    const dx = (event.clientX - rect.left - rect.width / 2) / rect.width;
    const dy = (event.clientY - rect.top - rect.height / 2) / rect.height;
    const restoreFov = camera.fov;
    focusReturnFov = restoreFov;
    root.classList.add('focused');
    root.dataset.detail = hotspot.action;
    tweenPose({
      fov: Math.min(46, restoreFov),
      yaw: yaw - dx * horizontalFov,
      pitch: Math.max(-.55, Math.min(.55, pitch + dy * THREE.MathUtils.degToRad(camera.fov))),
    }, 620);
    focusTimer = window.setTimeout(() => {
      root.classList.remove('focused');
      tweenPose({ fov: restoreFov, yaw, pitch }, 940);
    }, 5200);
  }

  renderer.domElement.addEventListener('pointerdown', event => {
    clearTimeout(focusTimer);
    if (root.classList.contains('focused')) {
      cancelAnimationFrame(focusFrame);
      camera.fov = focusReturnFov;
      camera.updateProjectionMatrix();
    }
    root.classList.remove('focused');
    dragging = true;
    moved = false;
    startX = event.clientX;
    startY = event.clientY;
    lastLookMove = performance.now();
    lookMotion = 0;
    renderer.domElement.setPointerCapture(event.pointerId);
    root.classList.add('dragging');
    onGesture();
  });
  renderer.domElement.addEventListener('pointermove', event => {
    if (!dragging) {
      const hotspot = hotspotAt(event);
      root.dataset.hover = hotspot ? (hotspot.to || hotspot.loop ? 'passage' : 'object') : '';
      root.style.setProperty('--hint-x', `${event.clientX}px`);
      root.style.setProperty('--hint-y', `${event.clientY}px`);
      onHover?.(hotspot, event);
      return;
    }
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    const movedAt = performance.now();
    const moveElapsed = Math.max(8, Math.min(48, movedAt - lastLookMove || 16));
    const distance = Math.hypot(dx, dy);
    const velocity = distance / moveElapsed;
    const targetMotion = Math.min(.34, velocity * .18);
    if (distance > .1) {
      const directionX = dx / distance;
      const directionY = -dy / distance;
      lookMotionX = lookMotionX * .42 + directionX * .58;
      lookMotionY = lookMotionY * .42 + directionY * .58;
      lookMotion = Math.max(targetMotion, lookMotion * .62);
    }
    lastLookMove = movedAt;
    if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
    yaw -= dx * .004;
    pitch = Math.max(-.55, Math.min(.55, pitch - dy * .003));
    startX = event.clientX;
    startY = event.clientY;
    render();
  });
  renderer.domElement.addEventListener('pointerup', event => {
    if (!dragging) return;
    dragging = false;
    root.classList.remove('dragging');
    if (!moved) portalAt(event);
  });
  renderer.domElement.addEventListener('pointerleave', () => {
    root.dataset.hover = '';
    onHover?.(null, null);
  });
  renderer.domElement.addEventListener('wheel', event => {
    event.preventDefault();
    camera.fov = Math.max(48, Math.min(MAX_FOV, camera.fov + event.deltaY * .025));
    camera.updateProjectionMatrix();
    render();
  }, { passive: false });

  setView('foyer');
  resize();
  const ambient = now => {
    if (active && !dragging && now - lastAmbientRender > 32) {
      lastAmbientRender = now;
      render(now);
    }
    ambientFrame = requestAnimationFrame(ambient);
  };
  ambientFrame = requestAnimationFrame(ambient);

  return {
    setActive(nextActive, view, passage) {
      active = nextActive;
      if (view) setView(view, active && view !== currentKey ? (passage || { u: .5, v: .5 }) : false);
      root.classList.toggle('active', active);
      if (active) { resize(); render(); }
    },
    setView,
    setAudio({ low = 0, mid = 0, high = 0, progress = 0, chapter = 0 } = {}) {
      sphere.material.uniforms.uAudio.value.set(low, mid, high, progress);
      incoming.material.uniforms.uAudio.value.set(low, mid, high, progress);
      sphere.material.uniforms.uChapter.value = chapter;
      incoming.material.uniforms.uChapter.value = chapter;
    },
    setMemory({ electric = 0, water = 0, movement = 0, decay = 0 } = {}) {
      sphere.material.uniforms.uMemory.value.set(electric, water, movement, decay);
      incoming.material.uniforms.uMemory.value.set(electric, water, movement, decay);
      if (active) render();
    },
    react(kind = 'decay') {
      cancelAnimationFrame(reactionFrame);
      const kindCode = ({ electric: 1, water: 2, movement: 3, decay: 4 })[kind] || 4;
      const began = performance.now();
      const duration = 1450;
      const frame = now => {
        const progress = Math.min(1, (now - began) / duration);
        const strength = Math.sin(progress * Math.PI) * .92;
        sphere.material.uniforms.uReaction.value.set(kindCode, strength);
        incoming.material.uniforms.uReaction.value.set(kindCode, strength);
        if (active) render(now);
        if (progress < 1) reactionFrame = requestAnimationFrame(frame);
      };
      reactionFrame = requestAnimationFrame(frame);
    },
    hasView(view) { return Boolean(PANORAMAS[view]); },
    resize,
  };
}
