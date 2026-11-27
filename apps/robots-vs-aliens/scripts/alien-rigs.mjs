// Portrait-space landmarks, facing left. Each leg runs from socket to knee to toe.
// Opposite phase groups plant and swing in turn. Ember uses the Native anatomy.
const native = {
  scout: {
    neck: [0.34, 0.4],
    nose: [0.02, 0.49],
    jaw: [0.08, 0.67],
    crest: [0.77, 0.035],
    hip: [0.68, 0.34],
    tail: [0.98, 0.73],
    legs: [
      [[0.34, 0.41], [0.32, 0.61], [0.05, 0.93], 0],
      [[0.44, 0.4], [0.53, 0.57], [0.24, 0.96], 0.5],
      [[0.63, 0.39], [0.72, 0.65], [0.52, 0.87], 0.5],
      [[0.71, 0.37], [0.88, 0.61], [0.91, 0.92], 0],
    ],
  },
  runner: {
    neck: [0.32, 0.37],
    nose: [0.015, 0.43],
    jaw: [0.23, 0.5],
    crest: [0.84, 0.055],
    hip: [0.57, 0.44],
    tail: [0.99, 0.74],
    legs: [
      [[0.32, 0.44], [0.2, 0.55], [0.025, 0.87], 0],
      [[0.48, 0.41], [0.34, 0.54], [0.24, 0.95], 0.5],
      [[0.65, 0.4], [0.62, 0.6], [0.37, 0.81], 0.5],
      [[0.63, 0.43], [0.83, 0.57], [0.64, 0.91], 0],
    ],
  },
  brute: {
    neck: [0.31, 0.49],
    nose: [0.025, 0.7],
    jaw: [0.12, 0.78],
    crest: [0.5, 0.035],
    hip: [0.7, 0.43],
    tail: [0.93, 0.54],
    legs: [
      [[0.22, 0.55], [0.15, 0.74], [0.04, 0.91], 0],
      [[0.41, 0.52], [0.45, 0.7], [0.32, 0.97], 0.5],
      [[0.67, 0.49], [0.61, 0.71], [0.56, 0.89], 0.5],
      [[0.79, 0.51], [0.86, 0.73], [0.9, 0.92], 0],
    ],
  },
  spitter: {
    neck: [0.43, 0.43],
    nose: [0.018, 0.55],
    jaw: [0.035, 0.64],
    crest: [0.57, 0.045],
    hip: [0.7, 0.46],
    tail: [0.98, 0.33],
    sac: [
      [0.58, 0.2],
      [0.73, 0.34],
      [0.6, 0.49],
    ],
    legs: [
      [[0.45, 0.48], [0.32, 0.68], [0.13, 0.96], 0],
      [[0.57, 0.48], [0.51, 0.68], [0.36, 0.96], 0.5],
      [[0.66, 0.51], [0.61, 0.68], [0.6, 0.95], 0.5],
      [[0.8, 0.48], [0.91, 0.65], [0.95, 0.94], 0],
    ],
  },
  overlord: {
    neck: [0.4, 0.34],
    nose: [0.022, 0.31],
    jaw: [0.08, 0.42],
    crest: [0.6, 0.065],
    hip: [0.67, 0.52],
    tail: [0.98, 0.76],
    legs: [
      [[0.37, 0.42], [0.13, 0.48], [0.08, 0.94], 0],
      [[0.5, 0.39], [0.32, 0.5], [0.18, 0.98], 0.5],
      [[0.59, 0.51], [0.55, 0.7], [0.4, 0.92], 0.5],
      [[0.63, 0.52], [0.64, 0.72], [0.56, 0.94], 0],
      [[0.76, 0.53], [0.9, 0.67], [0.93, 0.91], 0.5],
    ],
  },
};
const riftborn = {
  scout: {
    neck: [0.37, 0.47],
    nose: [0.024, 0.62],
    jaw: [0.07, 0.7],
    crest: [0.55, 0.025],
    hip: [0.65, 0.48],
    tail: [0.83, 0.36],
    legs: [
      [[0.36, 0.49], [0.28, 0.66], [0.085, 0.92], 0],
      [[0.48, 0.5], [0.43, 0.68], [0.4, 0.94], 0.5],
      [[0.63, 0.48], [0.66, 0.62], [0.49, 0.95], 0.5],
      [[0.71, 0.5], [0.87, 0.75], [0.96, 0.92], 0],
    ],
  },
  runner: {
    neck: [0.35, 0.43],
    nose: [0.024, 0.53],
    jaw: [0.19, 0.48],
    crest: [0.46, 0.055],
    hip: [0.56, 0.39],
    tail: [0.96, 0.32],
    legs: [
      [[0.34, 0.43], [0.27, 0.62], [0.11, 0.92], 0],
      [[0.43, 0.4], [0.43, 0.62], [0.21, 0.96], 0.5],
      [[0.49, 0.41], [0.55, 0.7], [0.73, 0.85], 0.5],
      [[0.51, 0.43], [0.71, 0.58], [0.86, 0.89], 0],
    ],
  },
  brute: {
    neck: [0.37, 0.49],
    nose: [0.035, 0.7],
    jaw: [0.13, 0.79],
    crest: [0.56, 0.025],
    hip: [0.72, 0.49],
    tail: [0.87, 0.4],
    legs: [
      [[0.28, 0.53], [0.21, 0.73], [0.1, 0.92], 0],
      [[0.48, 0.55], [0.44, 0.73], [0.32, 0.94], 0.5],
      [[0.66, 0.51], [0.62, 0.72], [0.55, 0.89], 0.5],
      [[0.78, 0.51], [0.85, 0.74], [0.94, 0.92], 0],
    ],
  },
  spitter: {
    neck: [0.37, 0.39],
    nose: [0.025, 0.46],
    jaw: [0.15, 0.46],
    crest: [0.53, 0.045],
    hip: [0.65, 0.46],
    tail: [0.96, 0.91],
    sac: [
      [0.35, 0.36],
      [0.51, 0.48],
      [0.43, 0.59],
    ],
    legs: [
      [[0.48, 0.53], [0.4, 0.7], [0.2, 0.92], 0],
      [[0.63, 0.5], [0.65, 0.65], [0.46, 0.94], 0.5],
      [[0.75, 0.51], [0.75, 0.75], [0.62, 0.91], 0.5],
      [[0.72, 0.52], [0.83, 0.76], [0.89, 0.93], 0],
    ],
  },
  overlord: {
    neck: [0.34, 0.48],
    nose: [0.024, 0.48],
    jaw: [0.065, 0.62],
    crest: [0.53, 0.055],
    hip: [0.66, 0.6],
    tail: [0.86, 0.4],
    legs: [
      [[0.34, 0.5], [0.25, 0.72], [0.055, 0.92], 0],
      [[0.45, 0.57], [0.39, 0.76], [0.29, 0.93], 0.5],
      [[0.59, 0.55], [0.57, 0.72], [0.44, 0.96], 0.5],
      [[0.69, 0.55], [0.8, 0.76], [0.92, 0.93], 0],
    ],
  },
};

