import * as THREE from 'three';

// ---------------------------------------------------------------------------
// BIOME CONFIGURATIONS & PRESETS
// ---------------------------------------------------------------------------

export type BiomeId = 'cyberManila' | 'baguioPines' | 'palawanArchipelago' | 'batanesRollingHills';

export interface BiomeConfig {
  id: BiomeId;
  name: string;
  subtitle: string;
  description: string;
  elevationScale: number;
  buildingDensity: number; // 0..1
  treeDensity: number; // 0..1
  riverWidth: number;
  riverColor: number;
  terrainColor: number;
  rockColor: number;
  animalCount: {
    carabaos: number;
    eagles: number;
    fish: number;
  };
  treeTypes: ('palm' | 'pine' | 'narra')[];
}

export const BIOME_PRESETS: Record<BiomeId, BiomeConfig> = {
  cyberManila: {
    id: 'cyberManila',
    name: 'Cyber Manila 2090',
    subtitle: 'High-Density Neon Megacity & Pasig Cyberway',
    description: 'Towering glass skyscrapers, illuminated skybridges, cyber river canals, and manicured urban parks.',
    elevationScale: 4.0,
    buildingDensity: 0.85,
    treeDensity: 0.3,
    riverWidth: 16,
    riverColor: 0x00f0ff,
    terrainColor: 0x111c2e,
    rockColor: 0x1e293b,
    animalCount: { carabaos: 2, eagles: 3, fish: 12 },
    treeTypes: ['palm', 'narra'],
  },
  baguioPines: {
    id: 'baguioPines',
    name: 'Baguio Pine Highlands',
    subtitle: 'Misty Cordillera Slopes & Mountain Ridges',
    description: 'High rolling mountain elevations, winding fresh creeks, dense pine tree forests, and majestic soaring raptors.',
    elevationScale: 14.0,
    buildingDensity: 0.25,
    treeDensity: 0.9,
    riverWidth: 10,
    riverColor: 0x38bdf8,
    terrainColor: 0x143324,
    rockColor: 0x334155,
    animalCount: { carabaos: 4, eagles: 6, fish: 8 },
    treeTypes: ['pine', 'narra'],
  },
  palawanArchipelago: {
    id: 'palawanArchipelago',
    name: 'Palawan Emerald Archipelago',
    subtitle: 'Subterranean River Valleys & Coastal Groves',
    description: 'Meandering turquoise rivers, lush tropical coconut groves, elevated wooden pavilions, and rich coastal wildlife.',
    elevationScale: 7.0,
    buildingDensity: 0.2,
    treeDensity: 0.75,
    riverWidth: 20,
    riverColor: 0x10b981,
    terrainColor: 0x1b4332,
    rockColor: 0x475569,
    animalCount: { carabaos: 6, eagles: 4, fish: 20 },
    treeTypes: ['palm'],
  },
  batanesRollingHills: {
    id: 'batanesRollingHills',
    name: 'Batanes Rolling Hills',
    subtitle: 'Vast Undulating Meadows & Coastal Headlands',
    description: 'Sweeping emerald hills overlooking the sea, stone heritage shelters, grazing carabaos, and fresh brooks.',
    elevationScale: 9.0,
    buildingDensity: 0.15,
    treeDensity: 0.4,
    riverWidth: 12,
    riverColor: 0x06b6d4,
    terrainColor: 0x2d6a4f,
    rockColor: 0x64748b,
    animalCount: { carabaos: 8, eagles: 5, fish: 10 },
    treeTypes: ['narra', 'pine'],
  },
};

export interface WorldGenOptions {
  biome: BiomeId;
  seed: number;
  buildingDensityMult?: number;
  treeDensityMult?: number;
  riverWidthMult?: number;
  animalCountMult?: number;
}

// ---------------------------------------------------------------------------
// PSEUDO-RANDOM & NOISE HELPERS (Pure Math, Zero Dependencies)
// ---------------------------------------------------------------------------

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function noise2D(x: number, z: number, seed: number): number {
  const X = Math.floor(x);
  const Z = Math.floor(z);
  const fx = x - X;
  const fz = z - Z;

  // Smoothstep
  const u = fx * fx * (3 - 2 * fx);
  const v = fz * fz * (3 - 2 * fz);

  const n00 = pseudoRandom(X + Z * 57 + seed * 131);
  const n10 = pseudoRandom(X + 1 + Z * 57 + seed * 131);
  const n01 = pseudoRandom(X + (Z + 1) * 57 + seed * 131);
  const n11 = pseudoRandom(X + 1 + (Z + 1) * 57 + seed * 131);

  const nx0 = n00 * (1 - u) + n10 * u;
  const nx1 = n01 * (1 - u) + n11 * u;
  return nx0 * (1 - v) + nx1 * v;
}

