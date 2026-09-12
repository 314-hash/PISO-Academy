/**
 * MonsterSpawnEngine.ts
 * 3D Procedural Monster Engine for PISO Metaverse.
 * Spawns Giga Buwaya Titans (bipedal crocodiles in Barong Tagalog & military capes)
 * and small monster farms (Highland Cobras, Sky Vultures, Canyon Komodos, Cyber Hyenas).
 * Enforces strict level-gating (Lv. 20+ required for Giants) and tax return token rewards.
 */

import * as THREE from 'three';
import { PlayerStatsEngine } from './PlayerStatsEngine';
import { SoundFX } from './soundFX';

export type MonsterType = 'croc_titan' | 'snake' | 'vulture' | 'komodo' | 'hyena';

export interface MonsterEntity {
  id: string;
  name: string;
  type: MonsterType;
  level: number;
  minPlayerLevel: number;
  currentHp: number;
  maxHp: number;
  atk: number;
  def: number;
  bountyPiso: number;
  expReward: number;
  isBoss: boolean;
  spawnPos: THREE.Vector3;
  mesh: THREE.Group;
  billboardSprite: THREE.Sprite;
  billboardCanvas: HTMLCanvasElement;
  billboardCtx: CanvasRenderingContext2D;
  billboardTexture: THREE.CanvasTexture;
  isAlive: boolean;
  respawnTimer: number;
  animPhase: number;
  capeMesh?: THREE.Mesh;
  jawMesh?: THREE.Group;
  tailMesh?: THREE.Group;
  wingsMesh?: THREE.Group;
}

export interface HitResult {
  monsterId: string;
  monsterName: string;
  isBoss: boolean;
  allowed: boolean;
  damage: number;
  isCrit: boolean;
  remainingHp: number;
  slain: boolean;
  bountyPiso: number;
  expReward: number;
  message?: string;
  position: THREE.Vector3;
}