const actions = {
  // Foot stroke, toe clearance, chest rise and pitch distinguish the five walks.
  scout: {
    step: 0.105,
    lift: 0.21,
    rise: 0.055,
    pitch: 0.07,
    drive: 0.075,
    reach: 0.1,
    claw: 0.085,
  },
  runner: { step: 0.16, lift: 0.3, rise: 0.1, pitch: 0.12, drive: 0.12, reach: 0.08, claw: 0.16 },
  brute: {
    step: 0.085,
    lift: 0.16,
    rise: 0.052,
    pitch: 0.095,
    drive: 0.085,
    reach: 0.14,
    claw: 0.035,
  },
  spitter: {
    step: 0.11,
    lift: 0.22,
    rise: 0.065,
    pitch: 0.07,
    drive: -0.065,
    reach: -0.045,
    claw: 0.035,
  },
  overlord: {
    step: 0.12,
    lift: 0.21,
    rise: 0.068,
    pitch: 0.09,
    drive: 0.065,
    reach: 0.085,
    claw: 0.18,
  },
};

// The engine resets its attack clock at contact. The end of this cycle is the next wind-up.
const attackKeys = [
  // time, impact, gather, open jaw
  [0, 1, 0, 0.95],
  [0.12, 0.86, 0, 0.58],
  [0.32, 0.18, 0, 0.12],
  [0.48, 0, 0.04, 0.1],
  [0.68, 0, 0.36, 0.35],
  [0.85, 0, 0.87, 0.9],
  [0.94, 0, 1, 1],
  [1, 1, 0, 0.95],
];
function attackAt(t) {
  const end = attackKeys.findIndex((key) => key[0] > t);
  const a = attackKeys[end - 1],
    b = attackKeys[end];
  const f = (t - a[0]) / (b[0] - a[0]);
  const ease = f * f * (3 - 2 * f);
  return a.slice(1).map((v, i) => v + (b[i + 1] - v) * ease);
}
function rotate([x, y], [cx, cy], angle) {
  const cos = Math.cos(angle),
    sin = Math.sin(angle);
  return [cx + (x - cx) * cos - (y - cy) * sin, cy + (x - cx) * sin + (y - cy) * cos];
}
function offset([x, y], dx, dy) {
  return [x + dx, y + dy];
}