function fbm2D(x: number, z: number, octaves: number, seed: number): number {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let max = 0;

  for (let i = 0; i < octaves; i++) {
    value += noise2D(x * frequency, z * frequency, seed + i * 17) * amplitude;
    max += amplitude;
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  return value / max;
}

// ---------------------------------------------------------------------------
// HEIGHTMAP SAMPLER WITH GENESIS PLAZA TERRACE & RIVER CARVING
// ---------------------------------------------------------------------------

export class TerranianWorldEngine {
  public options: WorldGenOptions;
  public biome: BiomeConfig;
  public worldGroup: THREE.Group;
  public animatedWaterMesh: THREE.Mesh | null = null;
  public carabaos: THREE.Group[] = [];
  public eagles: THREE.Group[] = [];
  public fishes: THREE.Group[] = [];
  private riverPoints: THREE.Vector2[] = [];

  constructor(options: WorldGenOptions) {
    this.options = options;
    this.biome = BIOME_PRESETS[options.biome] || BIOME_PRESETS.cyberManila;
    this.worldGroup = new THREE.Group();
    this.worldGroup.name = 'TerranianProceduralWorld';
    this.initRiverCurve();
  }

  /**
   * Initializes a procedural river spline path traversing the landscape.
   */
  private initRiverCurve() {
    this.riverPoints = [];
    const seed = this.options.seed;
    const numPoints = 12;
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const x = (t - 0.5) * 360; // span -180 to 180
      // Curvature variation
      const curveOffset =
        Math.sin(t * Math.PI * 2.5 + seed) * 45 +
        Math.cos(t * Math.PI * 1.5 + seed * 2) * 25;
      // Push river far enough away from Genesis Plaza center (0, 0)
      const plazaClearance = Math.exp(-Math.pow(x / 40, 2)) * 38;
      const z = curveOffset + (curveOffset >= 0 ? plazaClearance : -plazaClearance) + 40;
      this.riverPoints.push(new THREE.Vector2(x, z));
    }
  }

  /**
   * Calculates distance to nearest point on the river centerline.
   */
  public getDistanceToRiver(x: number, z: number): { dist: number; riverY: number; closestPt: THREE.Vector2 } {
    let minDistSq = Infinity;
    let closestPt = this.riverPoints[0];

    for (let i = 0; i < this.riverPoints.length - 1; i++) {
      const p1 = this.riverPoints[i];
      const p2 = this.riverPoints[i + 1];

      const seg = new THREE.Vector2().subVectors(p2, p1);
      const segLenSq = seg.lengthSq();
      if (segLenSq === 0) continue;

      const pt = new THREE.Vector2(x, z);
      const toPt = new THREE.Vector2().subVectors(pt, p1);
      const t = Math.max(0, Math.min(1, toPt.dot(seg) / segLenSq));
      const proj = new THREE.Vector2().copy(p1).addScaledVector(seg, t);

      const distSq = pt.distanceToSquared(proj);
      if (distSq < minDistSq) {
        minDistSq = distSq;
        closestPt = proj;
      }
    }

    return {
      dist: Math.sqrt(minDistSq),
      riverY: -1.2,
      closestPt,
    };
  }

  /**
   * Continuous procedural terrain height function.
   * Keeps Genesis Central Plaza (radius 35m) flat at Y = 0.
   */
  public sampleTerrainHeight(x: number, z: number): number {
    const distFromPlaza = Math.sqrt(x * x + z * z);

    // 1. Genesis Plaza Terrace: completely flat within 32m, smooth transition out to 52m
    const plazaWeight = Math.min(1, Math.max(0, (distFromPlaza - 32) / 20));
    if (plazaWeight <= 0.001) {
      return 0.0;
    }

    // 2. Base Procedural Elevation via Multi-Octave fBm
    const seed = this.options.seed;
    const scale = 0.0065;
    const rawFbm = fbm2D(x * scale, z * scale, 4, seed);
    const elevScale = this.biome.elevationScale;
    let baseHeight = (rawFbm - 0.42) * elevScale * 2.0;

    // 3. River Channel Carving
    const river = this.getDistanceToRiver(x, z);
    const riverHalfWidth = (this.biome.riverWidth * (this.options.riverWidthMult || 1.0)) * 0.5;
    const riverBankZone = riverHalfWidth + 12;

    if (river.dist < riverBankZone) {
      const t = river.dist / riverBankZone;
      const smoothT = t * t * (3 - 2 * t);
      baseHeight = THREE.MathUtils.lerp(-1.8, baseHeight, smoothT);
    }

    return baseHeight * plazaWeight;
  }

  // -------------------------------------------------------------------------
  // GENERATE FULL 3D WORLD
  // -------------------------------------------------------------------------

  public generate(): THREE.Group {
    this.createTerrainMesh();
    this.createRiverWaterMesh();
    this.createProceduralBuildings();
    this.createInstancedTrees();
    this.createLivingFauna();
    return this.worldGroup;
  }

  // -------------------------------------------------------------------------
  // 1. TERRAIN MESH
  // -------------------------------------------------------------------------
  private createTerrainMesh() {
    const size = 380;
    const segments = 120;
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    geometry.rotateX(-Math.PI / 2);

    const pos = geometry.attributes.position;
    const colors: number[] = [];
    const color = new THREE.Color();
    const grassColor = new THREE.Color(this.biome.terrainColor);
    const rockColor = new THREE.Color(this.biome.rockColor);
    const sandColor = new THREE.Color(0xd4a373);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = this.sampleTerrainHeight(x, z);
      pos.setY(i, y);

      const riverInfo = this.getDistanceToRiver(x, z);
      const riverHalfWidth = this.biome.riverWidth * 0.5;

      if (riverInfo.dist < riverHalfWidth + 4 && y < 0.5) {
        color.copy(sandColor);
      } else if (y > this.biome.elevationScale * 0.7) {
        color.copy(rockColor);
      } else {
        color.copy(grassColor);
        color.offsetHSL((pseudoRandom(i) - 0.5) * 0.05, 0, (pseudoRandom(i * 3) - 0.5) * 0.08);
      }
      colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.1,
      flatShading: true,
    });

    const terrainMesh = new THREE.Mesh(geometry, material);
    terrainMesh.receiveShadow = true;
    terrainMesh.name = 'TerranianGroundMesh';
    this.worldGroup.add(terrainMesh);
  }

  // -------------------------------------------------------------------------
  // 2. RIVER WATER SURFACE MESH
  // -------------------------------------------------------------------------
  private createRiverWaterMesh() {
    const width = this.biome.riverWidth * (this.options.riverWidthMult || 1.0);
    const curve = new THREE.CatmullRomCurve3(
      this.riverPoints.map((pt) => new THREE.Vector3(pt.x, -0.6, pt.y))
    );

    const ribbonSegments = 160;
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const tangent = new THREE.Vector3();
    const normal = new THREE.Vector3(0, 1, 0);
    const binormal = new THREE.Vector3();

    for (let i = 0; i <= ribbonSegments; i++) {
      const t = i / ribbonSegments;
      const pt = curve.getPointAt(t);
      curve.getTangentAt(t, tangent).normalize();
      binormal.crossVectors(tangent, normal).normalize();

      const left = pt.clone().addScaledVector(binormal, -width * 0.55);
      const right = pt.clone().addScaledVector(binormal, width * 0.55);

      positions.push(left.x, left.y, left.z);
      positions.push(right.x, right.y, right.z);

      uvs.push(0, t * 12);
      uvs.push(1, t * 12);

      if (i < ribbonSegments) {
        const base = i * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
      }
    }

    const waterGeo = new THREE.BufferGeometry();
    waterGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    waterGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    waterGeo.setIndex(indices);
    waterGeo.computeVertexNormals();

    const waterMat = new THREE.MeshStandardMaterial({
      color: this.biome.riverColor,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.82,
      side: THREE.DoubleSide,
    });

    this.animatedWaterMesh = new THREE.Mesh(waterGeo, waterMat);
    this.animatedWaterMesh.name = 'TerranianRiverWater';
    this.worldGroup.add(this.animatedWaterMesh);

    this.createRiverBridges(curve);
  }

  private createRiverBridges(riverCurve: THREE.CatmullRomCurve3) {
    const bridgePositions = [0.35, 0.7];
    bridgePositions.forEach((t) => {
      const pt = riverCurve.getPointAt(t);
      const tangent = riverCurve.getTangentAt(t).normalize();

      const bridgeGroup = new THREE.Group();
      bridgeGroup.position.copy(pt);
      bridgeGroup.position.y += 0.8;

      const deckGeo = new THREE.BoxGeometry(this.biome.riverWidth * 1.35, 0.6, 7.5);
      const deckMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.6,
        metalness: 0.4,
      });
      const deckMesh = new THREE.Mesh(deckGeo, deckMat);
      deckMesh.rotation.y = Math.atan2(tangent.x, tangent.z);

      const railMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.25,
      });
      const rail1 = new THREE.Mesh(new THREE.BoxGeometry(this.biome.riverWidth * 1.35, 0.5, 0.25), railMat);
      rail1.position.set(0, 0.5, 3.6);
      rail1.rotation.y = deckMesh.rotation.y;
      const rail2 = rail1.clone();
      rail2.position.set(0, 0.5, -3.6);

      bridgeGroup.add(deckMesh, rail1, rail2);
      this.worldGroup.add(bridgeGroup);
    });
  }

  // -------------------------------------------------------------------------
  // 3. PROCEDURAL BUILDINGS
  // -------------------------------------------------------------------------
  private createProceduralBuildings() {
    const density = this.biome.buildingDensity * (this.options.buildingDensityMult || 1.0);
    const count = Math.floor(density * 55);
    const seed = this.options.seed;

    const buildingGroup = new THREE.Group();
    buildingGroup.name = 'TerranianBuildingsGroup';

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.15,
      metalness: 0.9,
      emissive: 0x0284c7,
      emissiveIntensity: 0.15,
    });

    const masonryMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.8,
      metalness: 0.2,
    });

    const trimMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.6,
    });

    for (let i = 0; i < count; i++) {
      const r = 45 + pseudoRandom(i * 11 + seed) * 125;
      const theta = pseudoRandom(i * 7 + seed) * Math.PI * 2;
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;

      const riverInfo = this.getDistanceToRiver(x, z);
      if (riverInfo.dist < this.biome.riverWidth * 0.75) continue;

      const groundY = this.sampleTerrainHeight(x, z);
      const isSkyscraper = pseudoRandom(i * 13 + seed) > 0.45 && this.biome.id === 'cyberManila';
      const width = 10 + pseudoRandom(i * 5 + seed) * 12;
      const depth = 10 + pseudoRandom(i * 9 + seed) * 12;
      const height = isSkyscraper
        ? 32 + pseudoRandom(i * 17 + seed) * 45
        : 8 + pseudoRandom(i * 17 + seed) * 16;

      const bldg = new THREE.Group();
      bldg.position.set(x, groundY + height * 0.5, z);

      const bldgGeo = new THREE.BoxGeometry(width, height, depth);
      const bldgMesh = new THREE.Mesh(bldgGeo, isSkyscraper ? glassMat : masonryMat);
      bldgMesh.castShadow = true;
      bldgMesh.receiveShadow = true;
      bldg.add(bldgMesh);

      if (isSkyscraper) {
        const trimMesh = new THREE.Mesh(new THREE.BoxGeometry(width + 0.3, 0.8, depth + 0.3), trimMat);
        trimMesh.position.y = height * 0.3;
        const roofTrim = new THREE.Mesh(new THREE.BoxGeometry(width + 0.3, 0.8, depth + 0.3), trimMat);
        roofTrim.position.y = height * 0.5;
        bldg.add(trimMesh, roofTrim);

        const spire = new THREE.Mesh(
          new THREE.CylinderGeometry(0.1, 0.4, 8, 8),
          new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 0.8 })
        );
        spire.position.y = height * 0.5 + 4;
        bldg.add(spire);
      }

      buildingGroup.add(bldg);
    }

    this.worldGroup.add(buildingGroup);
  }

  // -------------------------------------------------------------------------
  // 4. INSTANCED TREES & VEGETATION (Coconut Palms, Baguio Pines, Narra)
  // -------------------------------------------------------------------------
  private createInstancedTrees() {
    const density = this.biome.treeDensity * (this.options.treeDensityMult || 1.0);
    const totalTrees = Math.floor(density * 180);
    const seed = this.options.seed;

    const palmCrownGeo = new THREE.ConeGeometry(3.2, 1.8, 7);
    palmCrownGeo.translate(0, 5.5, 0);

    const pineCone1 = new THREE.ConeGeometry(2.5, 3.5, 6);
    pineCone1.translate(0, 4.5, 0);

    const narraCanopyGeo = new THREE.SphereGeometry(3.6, 7, 7);
    narraCanopyGeo.translate(0, 5.2, 0);

    let foliageGeo: THREE.BufferGeometry;
    let leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });

    if (this.biome.treeTypes.includes('pine')) {
      foliageGeo = pineCone1;
      leafMat.color.setHex(0x14532d);
    } else if (this.biome.treeTypes.includes('palm')) {
      foliageGeo = palmCrownGeo;
      leafMat.color.setHex(0x22c55e);
    } else {
      foliageGeo = narraCanopyGeo;
      leafMat.color.setHex(0x16a34a);
    }

    const treeMesh = new THREE.InstancedMesh(foliageGeo, leafMat, totalTrees);
    const dummy = new THREE.Object3D();
    let placed = 0;

    for (let i = 0; i < totalTrees * 2 && placed < totalTrees; i++) {
      const r = 38 + pseudoRandom(i * 19 + seed) * 140;
      const theta = pseudoRandom(i * 23 + seed) * Math.PI * 2;
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;

      const riverInfo = this.getDistanceToRiver(x, z);
      if (riverInfo.dist < this.biome.riverWidth * 0.6) continue;

      const groundY = this.sampleTerrainHeight(x, z);
      const scale = 0.8 + pseudoRandom(i * 31 + seed) * 0.6;

      dummy.position.set(x, groundY, z);
      dummy.rotation.y = pseudoRandom(i * 37 + seed) * Math.PI * 2;
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();

      treeMesh.setMatrixAt(placed, dummy.matrix);
      placed++;
    }

    treeMesh.instanceMatrix.needsUpdate = true;
    treeMesh.castShadow = true;
    treeMesh.receiveShadow = true;
    treeMesh.name = 'TerranianInstancedTrees';
    this.worldGroup.add(treeMesh);
  }

  // -------------------------------------------------------------------------
  // 5. LIVING FAUNA (Philippine Carabao, Philippine Eagle, River Fish)
  // -------------------------------------------------------------------------
  private createLivingFauna() {
    this.carabaos = [];
    this.eagles = [];
    this.fishes = [];

    const seed = this.options.seed;
    const animalCounts = {
      carabaos: Math.floor(this.biome.animalCount.carabaos * (this.options.animalCountMult || 1.0)),
      eagles: Math.floor(this.biome.animalCount.eagles * (this.options.animalCountMult || 1.0)),
      fish: Math.floor(this.biome.animalCount.fish * (this.options.animalCountMult || 1.0)),
    };

    // A. Philippine Carabao (Water Buffalo)
    for (let i = 0; i < animalCounts.carabaos; i++) {
      const carabao = this.buildCarabaoModel();
      const t = (i + 0.5) / animalCounts.carabaos;
      const pt = this.riverPoints[Math.floor(t * (this.riverPoints.length - 1))];
      const offsetX = (pseudoRandom(i * 41 + seed) - 0.5) * 24 + 14;
      const offsetZ = (pseudoRandom(i * 43 + seed) - 0.5) * 24 + 14;
      const x = pt.x + offsetX;
      const z = pt.y + offsetZ;
      const y = this.sampleTerrainHeight(x, z);

      carabao.position.set(x, y, z);
      carabao.rotation.y = pseudoRandom(i * 47 + seed) * Math.PI * 2;
      carabao.userData = {
        baseX: x,
        baseZ: z,
        phase: pseudoRandom(i * 53 + seed) * Math.PI * 2,
        idleTimer: 0,
      };

      this.carabaos.push(carabao);
      this.worldGroup.add(carabao);
    }

    // B. Philippine Eagle (Haribon / Agila)
    for (let i = 0; i < animalCounts.eagles; i++) {
      const eagle = this.buildEagleModel();
      const radius = 60 + i * 28;
      const altitude = 28 + i * 8;
      eagle.position.set(0, altitude, 0);
      eagle.userData = {
        radius,
        altitude,
        speed: 0.35 + i * 0.08,
        angle: (i / animalCounts.eagles) * Math.PI * 2,
      };

      this.eagles.push(eagle);
      this.worldGroup.add(eagle);
    }

    // C. River Fish (Schooling Koi)
    for (let i = 0; i < animalCounts.fish; i++) {
      const fish = this.buildFishModel();
      const t = (i / animalCounts.fish);
      fish.userData = {
        t,
        speed: 0.0004 + (pseudoRandom(i * 59 + seed) - 0.5) * 0.0002,
        swimPhase: pseudoRandom(i * 61 + seed) * Math.PI * 2,
      };

      this.fishes.push(fish);
      this.worldGroup.add(fish);
    }
  }

  private buildCarabaoModel(): THREE.Group {
    const carabao = new THREE.Group();
    const hideMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.8 });
    const hornMat = new THREE.MeshStandardMaterial({ color: 0xf4f4f5, roughness: 0.3, metalness: 0.6 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 1.3), hideMat);
    body.position.y = 1.2;

    const legGeo = new THREE.BoxGeometry(0.35, 0.9, 0.35);
    const legFL = new THREE.Mesh(legGeo, hideMat);
    legFL.position.set(0.7, 0.45, 0.45);
    const legFR = new THREE.Mesh(legGeo, hideMat);
    legFR.position.set(0.7, 0.45, -0.45);
    const legBL = new THREE.Mesh(legGeo, hideMat);
    legBL.position.set(-0.7, 0.45, 0.45);
    const legBR = new THREE.Mesh(legGeo, hideMat);
    legBR.position.set(-0.7, 0.45, -0.45);

    const headGroup = new THREE.Group();
    headGroup.name = 'CarabaoHead';
    headGroup.position.set(1.2, 1.4, 0);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.7), hideMat);
    head.position.set(0.3, 0, 0);

    const hornL = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.09, 6, 12, Math.PI * 0.8), hornMat);
    hornL.position.set(0.1, 0.35, 0.4);
    hornL.rotation.set(0, Math.PI * 0.4, Math.PI * 0.3);

    const hornR = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.09, 6, 12, Math.PI * 0.8), hornMat);
    hornR.position.set(0.1, 0.35, -0.4);
    hornR.rotation.set(0, -Math.PI * 0.4, -Math.PI * 0.3);

    headGroup.add(head, hornL, hornR);

    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.8, 5), hideMat);
    tail.name = 'CarabaoTail';
    tail.position.set(-1.25, 1.1, 0);
    tail.rotation.z = Math.PI * 0.25;

    carabao.add(body, legFL, legFR, legBL, legBR, headGroup, tail);
    carabao.scale.set(0.9, 0.9, 0.9);
    return carabao;
  }

  private buildEagleModel(): THREE.Group {
    const eagle = new THREE.Group();
    const featherMat = new THREE.MeshStandardMaterial({ color: 0x3f2e1e, roughness: 0.7 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 });
    const beakMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3, metalness: 0.5 });

    const body = new THREE.Mesh(new THREE.ConeGeometry(0.4, 2.2, 6), featherMat);
    body.rotation.x = Math.PI * 0.5;

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 6, 6), whiteMat);
    head.position.set(0, 0.2, 1.1);
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.5, 5), beakMat);
    beak.position.set(0, -0.05, 1.45);
    beak.rotation.x = Math.PI * 0.5;

    const leftWing = new THREE.Group();
    leftWing.name = 'EagleWingL';
    leftWing.position.set(0.3, 0.1, 0.3);
    const wingLMesh = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.06, 0.9), featherMat);
    wingLMesh.position.set(1.2, 0, 0);
    leftWing.add(wingLMesh);

    const rightWing = new THREE.Group();
    rightWing.name = 'EagleWingR';
    rightWing.position.set(-0.3, 0.1, 0.3);
    const wingRMesh = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.06, 0.9), featherMat);
    wingRMesh.position.set(-1.2, 0, 0);
    rightWing.add(wingRMesh);

    const tailFan = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.04, 0.8), whiteMat);
    tailFan.position.set(0, 0.05, -1.2);

    eagle.add(body, head, beak, leftWing, rightWing, tailFan);
    eagle.scale.set(1.2, 1.2, 1.2);
    return eagle;
  }

  private buildFishModel(): THREE.Group {
    const fish = new THREE.Group();
    const fishMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xf97316,
      emissiveIntensity: 0.3,
      roughness: 0.2,
      metalness: 0.8,
    });

    const body = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.9, 6), fishMat);
    body.rotation.x = Math.PI * 0.5;

    const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.35, 0.3), fishMat);
    tailFin.name = 'FishTail';
    tailFin.position.set(0, 0, -0.5);

    fish.add(body, tailFin);
    fish.scale.set(0.75, 0.75, 0.75);
    return fish;
  }

  // -------------------------------------------------------------------------
  // ANIMATION TICK (WAVES, CARABAOS, EAGLES, FISH)
  // -------------------------------------------------------------------------
  public update(delta: number, elapsed: number) {
    // 1. Water Wave Motion
    if (this.animatedWaterMesh) {
      const uvs = this.animatedWaterMesh.geometry.attributes.uv;
      if (uvs) {
        for (let i = 0; i < uvs.count; i++) {
          const v = uvs.getY(i);
          uvs.setY(i, (v + delta * 0.25) % 12);
        }
        uvs.needsUpdate = true;
      }
    }

    // 2. Animate Soaring Philippine Eagles
    this.eagles.forEach((eagle) => {
      const u = eagle.userData;
      u.angle += delta * u.speed * 0.25;

      const x = Math.cos(u.angle) * u.radius;
      const z = Math.sin(u.angle) * u.radius;
      const y = u.altitude + Math.sin(elapsed * 0.8 + u.angle) * 2.5;

      eagle.position.set(x, y, z);
      eagle.rotation.y = -u.angle + Math.PI * 0.5;
      eagle.rotation.z = -0.22;

      const flap = Math.sin(elapsed * 4.0) * 0.25;
      const wingL = eagle.getObjectByName('EagleWingL');
      const wingR = eagle.getObjectByName('EagleWingR');
      if (wingL && wingR) {
        wingL.rotation.z = flap;
        wingR.rotation.z = -flap;
      }
    });

    // 3. Animate Grazing Carabaos
    this.carabaos.forEach((carabao) => {
      const head = carabao.getObjectByName('CarabaoHead');
      const tail = carabao.getObjectByName('CarabaoTail');
      const phase = carabao.userData.phase;

      if (head) {
        head.rotation.x = 0.25 + Math.sin(elapsed * 0.6 + phase) * 0.2;
        head.rotation.y = Math.sin(elapsed * 0.3 + phase * 2) * 0.25;
      }
      if (tail) {
        tail.rotation.y = Math.sin(elapsed * 3.5 + phase) * 0.5;
      }
    });

    // 4. Animate Schooling River Fish
    if (this.riverPoints.length > 1) {
      this.fishes.forEach((fish) => {
        const u = fish.userData;
        u.t = (u.t + delta * u.speed) % 1.0;

        const idxFloat = u.t * (this.riverPoints.length - 1);
        const idx = Math.floor(idxFloat);
        const nextIdx = Math.min(this.riverPoints.length - 1, idx + 1);
        const frac = idxFloat - idx;

        const p1 = this.riverPoints[idx];
        const p2 = this.riverPoints[nextIdx];

        const x = THREE.MathUtils.lerp(p1.x, p2.x, frac);
        const z = THREE.MathUtils.lerp(p1.y, p2.y, frac);
        const lateral = Math.sin(elapsed * 4.0 + u.swimPhase) * 1.5;

        fish.position.set(x + lateral, -0.9, z);
        fish.rotation.y = Math.atan2(p2.x - p1.x, p2.y - p1.y);

        const tail = fish.getObjectByName('FishTail');
        if (tail) {
          tail.rotation.y = Math.sin(elapsed * 8.0 + u.swimPhase) * 0.6;
        }
      });
    }
  }

  public dispose() {
    this.worldGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else if (mesh.material) {
          mesh.material.dispose();
        }
      }
    });
    this.worldGroup.clear();
  }
}