export interface FloatingTextParticle {
  id: number;
  mesh: THREE.Sprite;
  startPos: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

export interface TaxReturnCoin {
  mesh: THREE.Mesh;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  rotSpeed: THREE.Vector3;
  life: number;
}

export class MonsterSpawnEngine {
  private scene: THREE.Scene;
  public monsters: MonsterEntity[] = [];
  private floatingTexts: FloatingTextParticle[] = [];
  private taxCoins: TaxReturnCoin[] = [];
  private nextTextId = 0;
  private coinGeometry: THREE.CylinderGeometry;
  private coinMaterial: THREE.MeshStandardMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.coinGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 16);
    this.coinMaterial = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0xd97706,
      emissiveIntensity: 0.3,
    });

    this.spawnInitialBestiary();
  }

  /**
   * Spawns all world monsters across the 380m terrain.
   */
  private spawnInitialBestiary() {
    // 1. GIGA BUWAYA TITANS (Level 20+ strictly required)
    this.monsters.push(
      this.createBuwayaTitan(
        'titan-1',
        'Senator Buwaya Croc',
        25,
        20, // Min level
        45000,
        12500,
        6500,
        new THREE.Vector3(75, 0, -65),
        1.15
      ),
      this.createBuwayaTitan(
        'titan-2',
        'Admiral General Buwaya',
        35,
        25, // Min level
        95000,
        28000,
        15000,
        new THREE.Vector3(-95, 0, -110),
        1.35
      ),
      this.createBuwayaTitan(
        'titan-3',
        'Supreme Oligarch Buwaya',
        50,
        30, // Min level
        250000,
        50000,
        40000,
        new THREE.Vector3(125, 0, 105),
        1.65
      )
    );

    // 2. HIGHLAND COBRAS (Level 1+ Rookie Farm)
    const cobraSpawns = [
      new THREE.Vector3(-25, 0, 35),
      new THREE.Vector3(-35, 0, 48),
      new THREE.Vector3(-15, 0, 52),
      new THREE.Vector3(-42, 0, 28),
      new THREE.Vector3(-20, 0, 42),
    ];
    cobraSpawns.forEach((pos, idx) => {
      this.monsters.push(
        this.createCobra(`cobra-${idx + 1}`, `Highland Cobra #${idx + 1}`, 3, 1, 950, 12, 55, pos)
      );
    });

    // 3. SKY VULTURES (Level 5+ Farm)
    const vultureSpawns = [
      new THREE.Vector3(45, 6, 40),
      new THREE.Vector3(60, 7, 55),
      new THREE.Vector3(35, 6.5, 70),
      new THREE.Vector3(55, 6.2, 85),
    ];
    vultureSpawns.forEach((pos, idx) => {
      this.monsters.push(
        this.createVulture(`vulture-${idx + 1}`, `Sky Vulture Scavenger #${idx + 1}`, 7, 5, 3200, 35, 160, pos)
      );
    });

    // 4. CANYON KOMODOS / BAYAWAK (Level 10+ Intermediate Farm)
    const komodoSpawns = [
      new THREE.Vector3(-80, 0, 30),
      new THREE.Vector3(-95, 0, 45),
      new THREE.Vector3(-110, 0, 20),
    ];
    komodoSpawns.forEach((pos, idx) => {
      this.monsters.push(
        this.createKomodo(`komodo-${idx + 1}`, `Canyon Bayawak #${idx + 1}`, 12, 10, 8500, 95, 420, pos)
      );
    });

    // 5. MOUNTAIN ASKAL / CYBER HYENAS (Level 15+ Advanced Farm)
    const hyenaSpawns = [
      new THREE.Vector3(10, 0, -85),
      new THREE.Vector3(25, 0, -98),
      new THREE.Vector3(-15, 0, -92),
    ];
    hyenaSpawns.forEach((pos, idx) => {
      this.monsters.push(
        this.createHyena(`hyena-${idx + 1}`, `Cyber Mountain Askal #${idx + 1}`, 17, 15, 18000, 240, 950, pos)
      );
    });

    // Add all monster meshes to the scene
    this.monsters.forEach((m) => {
      this.scene.add(m.mesh);
    });
  }

  // =========================================================================
  // PROCEDURAL 3D MESH GENERATION
  // =========================================================================

  /**
   * Procedural Giga Buwaya Titan:
   * Bipedal crocodile wearing cream embroidered Barong Tagalog and blue naval cape with golden epaulets.
   */
  private createBuwayaTitan(
    id: string,
    name: string,
    level: number,
    minPlayerLevel: number,
    maxHp: number,
    bountyPiso: number,
    expReward: number,
    pos: THREE.Vector3,
    scaleFactor: number
  ): MonsterEntity {
    const group = new THREE.Group();
    group.position.copy(pos);
    group.scale.set(scaleFactor, scaleFactor, scaleFactor);

    // Materials
    const scalyGreenMat = new THREE.MeshStandardMaterial({
      color: 0x1c3822,
      roughness: 0.75,
      metalness: 0.15,
    });
    const bellyMat = new THREE.MeshStandardMaterial({
      color: 0x4a6332,
      roughness: 0.8,
    });
    const barongCreamMat = new THREE.MeshStandardMaterial({
      color: 0xfdfaf1,
      roughness: 0.6,
      metalness: 0.1,
    });
    const capeNavyMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a,
      roughness: 0.5,
      side: THREE.DoubleSide,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.85,
      roughness: 0.25,
      emissive: 0xd97706,
      emissiveIntensity: 0.25,
    });
    const teethMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
    });
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xeab308,
      emissiveIntensity: 0.8,
    });

    // 1. Lower Legs & Bipedal Claws
    const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 3.2, 8), scalyGreenMat);
    leftLeg.position.set(-1.1, 1.6, 0);
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 3.2, 8), scalyGreenMat);
    rightLeg.position.set(1.1, 1.6, 0);
    group.add(rightLeg);

    // Massive reptilian foot claws
    const leftFoot = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.4, 1.6), scalyGreenMat);
    leftFoot.position.set(-1.1, 0.2, 0.5);
    group.add(leftFoot);

    const rightFoot = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.4, 1.6), scalyGreenMat);
    rightFoot.position.set(1.1, 0.2, 0.5);
    group.add(rightFoot);

    // 2. Torso (Wearing Embroidered Barong Tagalog)
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.3, 4.0, 10), barongCreamMat);
    torso.position.set(0, 4.8, 0);
    group.add(torso);

    // Barong center placket & golden embroidery line
    const placket = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.5, 0.1), goldMat);
    placket.position.set(0, 4.9, 1.4);
    group.add(placket);

    // Barong traditional high collar (Pintados / Mandarin collar)
    const collar = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.18, 8, 16), barongCreamMat);
    collar.rotation.x = Math.PI / 2;
    collar.position.set(0, 6.7, 0);
    group.add(collar);

    // Golden Corrupt Official Medal & Sash
    const sash = new THREE.Mesh(new THREE.CylinderGeometry(1.65, 1.35, 0.5, 10), goldMat);
    sash.rotation.z = 0.35;
    sash.position.set(0, 4.8, 0);
    group.add(sash);

    // 3. Crocodile Head & Menacing Jaws
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 7.2, 0.3);

    // Upper Cranium & Snout
    const upperSnout = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.85, 2.6), scalyGreenMat);
    upperSnout.position.set(0, 0.2, 1.2);
    headGroup.add(upperSnout);

    // Upper sharp white conical teeth
    for (let i = -0.5; i <= 0.5; i += 0.25) {
      const toothL = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.3, 5), teethMat);
      toothL.rotation.x = Math.PI;
      toothL.position.set(i, -0.25, 0.2 + (i + 0.5) * 1.5);
      upperSnout.add(toothL);
    }

    // Glowing reptilian eyes
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), eyeMat);
    eyeL.position.set(-0.6, 0.6, 0.4);
    headGroup.add(eyeL);

    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), eyeMat);
    eyeR.position.set(0.6, 0.6, 0.4);
    headGroup.add(eyeR);

    // Animated Lower Jaw
    const jawGroup = new THREE.Group();
    jawGroup.position.set(0, -0.3, 0.2);
    const lowerJaw = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.4, 2.4), bellyMat);
    lowerJaw.position.set(0, -0.2, 1.1);
    jawGroup.add(lowerJaw);
    headGroup.add(jawGroup);

    group.add(headGroup);

    // 4. Arms & Claws
    const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.35, 2.8, 8), scalyGreenMat);
    leftArm.position.set(-2.0, 5.0, 0.4);
    leftArm.rotation.z = 0.4;
    leftArm.rotation.x = -0.3;
    group.add(leftArm);

    const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.35, 2.8, 8), scalyGreenMat);
    rightArm.position.set(2.0, 5.0, 0.4);
    rightArm.rotation.z = -0.4;
    rightArm.rotation.x = -0.3;
    group.add(rightArm);

    // 5. Golden Naval Epaulets & Officer Cape
    const epauletL = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.2, 8), goldMat);
    epauletL.position.set(-1.8, 6.7, 0);
    group.add(epauletL);

    const epauletR = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.2, 8), goldMat);
    epauletR.position.set(1.8, 6.7, 0);
    group.add(epauletR);

    // Cape mesh (flowing behind)
    const capeGeo = new THREE.PlaneGeometry(3.6, 6.2, 6, 8);
    const cape = new THREE.Mesh(capeGeo, capeNavyMat);
    cape.position.set(0, 3.6, -1.35);
    group.add(cape);

    // 6. Crocodile Heavy Counterbalance Tail
    const tailGroup = new THREE.Group();
    tailGroup.position.set(0, 3.0, -1.0);
    const tail1 = new THREE.Mesh(new THREE.ConeGeometry(0.9, 3.5, 8), scalyGreenMat);
    tail1.rotation.x = -Math.PI / 2.3;
    tail1.position.set(0, -0.6, -1.5);
    tailGroup.add(tail1);
    group.add(tailGroup);

    // 7. Billboard Health & Status HUD
    const { sprite, canvas, ctx, texture } = this.createBillboardHud(name, level, minPlayerLevel, true);
    sprite.position.set(0, 9.8, 0);
    group.add(sprite);

    return {
      id,
      name,
      type: 'croc_titan',
      level,
      minPlayerLevel,
      currentHp: maxHp,
      maxHp,
      atk: level * 85,
      def: level * 40,
      bountyPiso,
      expReward,
      isBoss: true,
      spawnPos: pos.clone(),
      mesh: group,
      billboardSprite: sprite,
      billboardCanvas: canvas,
      billboardCtx: ctx,
      billboardTexture: texture,
      isAlive: true,
      respawnTimer: 0,
      animPhase: Math.random() * Math.PI * 2,
      capeMesh: cape,
      jawMesh: jawGroup,
      tailMesh: tailGroup,
    };
  }

  /**
   * Procedural Highland Cobra:
   * Slithering S-curved serpent with flaring hood and glowing amber eyes.
   */
  private createCobra(
    id: string,
    name: string,
    level: number,
    minPlayerLevel: number,
    maxHp: number,
    bountyPiso: number,
    expReward: number,
    pos: THREE.Vector3
  ): MonsterEntity {
    const group = new THREE.Group();
    group.position.copy(pos);

    const snakeMat = new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.6,
      metalness: 0.2,
    });
    const bellyMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      roughness: 0.8,
    });
    const hoodMat = new THREE.MeshStandardMaterial({
      color: 0x166534,
      roughness: 0.5,
    });

    // Tail / Base coils
    for (let i = 0; i < 5; i++) {
      const seg = new THREE.Mesh(new THREE.SphereGeometry(0.35 - i * 0.04, 8, 8), snakeMat);
      seg.position.set(Math.sin(i * 0.8) * 0.4, 0.2, -i * 0.4);
      group.add(seg);
    }

    // Upright neck
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 1.4, 8), snakeMat);
    neck.position.set(0, 0.9, 0.1);
    group.add(neck);

    // Flaring Cobra Hood
    const hood = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.9, 0.1), hoodMat);
    hood.position.set(0, 1.0, 0.15);
    group.add(hood);

    // Snake Head
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.6, 6), snakeMat);
    head.rotation.x = Math.PI / 2;
    head.position.set(0, 1.6, 0.2);
    group.add(head);

    // Billboard HUD
    const { sprite, canvas, ctx, texture } = this.createBillboardHud(name, level, minPlayerLevel, false);
    sprite.position.set(0, 2.5, 0);
    group.add(sprite);

    return {
      id,
      name,
      type: 'snake',
      level,
      minPlayerLevel,
      currentHp: maxHp,
      maxHp,
      atk: level * 25,
      def: level * 10,
      bountyPiso,
      expReward,
      isBoss: false,
      spawnPos: pos.clone(),
      mesh: group,
      billboardSprite: sprite,
      billboardCanvas: canvas,
      billboardCtx: ctx,
      billboardTexture: texture,
      isAlive: true,
      respawnTimer: 0,
      animPhase: Math.random() * Math.PI * 2,
    };
  }

  /**
   * Procedural Sky Vulture:
   * Circling aerial predator with flapping dark wings and hooked beak.
   */
  private createVulture(
    id: string,
    name: string,
    level: number,
    minPlayerLevel: number,
    maxHp: number,
    bountyPiso: number,
    expReward: number,
    pos: THREE.Vector3
  ): MonsterEntity {
    const group = new THREE.Group();
    group.position.copy(pos);

    const featherMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.8,
    });
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      roughness: 0.7,
    });
    const beakMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.4,
    });

    // Body
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.4, 7), featherMat);
    body.rotation.x = Math.PI / 2.5;
    group.add(body);

    // Bare Head & Neck
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.6, 6), skinMat);
    neck.position.set(0, 0.3, 0.8);
    neck.rotation.x = 0.5;
    group.add(neck);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 6), skinMat);
    head.position.set(0, 0.5, 1.0);
    group.add(head);

    // Hooked Beak
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 4), beakMat);
    beak.rotation.x = Math.PI / 2.2;
    beak.position.set(0, 0.45, 1.2);
    group.add(beak);

    // Animated Wings
    const wingsGroup = new THREE.Group();
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.7), featherMat);
    wingL.position.set(-0.9, 0, 0.2);
    wingL.rotation.y = 0.2;
    wingsGroup.add(wingL);

    const wingR = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.7), featherMat);
    wingR.position.set(0.9, 0, 0.2);
    wingR.rotation.y = -0.2;
    wingsGroup.add(wingR);

    group.add(wingsGroup);

    // Billboard HUD
    const { sprite, canvas, ctx, texture } = this.createBillboardHud(name, level, minPlayerLevel, false);
    sprite.position.set(0, 2.0, 0);
    group.add(sprite);

    return {
      id,
      name,
      type: 'vulture',
      level,
      minPlayerLevel,
      currentHp: maxHp,
      maxHp,
      atk: level * 35,
      def: level * 15,
      bountyPiso,
      expReward,
      isBoss: false,
      spawnPos: pos.clone(),
      mesh: group,
      billboardSprite: sprite,
      billboardCanvas: canvas,
      billboardCtx: ctx,
      billboardTexture: texture,
      isAlive: true,
      respawnTimer: 0,
      animPhase: Math.random() * Math.PI * 2,
      wingsMesh: wingsGroup,
    };
  }

  /**
   * Procedural Canyon Komodo / Bayawak:
   * Low-slung armored quadruped monitor lizard.
   */
  private createKomodo(
    id: string,
    name: string,
    level: number,
    minPlayerLevel: number,
    maxHp: number,
    bountyPiso: number,
    expReward: number,
    pos: THREE.Vector3
  ): MonsterEntity {
    const group = new THREE.Group();
    group.position.copy(pos);

    const skinMat = new THREE.MeshStandardMaterial({
      color: 0x3f3f46,
      roughness: 0.8,
    });
    const yellowSpikesMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.6,
    });

    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 2.6), skinMat);
    body.position.set(0, 0.6, 0);
    group.add(body);

    // Dorsal Spikes
    for (let i = -0.8; i <= 0.8; i += 0.4) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 4), yellowSpikesMat);
      spike.position.set(0, 1.05, i);
      group.add(spike);
    }

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 1.2), skinMat);
    head.position.set(0, 0.65, 1.6);
    group.add(head);

    // 4 Splayed Reptile Legs
    const legGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.8, 6);
    const legFL = new THREE.Mesh(legGeo, skinMat);
    legFL.position.set(-0.7, 0.4, 0.9);
    legFL.rotation.z = 0.4;
    group.add(legFL);

    const legFR = new THREE.Mesh(legGeo, skinMat);
    legFR.position.set(0.7, 0.4, 0.9);
    legFR.rotation.z = -0.4;
    group.add(legFR);

    const legBL = new THREE.Mesh(legGeo, skinMat);
    legBL.position.set(-0.7, 0.4, -0.9);
    legBL.rotation.z = 0.4;
    group.add(legBL);

    const legBR = new THREE.Mesh(legGeo, skinMat);
    legBR.position.set(0.7, 0.4, -0.9);
    legBR.rotation.z = -0.4;
    group.add(legBR);

    // Billboard HUD
    const { sprite, canvas, ctx, texture } = this.createBillboardHud(name, level, minPlayerLevel, false);
    sprite.position.set(0, 2.3, 0);
    group.add(sprite);

    return {
      id,
      name,
      type: 'komodo',
      level,
      minPlayerLevel,
      currentHp: maxHp,
      maxHp,
      atk: level * 45,
      def: level * 25,
      bountyPiso,
      expReward,
      isBoss: false,
      spawnPos: pos.clone(),
      mesh: group,
      billboardSprite: sprite,
      billboardCanvas: canvas,
      billboardCtx: ctx,
      billboardTexture: texture,
      isAlive: true,
      respawnTimer: 0,
      animPhase: Math.random() * Math.PI * 2,
    };
  }

  /**
   * Procedural Mountain Askal / Cyber Hyena:
   * Fast quadruped predator with cybernetic red optics and spiked steel collar.
   */
  private createHyena(
    id: string,
    name: string,
    level: number,
    minPlayerLevel: number,
    maxHp: number,
    bountyPiso: number,
    expReward: number,
    pos: THREE.Vector3
  ): MonsterEntity {
    const group = new THREE.Group();
    group.position.copy(pos);

    const furMat = new THREE.MeshStandardMaterial({
      color: 0x713f12,
      roughness: 0.9,
    });
    const cyberEyeMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 0.9,
    });
    const collarMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.8,
      roughness: 0.3,
    });

    // Sloped Hyena Body
    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 1.2), furMat);
    chest.position.set(0, 1.1, 0.4);
    group.add(chest);

    const hindquarters = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.8, 1.0), furMat);
    hindquarters.position.set(0, 0.8, -0.6);
    group.add(hindquarters);

    // Collar
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.2, 8), collarMat);
    collar.position.set(0, 1.4, 1.0);
    collar.rotation.x = Math.PI / 4;
    group.add(collar);

    // Snouted Head with Cyber Optics
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.9, 6), furMat);
    head.position.set(0, 1.6, 1.3);
    head.rotation.x = Math.PI / 2.6;
    group.add(head);

    const cyberEye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), cyberEyeMat);
    cyberEye.position.set(0.18, 1.7, 1.4);
    group.add(cyberEye);

    // Billboard HUD
    const { sprite, canvas, ctx, texture } = this.createBillboardHud(name, level, minPlayerLevel, false);
    sprite.position.set(0, 2.7, 0);
    group.add(sprite);

    return {
      id,
      name,
      type: 'hyena',
      level,
      minPlayerLevel,
      currentHp: maxHp,
      maxHp,
      atk: level * 60,
      def: level * 30,
      bountyPiso,
      expReward,
      isBoss: false,
      spawnPos: pos.clone(),
      mesh: group,
      billboardSprite: sprite,
      billboardCanvas: canvas,
      billboardCtx: ctx,
      billboardTexture: texture,
      isAlive: true,
      respawnTimer: 0,
      animPhase: Math.random() * Math.PI * 2,
    };
  }

  // =========================================================================
  // BILLBOARD HUD CANVAS
  // =========================================================================

  private createBillboardHud(name: string, level: number, minPlayerLevel: number, isBoss: boolean) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext('2d')!;

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(isBoss ? 8.5 : 4.5, isBoss ? 2.6 : 1.4, 1);

    this.renderBillboardCanvas(ctx, canvas, name, level, minPlayerLevel, isBoss, 1.0);
    texture.needsUpdate = true;

    return { sprite, canvas, ctx, texture };
  }

  private renderBillboardCanvas(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    name: string,
    level: number,
    minPlayerLevel: number,
    isBoss: boolean,
    hpPct: number
  ) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background pill container
    ctx.fillStyle = 'rgba(11, 15, 23, 0.88)';
    ctx.beginPath();
    ctx.roundRect(10, 10, canvas.width - 20, canvas.height - 20, 20);
    ctx.fill();

    ctx.lineWidth = isBoss ? 4 : 2;
    ctx.strokeStyle = isBoss ? '#F59E0B' : '#3B82F6';
    ctx.stroke();

    // Check player eligibility
    const playerStats = PlayerStatsEngine.getStats();
    const isLevelLocked = playerStats.level < minPlayerLevel;

    // Title / Name Header
    ctx.font = isBoss ? 'bold 26px monospace' : 'bold 22px monospace';
    ctx.fillStyle = isBoss ? '#FDE047' : '#F8FAFC';
    ctx.textAlign = 'left';
    ctx.fillText(`${isBoss ? '👑 [TITAN] ' : ''}${name} (Lv. ${level})`, 25, 48);

    // Status / Level-Gating badge on right
    if (isLevelLocked) {
      ctx.fillStyle = '#EF4444';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`🔒 REQ LV. ${minPlayerLevel}+`, canvas.width - 25, 48);
    } else {
      ctx.fillStyle = '#10B981';
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('⚔️ HUNTABLE', canvas.width - 25, 48);
    }

    // Health bar track
    const barX = 25;
    const barY = 65;
    const barW = canvas.width - 50;
    const barH = 26;

    ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 8);
    ctx.fill();

    // Health bar fill
    const fillW = Math.max(0, barW * Math.min(1, Math.max(0, hpPct)));
    const barGrad = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
    if (hpPct > 0.5) {
      barGrad.addColorStop(0, '#10B981');
      barGrad.addColorStop(1, '#34D399');
    } else if (hpPct > 0.2) {
      barGrad.addColorStop(0, '#F59E0B');
      barGrad.addColorStop(1, '#FBBF24');
    } else {
      barGrad.addColorStop(0, '#EF4444');
      barGrad.addColorStop(1, '#F87171');
    }

    ctx.fillStyle = barGrad;
    ctx.beginPath();
    ctx.roundRect(barX, barY, fillW, barH, 8);
    ctx.fill();

    // HP Text & Tax Return info
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(
      isLevelLocked
        ? `🔒 IMMUNE TO ATTACKS — FARM SMALLER BEASTS FIRST`
        : `${Math.round(hpPct * 100)}% HP • ${isBoss ? '💰 TAX RETURN REWARD' : 'EXP + $PISO BOUNTY'}`,
      canvas.width / 2,
      barY + 20
    );

    // Subtitle notes
    ctx.font = '14px monospace';
    ctx.fillStyle = '#94A3B8';
    ctx.textAlign = 'left';
    ctx.fillText(
      isBoss
        ? '🏛️ Defeat to distribute stolen national taxes back to all citizens!'
        : '🌲 Farm beasts to level up your hunter stats and equip gear!',
      25,
      canvas.height - 22
    );
  }

  // =========================================================================
  // COMBAT & DAMAGE APPLICATION
  // =========================================================================

  /**
   * Applies skill damage to all monsters within hitRadius.
   * Enforces Level-Gating (Lv. 20+ for Giga Buwayas).
   */
  public applyDamage(
    playerPos: { x: number; z: number },
    hitRadius: number,
    baseSkillDamage: number,
    skillName: string
  ): HitResult[] {
    const results: HitResult[] = [];
    const pVec = new THREE.Vector2(playerPos.x, playerPos.z);

    for (const m of this.monsters) {
      if (!m.isAlive) continue;

      const mVec = new THREE.Vector2(m.mesh.position.x, m.mesh.position.z);
      const dist = pVec.distanceTo(mVec);

      // Hitbox radius: Giants have 8m hitbox; small beasts have 4m
      const effectiveHitRadius = hitRadius + (m.isBoss ? 4.5 : 1.5);

      if (dist <= effectiveHitRadius) {
        // 1. Level-Gating Check
        const check = PlayerStatsEngine.canAttackMonster(m.minPlayerLevel);

        if (!check.allowed) {
          // Monster is immune to low-level player!
          this.spawnFloatingText(
            `🔒 IMMUNE (REQ LV. ${m.minPlayerLevel}+)`,
            m.mesh.position.clone().add(new THREE.Vector3(0, m.isBoss ? 7 : 3, 0)),
            '#EF4444'
          );

          results.push({
            monsterId: m.id,
            monsterName: m.name,
            isBoss: m.isBoss,
            allowed: false,
            damage: 0,
            isCrit: false,
            remainingHp: m.currentHp,
            slain: false,
            bountyPiso: 0,
            expReward: 0,
            message: check.message,
            position: m.mesh.position.clone(),
          });
          continue;
        }

        // 2. Allowed! Calculate scaled damage with Player Stats & Gear Buffs
        const { finalDamage, isCrit, gearBonusDamage } = PlayerStatsEngine.calculateDamage(baseSkillDamage);

        // Apply monster DEF mitigation
        const mitigatedDmg = Math.max(50, finalDamage - m.def * 2);
        m.currentHp = Math.max(0, m.currentHp - mitigatedDmg);
        const hpPct = m.currentHp / m.maxHp;

        // Update billboard texture
        this.renderBillboardCanvas(
          m.billboardCtx,
          m.billboardCanvas,
          m.name,
          m.level,
          m.minPlayerLevel,
          m.isBoss,
          hpPct
        );
        m.billboardTexture.needsUpdate = true;

        // Spawn floating damage text
        const textLabel = isCrit
          ? `💥 -${mitigatedDmg.toLocaleString()} CRIT!`
          : `-${mitigatedDmg.toLocaleString()}`;
        this.spawnFloatingText(
          textLabel,
          m.mesh.position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 2, m.isBoss ? 6 : 2.5, (Math.random() - 0.5) * 2)),
          isCrit ? '#FACC15' : m.isBoss ? '#FB923C' : '#38BDF8'
        );

        // Play hit sound
        try {
          SoundFX.playLaser();
        } catch {}

        let slain = false;
        if (m.currentHp <= 0) {
          slain = true;
          this.killMonster(m);
        }

        results.push({
          monsterId: m.id,
          monsterName: m.name,
          isBoss: m.isBoss,
          allowed: true,
          damage: mitigatedDmg,
          isCrit,
          remainingHp: m.currentHp,
          slain,
          bountyPiso: m.bountyPiso,
          expReward: m.expReward,
          position: m.mesh.position.clone(),
        });
      }
    }

    return results;
  }

  private killMonster(m: MonsterEntity) {
    m.isAlive = false;
    m.respawnTimer = m.isBoss ? 45 : 15; // Respawn in seconds

    // Record kill in stats engine & award EXP + $PISO tokens
    PlayerStatsEngine.recordMonsterKill(m.name, m.isBoss, m.expReward, m.bountyPiso);

    if (m.isBoss) {
      // Massive Tax Return Coin Explosion
      this.triggerTaxReturnFestival(m.mesh.position.clone(), m.bountyPiso);
      try {
        SoundFX.playLevelUp?.();
      } catch {}
    } else {
      // Small bounty pop
      this.spawnFloatingText(
        `+${m.expReward} EXP • +${m.bountyPiso} ₱PISO`,
        m.mesh.position.clone().add(new THREE.Vector3(0, 3.5, 0)),
        '#10B981'
      );
    }
  }

  /**
   * Spawns an explosion of 3D gold coins representing stolen public taxes
   * returning to the citizens upon slaying a corrupt Buwaya Titan!
   */
  private triggerTaxReturnFestival(origin: THREE.Vector3, bountyPiso: number) {
    for (let i = 0; i < 40; i++) {
      const coin = new THREE.Mesh(this.coinGeometry, this.coinMaterial);
      coin.position.copy(origin).add(new THREE.Vector3(0, 4, 0));
      this.scene.add(coin);

      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 8;
      const upVel = 7 + Math.random() * 8;

      this.taxCoins.push({
        mesh: coin,
        pos: coin.position,
        vel: new THREE.Vector3(Math.cos(angle) * speed, upVel, Math.sin(angle) * speed),
        rotSpeed: new THREE.Vector3(
          Math.random() * 10 - 5,
          Math.random() * 10 - 5,
          Math.random() * 10 - 5
        ),
        life: 5.0, // 5 seconds
      });
    }

    this.spawnFloatingText(
      `🏛️ TAX RETURN FESTIVAL! +${bountyPiso.toLocaleString()} $PISO RETURNED TO THE PEOPLE!`,
      origin.clone().add(new THREE.Vector3(0, 8, 0)),
      '#F59E0B'
    );
  }

  /**
   * Spawns a floating combat text sprite in 3D space.
   */
  private spawnFloatingText(text: string, pos: THREE.Vector3, color: string) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Text outline
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 6;
    ctx.strokeText(text, 256, 64);

    // Text fill
    ctx.fillStyle = color;
    ctx.fillText(text, 256, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(6, 1.5, 1);
    sprite.position.copy(pos);
    this.scene.add(sprite);

    this.floatingTexts.push({
      id: this.nextTextId++,
      mesh: sprite,
      startPos: pos.clone(),
      velocity: new THREE.Vector3(0, 2.2, 0),
      life: 1.6,
      maxLife: 1.6,
    });
  }

  // =========================================================================
  // UPDATE LOOP & ANIMATIONS
  // =========================================================================

  public update(delta: number, playerPos: { x: number; z: number }) {
    // 1. Update Monster Meshes & Respawn Timers
    for (const m of this.monsters) {
      if (!m.isAlive) {
        m.respawnTimer -= delta;
        // Fade out or sink down
        if (m.mesh.position.y > -15) {
          m.mesh.position.y -= delta * 4;
        }

        if (m.respawnTimer <= 0) {
          // Respawn!
          m.isAlive = true;
          m.currentHp = m.maxHp;
          m.mesh.position.copy(m.spawnPos);
          this.renderBillboardCanvas(
            m.billboardCtx,
            m.billboardCanvas,
            m.name,
            m.level,
            m.minPlayerLevel,
            m.isBoss,
            1.0
          );
          m.billboardTexture.needsUpdate = true;
        }
        continue;
      }

      m.animPhase += delta * 2.5;

      // Face towards player slowly
      const dx = playerPos.x - m.mesh.position.x;
      const dz = playerPos.z - m.mesh.position.z;
      const targetHeading = Math.atan2(dx, dz);
      m.mesh.rotation.y = THREE.MathUtils.lerp(m.mesh.rotation.y, targetHeading, 0.05);

      // Titan Specific Animations: Snapping jaw & swaying cape
      if (m.type === 'croc_titan') {
        if (m.jawMesh) {
          // Snapping open/close jaw
          m.jawMesh.rotation.x = Math.max(0, Math.sin(m.animPhase * 0.8) * 0.35);
        }
        if (m.tailMesh) {
          // Heavy tail counter sway
          m.tailMesh.rotation.y = Math.sin(m.animPhase * 0.6) * 0.25;
        }
        if (m.capeMesh) {
          // Fluttering cape in wind
          m.capeMesh.rotation.x = Math.sin(m.animPhase * 1.5) * 0.15;
        }
      }

      // Small Beast Animations
      if (m.type === 'vulture' && m.wingsMesh) {
        // Flapping wings & hovering
        m.wingsMesh.children[0].rotation.z = Math.sin(m.animPhase * 4) * 0.5;
        m.wingsMesh.children[1].rotation.z = -Math.sin(m.animPhase * 4) * 0.5;
        m.mesh.position.y = m.spawnPos.y + Math.sin(m.animPhase * 1.5) * 0.8;
      }

      if (m.type === 'snake') {
        // S-curve bobbing
        m.mesh.position.y = m.spawnPos.y + Math.abs(Math.sin(m.animPhase * 2)) * 0.15;
      }

      if (m.type === 'hyena') {
        // Feral pacing / breathing
        m.mesh.scale.set(1 + Math.sin(m.animPhase * 2) * 0.03, 1, 1);
      }
    }

    // 2. Update Floating Combat Text
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= delta;
      ft.mesh.position.addScaledVector(ft.velocity, delta);

      const opacity = Math.max(0, ft.life / ft.maxLife);
      (ft.mesh.material as THREE.SpriteMaterial).opacity = opacity;

      if (ft.life <= 0) {
        this.scene.remove(ft.mesh);
        ft.mesh.material.dispose();
        this.floatingTexts.splice(i, 1);
      }
    }

    // 3. Update Tax Return Gold Coins
    const gravity = -16;
    for (let i = this.taxCoins.length - 1; i >= 0; i--) {
      const coin = this.taxCoins[i];
      coin.life -= delta;
      coin.vel.y += gravity * delta;
      coin.pos.addScaledVector(coin.vel, delta);

      // Bounce on ground
      if (coin.pos.y < 0.1) {
        coin.pos.y = 0.1;
        coin.vel.y = -coin.vel.y * 0.5;
        coin.vel.x *= 0.7;
        coin.vel.z *= 0.7;
      }

      coin.mesh.rotation.x += coin.rotSpeed.x * delta;
      coin.mesh.rotation.y += coin.rotSpeed.y * delta;
      coin.mesh.rotation.z += coin.rotSpeed.z * delta;

      if (coin.life <= 0) {
        this.scene.remove(coin.mesh);
        this.taxCoins.splice(i, 1);
      }
    }
  }

  /**
   * Finds the nearest alive monster within maxRadius.
   * Used for smart auto-target locking on both desktop and mobile.
   */
  public getNearestAliveMonster(
    playerPos: { x: number; z: number },
    maxRadius: number = 42
  ): { monster: MonsterEntity; distance: number } | null {
    let nearest: MonsterEntity | null = null;
    let minDistance = maxRadius;
    const pVec = new THREE.Vector2(playerPos.x, playerPos.z);

    for (const m of this.monsters) {
      if (!m.isAlive) continue;
      const mVec = new THREE.Vector2(m.mesh.position.x, m.mesh.position.z);
      const d = pVec.distanceTo(mVec);
      if (d < minDistance) {
        minDistance = d;
        nearest = m;
      }
    }

    if (!nearest) return null;
    return { monster: nearest, distance: Math.round(minDistance) };
  }

  /**
   * Cleanup on scene dismount.
   */
  public dispose() {
    this.monsters.forEach((m) => {
      this.scene.remove(m.mesh);
      m.billboardTexture.dispose();
      (m.billboardSprite.material as THREE.Material).dispose();
    });
    this.monsters = [];

    this.floatingTexts.forEach((ft) => {
      this.scene.remove(ft.mesh);
      ft.mesh.material.dispose();
    });
    this.floatingTexts = [];

    this.taxCoins.forEach((c) => {
      this.scene.remove(c.mesh);
    });
    this.taxCoins = [];
  }
}
