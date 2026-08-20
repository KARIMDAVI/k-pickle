import * as THREE from 'three';

export function seeded(seed) {
  let t = seed * 1831565813 + 1;
  return function next() {
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Integer theta multipliers keep the perturbation seamless where the lathe seam closes. */
function wobble(y, theta, seed) {
  return (
    Math.sin(theta * 7 + seed * 3.1) * 0.34 +
    Math.sin(theta * 11 - y * 4.2 + seed * 7.7) * 0.24 +
    Math.sin(y * 9.1 + seed * 2.3) * 0.42
  );
}

function bumpify(geometry, { amount = 0.05, seed = 1, filter = null } = {}) {
  const position = geometry.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < position.count; i += 1) {
    v.fromBufferAttribute(position, i);
    const radial = Math.hypot(v.x, v.z);
    if (radial < 1e-4) continue;
    if (filter && !filter(v)) continue;

    const theta = Math.atan2(v.z, v.x);
    const scale = 1 + amount * wobble(v.y, theta, seed);
    position.setX(i, Math.cos(theta) * radial * scale);
    position.setZ(i, Math.sin(theta) * radial * scale);
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function ribbed(geometry, { amount = 0.02, ribs = 60, from = -Infinity, to = Infinity } = {}) {
  const position = geometry.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < position.count; i += 1) {
    v.fromBufferAttribute(position, i);
    if (v.y < from || v.y > to) continue;
    const radial = Math.hypot(v.x, v.z);
    if (radial < 1e-4) continue;
    const theta = Math.atan2(v.z, v.x);
    const scale = 1 + amount * Math.sin(theta * ribs);
    position.setX(i, Math.cos(theta) * radial * scale);
    position.setZ(i, Math.sin(theta) * radial * scale);
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function lathe(profile, segments, thetaStart = 0, thetaLength = Math.PI * 2) {
  const points = profile.map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.LatheGeometry(points, segments, thetaStart, thetaLength);
}

export function cucumberGeometry({
  length = 1,
  radius = 0.16,
  segments = 24,
  rings = 26,
  seed = 1,
  bend = 0.06,
} = {}) {
  const profile = [];
  for (let i = 0; i <= rings; i += 1) {
    const t = i / rings;
    const r = radius * Math.pow(Math.sin(Math.PI * t), 0.34);
    profile.push([Math.max(r, 0.0001), (t - 0.5) * length]);
  }

  const geometry = lathe(profile, segments);
  bumpify(geometry, { amount: 0.085, seed });

  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const y = position.getY(i);
    const t = y / length + 0.5;
    position.setX(i, position.getX(i) + Math.sin(Math.PI * t) * bend * length);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

export function spearGeometry({ length = 1, radius = 0.1, segments = 18, seed = 3 } = {}) {
  const profile = [];
  const rings = 18;
  for (let i = 0; i <= rings; i += 1) {
    const t = i / rings;
    const edge = Math.min(t, 1 - t) / 0.08;
    const r = radius * Math.min(1, Math.pow(Math.min(edge, 1), 0.5));
    profile.push([Math.max(r, 0.0001), (t - 0.5) * length]);
  }
  const geometry = lathe(profile, segments);
  return bumpify(geometry, { amount: 0.06, seed });
}

export function jarGeometry({ height = 1, radius = 0.5, segments = 48 } = {}) {
  const profile = [
    [0, 0], [0.72, 0], [0.9, 0.015], [0.96, 0.06],
    [0.99, 0.12], [1.0, 0.58], [0.97, 0.66], [0.86, 0.76],
    [0.7, 0.84], [0.64, 0.88], [0.63, 0.965], [0.66, 0.985],
    [0.655, 1.0], [0.6, 1.0], [0.595, 0.985], [0.585, 0.9],
    [0.6, 0.84], [0.78, 0.75], [0.9, 0.64], [0.93, 0.56],
    [0.93, 0.13], [0.86, 0.08], [0.7, 0.06], [0, 0.06],
  ];

  const geometry = lathe(
    profile.map(([x, y]) => [x * radius, y * height]),
    segments,
  );
  geometry.computeVertexNormals();
  return geometry;
}

export function lidGeometry({ height = 1, radius = 0.5, segments = 48 } = {}) {
  const profile = [
    [0, 0.06], [0.5, 0.06], [0.6, 0.055], [0.655, 0.03],
    [0.67, 0.0], [0.67, -0.11], [0.655, -0.135], [0.6, -0.145],
    [0.6, -0.125], [0.64, -0.115], [0.64, -0.005], [0.6, 0.02],
    [0.48, 0.04], [0, 0.04],
  ];

  const geometry = lathe(
    profile.map(([x, y]) => [x * radius, y * height]),
    segments,
  );
  ribbed(geometry, { amount: 0.014, ribs: 72, from: -0.14 * height, to: 0.005 * height });
  return geometry;
}

export function crockGeometry({ height = 1, radius = 1, segments = 64, cutaway = Math.PI * 1.55 } = {}) {
  const profile = [
    [0, 0], [0.78, 0], [0.9, 0.04], [0.96, 0.14],
    [1.0, 0.42], [1.0, 0.78], [0.94, 0.95], [0.9, 1.02],
    [0.98, 1.06], [1.0, 1.1], [0.94, 1.13], [0.86, 1.1],
    [0.84, 1.02], [0.88, 0.95], [0.93, 0.78], [0.93, 0.42],
    [0.88, 0.16], [0.8, 0.08], [0, 0.08],
  ];

  const geometry = lathe(
    profile.map(([x, y]) => [x * radius, y * height]),
    segments,
    Math.PI * 0.72,
    cutaway,
  );
  geometry.computeVertexNormals();
  return geometry;
}

export function stoneGeometry({ radius = 1, seed = 9 } = {}) {
  const geometry = new THREE.IcosahedronGeometry(radius, 2);
  const rand = seeded(seed);
  const offsets = new Array(7).fill(0).map(() => rand() * Math.PI * 2);
  const position = geometry.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < position.count; i += 1) {
    v.fromBufferAttribute(position, i);
    const n =
      Math.sin(v.x * 2.4 + offsets[0]) * 0.4 +
      Math.sin(v.y * 3.1 + offsets[1]) * 0.3 +
      Math.sin(v.z * 2.7 + offsets[2]) * 0.3;
    v.multiplyScalar(1 + n * 0.12);
    v.y *= 0.52;
    position.setXYZ(i, v.x, v.y, v.z);
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

export function garlicCloveGeometry({ size = 1, segments = 16 } = {}) {
  const profile = [];
  const rings = 16;
  for (let i = 0; i <= rings; i += 1) {
    const t = i / rings;
    const r = Math.pow(Math.sin(Math.PI * t), 0.75) * (1 - t * 0.42) * 0.42;
    profile.push([Math.max(r, 0.0001) * size, (t - 0.42) * size]);
  }
  const geometry = lathe(profile, segments);
  geometry.scale(1, 1, 0.72);
  geometry.computeVertexNormals();
  return geometry;
}

export function leafGeometry({ size = 1, segments = 14 } = {}) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.36, 0.12, 0.52, 0.52, 0, 1);
  shape.bezierCurveTo(-0.52, 0.52, -0.36, 0.12, 0, 0);

  const geometry = new THREE.ShapeGeometry(shape, segments);
  geometry.scale(size, size, size);

  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const y = position.getY(i);
    const curl = -(x * x) * 1.6 - Math.pow(y / size, 2) * 0.18 * size;
    position.setZ(i, curl);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

export function vineGeometry({ height = 2, radius = 0.02, seed = 5, segments = 8 } = {}) {
  const rand = seeded(seed);
  const points = [];
  const steps = 7;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    points.push(new THREE.Vector3(
      Math.sin(t * 3.2 + rand() * 0.3) * 0.12 * height,
      t * height,
      Math.cos(t * 2.4 + rand() * 0.3) * 0.1 * height,
    ));
  }
  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.TubeGeometry(curve, 20, radius, segments, false);
}

export function dillGeometry({ size = 1 } = {}) {
  const geometries = [];
  const stem = new THREE.CylinderGeometry(0.012 * size, 0.016 * size, size, 5);
  stem.translate(0, size * 0.5, 0);
  geometries.push(stem);

  for (let i = 0; i < 7; i += 1) {
    const angle = (i / 7) * Math.PI * 2;
    const spoke = new THREE.CylinderGeometry(0.006 * size, 0.008 * size, size * 0.42, 4);
    spoke.translate(0, size * 0.21, 0);
    spoke.rotateX(0.62);
    spoke.rotateY(angle);
    spoke.translate(0, size, 0);
    geometries.push(spoke);

    const tip = new THREE.SphereGeometry(0.022 * size, 5, 4);
    tip.translate(
      Math.sin(angle) * size * 0.24,
      size * 1.36,
      Math.cos(angle) * size * 0.24,
    );
    geometries.push(tip);
  }

  return mergeGeometries(geometries);
}

export function mergeGeometries(list) {
  const merged = new THREE.BufferGeometry();
  let vertexCount = 0;
  let indexCount = 0;

  for (const g of list) {
    vertexCount += g.attributes.position.count;
    indexCount += g.index ? g.index.count : g.attributes.position.count;
  }

  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const indices = new Uint32Array(indexCount);
  let vOffset = 0;
  let iOffset = 0;

  for (const g of list) {
    if (!g.attributes.normal) g.computeVertexNormals();
    positions.set(g.attributes.position.array, vOffset * 3);
    normals.set(g.attributes.normal.array, vOffset * 3);

    const count = g.attributes.position.count;
    if (g.index) {
      for (let i = 0; i < g.index.count; i += 1) indices[iOffset + i] = g.index.getX(i) + vOffset;
      iOffset += g.index.count;
    } else {
      for (let i = 0; i < count; i += 1) indices[iOffset + i] = i + vOffset;
      iOffset += count;
    }
    vOffset += count;
    g.dispose();
  }

  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  merged.setIndex(new THREE.BufferAttribute(indices, 1));
  return merged;
}

/* A real label wraps most of the way round and stops; a full-circumference band with a
   repeating texture shows a seam from every angle, so the band is an arc instead. */
export function labelBandGeometry({ height = 1, radius = 0.5, segments = 48 } = {}) {
  return new THREE.CylinderGeometry(
    radius * 1.008,
    radius * 1.008,
    height * 0.46,
    segments,
    1,
    true,
    -Math.PI * 0.72,
    Math.PI * 1.44,
  );
}

export function labelTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#e8dcc4';
  ctx.fillRect(0, 0, 1024, 512);

  const rand = seeded(12);
  ctx.fillStyle = 'rgba(90, 78, 52, 0.14)';
  for (let i = 0; i < 2600; i += 1) {
    ctx.fillRect(rand() * 1024, rand() * 512, 1.4, 1.4);
  }

  ctx.strokeStyle = '#1f2b1a';
  ctx.lineWidth = 7;
  ctx.strokeRect(34, 34, 956, 444);
  ctx.lineWidth = 2;
  ctx.strokeRect(52, 52, 920, 408);

  ctx.fillStyle = '#1f2b1a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = '600 34px Georgia, serif';
  ctx.letterSpacing = '14px';
  ctx.fillText('SMALL BATCH · SINCE 1962', 512, 126);

  ctx.letterSpacing = '0px';
  ctx.font = 'bold 148px Georgia, serif';
  ctx.textAlign = 'right';
  ctx.fillText('K', 512, 244);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#9a7418';
  ctx.fillText('-Pickle', 512, 244);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#1f2b1a';
  ctx.font = 'italic 40px Georgia, serif';
  ctx.fillText('Whole Kosher Pickles · Vinegar Brine', 512, 350);

  ctx.font = '600 28px Georgia, serif';
  ctx.letterSpacing = '10px';
  ctx.fillText('HOLLIS BEND · NO. 0142', 512, 418);
  ctx.letterSpacing = '0px';

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 4;
  return texture;
}