// Preserve both segment lengths and the direction in which this particular knee bends.
function bendLeg(socket, knee, toe, root, goal) {
  const upper = Math.hypot(knee[0] - socket[0], knee[1] - socket[1]);
  const lower = Math.hypot(toe[0] - knee[0], toe[1] - knee[1]);
  const dx = goal[0] - root[0],
    dy = goal[1] - root[1];
  const distance = Math.max(0.01, Math.hypot(dx, dy));
  const span = Math.max(Math.abs(upper - lower) + 0.01, Math.min(upper + lower - 0.01, distance));
  const along = (upper * upper - lower * lower + span * span) / (2 * span);
  const side =
    Math.sign(
      (toe[0] - socket[0]) * (knee[1] - socket[1]) - (toe[1] - socket[1]) * (knee[0] - socket[0]),
    ) || 1;
  const normal = side * Math.sqrt(Math.max(0, upper * upper - along * along));
  const ux = dx / distance,
    uy = dy / distance;
  return [
    offset(root, ux * along - uy * normal, uy * along + ux * normal),
    offset(root, ux * span, uy * span),
  ];
}

export function buildPoses(kind, skin, w, h, frames) {
  const animal = (skin === 'riftborn' ? riftborn : native)[kind];
  const action = actions[kind];
  const pixels = ([x, y]) => [x * w, y * h];
  const center = pixels([0.55, 0.46]);
  const poses = [];
  for (const attack of [false, true]) {
    for (let frame = 0; frame < frames; frame++) {
      const cycle = frame / frames,
        phase = cycle * 2 * Math.PI;
      const beat = Math.sin(phase),
        double = (1 - Math.cos(phase * 2)) * 0.5;
      const [impact, gather, jawOpen] = attack ? attackAt(cycle) : [0, 0, 0];
      const pitch = attack ? 0.16 * gather - 0.2 * impact : beat * action.pitch;
      const xTravel = w * (attack ? 0.045 * gather - action.drive * impact : 0.024 * beat);
      const yTravel = h * (attack ? -0.08 * gather + 0.045 * impact : -action.rise * double);
      const body = (p) => offset(rotate(p, center, pitch), xTravel, yTravel);
      const neck = pixels(animal.neck),
        neckEnd = body(neck);
      const headPitch = attack ? 0.22 * gather - 0.24 * impact : -0.11 * beat;
      const reach = attack
        ? w * (0.045 * gather - action.reach * impact)
        : -0.024 * w * Math.cos(phase);
      const head = (p) => offset(rotate(body(p), neckEnd, headPitch), reach, 0);
      const pins = [];
      const pin = (src, dst) => pins.push([src[0], src[1], dst[0], dst[1]]);
      pin(center, body(center));
      const hip = pixels(animal.hip),
        crest = pixels(animal.crest),
        tail = pixels(animal.tail);
      pin(hip, body(hip));
      pin(neck, offset(neckEnd, reach * 0.35, 0));
      const nose = pixels(animal.nose),
        jaw = pixels(animal.jaw);
      pin(nose, head(nose));
      pin(jaw, offset(head(jaw), 0, h * (attack ? 0.115 * jawOpen : 0.027 * (1 + beat))));
      pin(
        crest,
        offset(
          body(crest),
          w * (attack ? 0.045 * gather : -0.035 * beat),
          h * (attack ? -0.055 * gather : -0.043 * beat),
        ),
      );
      pin(
        tail,
        offset(
          body(tail),
          w * (attack ? 0.055 * impact : 0.037 * beat),
          h * (attack ? -0.08 * impact : 0.085 * Math.sin(phase + 0.7)),
        ),
      );
      for (const [index, leg] of animal.legs.entries()) {
        const [socket, knee, toe] = leg.slice(0, 3).map(pixels);
        const root = body(socket),
          step = phase + leg[3] * Math.PI * 2;
        const fore = index < 2;
        const goal = attack
          ? offset(
              toe,
              w * (fore ? action.claw * (0.35 * gather - impact) : 0.018 * gather),
              h * (fore ? -0.24 * gather - (kind === 'overlord' ? 0.1 : 0.035) * impact : 0),
            )
          : offset(
              toe,
              w * action.step * Math.sin(step),
              -h * action.lift * Math.max(0, Math.cos(step)),
            );
        const [joint, foot] = bendLeg(socket, knee, toe, root, goal);
        pin(socket, root);
        pin(knee, joint);
        pin(toe, foot);
      }
      if (animal.sac) {
        // The Spitter's throat fills before release and snaps shut as the acid leaves.
        const swelling = attack ? 0.07 * gather - 0.05 * impact : 0.025 * Math.cos(phase);
        const dirs = [
          [0, -1],
          [1, 0],
          [0, 1],
        ];
        animal.sac.forEach((point, i) => {
          const p = pixels(point);
          pin(p, offset(body(p), dirs[i][0] * w * swelling, dirs[i][1] * h * swelling));
        });
      }
      poses.push(pins);
    }
  }
  return poses;
}
