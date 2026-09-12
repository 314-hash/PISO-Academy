import * as THREE from 'three';
import { HumanAvatarConfig, AvatarSkinId, safeHexColor } from '../../context/AcademyContext';

export interface HumanoidRig {
  torso: THREE.Group;
  head: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftKnee: THREE.Group;
  rightKnee: THREE.Group;
}

export interface CharacterMeshInstance {
  rootGroup: THREE.Group;
  charGroup: THREE.Group;
  rig: HumanoidRig;
  capeGroup: THREE.Group | null;
  sunHaloGroup: THREE.Group | null;
  groundRing: THREE.Mesh | null;
  auraLight: THREE.PointLight | null;
  updateAnimation: (
    walkPhase: number,
    isMoving: boolean,
    delta: number,
    time: number,
    isJumping?: boolean,
    isDoubleJump?: boolean,
    jumpVelocityY?: number
  ) => void;
}

export interface PetDroneInstance {
  group: THREE.Group;
  ringMesh: THREE.Mesh;
  thrusterLight: THREE.PointLight;
  updateFollow: (
    ownerPos: THREE.Vector3,
    ownerHeading: number,
    time: number,
    delta: number
  ) => void;
}

/**
 * Creates the high-fidelity 3D procedural Humanoid Character
 * Matches the PISO Chain Blockchain Founder (Datu Sovereign) reference image
 */
export function createHumanoidCharacter(config: HumanAvatarConfig): CharacterMeshInstance {
  const rootGroup = new THREE.Group();
  const charGroup = new THREE.Group();
  rootGroup.add(charGroup);

  const skinColorNum = safeHexColor(config?.skinTone, 0x8D5524);
  const hairColorNum = safeHexColor(config?.hairColor, 0x0B0F17);
  const auraColorNum = safeHexColor(config?.auraColor, 0xF59E0B);

  const skinMat = new THREE.MeshStandardMaterial({
    color: skinColorNum,
    roughness: 0.6,
    metalness: 0.1,
  });

  const hairMat = new THREE.MeshStandardMaterial({
    color: hairColorNum,
    roughness: 0.35,
    metalness: 0.25,
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xFBBF24,
    metalness: 0.95,
    roughness: 0.15,
  });

  const darkArmorMat = new THREE.MeshStandardMaterial({
    color: 0x0B0F17,
    roughness: 0.35,
    metalness: 0.6,
  });

  const royalBlueMat = new THREE.MeshStandardMaterial({
    color: 0x1D4ED8,
    roughness: 0.5,
  });

  const crimsonRedMat = new THREE.MeshStandardMaterial({
    color: 0xDC2626,
    roughness: 0.5,
  });

  // 1. Ground Energy Ring / Footstep Anchor
  const pedRingGeo = new THREE.TorusGeometry(0.85, 0.02, 8, 28);
  const pedRingMat = new THREE.MeshBasicMaterial({ color: auraColorNum });
  const groundRing = new THREE.Mesh(pedRingGeo, pedRingMat);
  groundRing.rotation.x = Math.PI / 2;
  groundRing.position.y = 0.02;
  rootGroup.add(groundRing);

  const auraLight = new THREE.PointLight(auraColorNum, 1.8, 5);
  auraLight.position.set(0, 0.3, 0);
  rootGroup.add(auraLight);

  // 2. Torso Group (Pivot at pelvis top: y = 0.85)
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, 0.85, 0);
  charGroup.add(torsoGroup);

  const isFemale = config.gender === 'female';
  const isFounder = config.outfit === 'founderArmor';
  const outfit = config.outfit || (isFounder ? 'founderArmor' : isFemale ? 'mariaClaraCyber' : 'barongCyber');

  // Palette and materials for costumes
  const ivoryTernoMat = new THREE.MeshStandardMaterial({ color: 0xFDFEFE, roughness: 0.35, metalness: 0.15 });
  const urdujaCrimsonMat = new THREE.MeshStandardMaterial({ color: 0x991B1B, roughness: 0.4, metalness: 0.3 });
  const babaylanAstralMat = new THREE.MeshStandardMaterial({ color: 0x581C87, roughness: 0.3, metalness: 0.4 });
  const forgeObsidianMat = new THREE.MeshStandardMaterial({ color: 0x1C1917, roughness: 0.4, metalness: 0.7 });
  const bayanihanCyanMat = new THREE.MeshStandardMaterial({ color: 0x0891B2, roughness: 0.35, metalness: 0.3 });

  // Base torso body dimensions (Feminine vs Masculine)
  const torsoWidth = isFemale ? 0.50 : 0.62;
  const torsoHeight = isFemale ? 0.68 : 0.72;
  const torsoDepth = isFemale ? 0.33 : 0.38;

  let torsoMat = darkArmorMat;
  if (outfit === 'mariaClaraCyber') torsoMat = ivoryTernoMat;
  else if (outfit === 'urdujaArmor') torsoMat = urdujaCrimsonMat;
  else if (outfit === 'babaylanOracle') torsoMat = babaylanAstralMat;
  else if (outfit === 'pandayBlacksmith') torsoMat = forgeObsidianMat;
  else if (outfit === 'bayanihanGuardian') torsoMat = bayanihanCyanMat;
  else if (outfit === 'katipunanTech') torsoMat = new THREE.MeshStandardMaterial({ color: 0xDC2626, roughness: 0.5 });
  else if (outfit === 'babaylanRobes') torsoMat = new THREE.MeshStandardMaterial({ color: 0x7E22CE, roughness: 0.5 });
  else if (outfit === 'manilaHoodie') torsoMat = new THREE.MeshStandardMaterial({ color: 0x0F172A, roughness: 0.5 });
  else if (outfit === 'barongCyber') torsoMat = new THREE.MeshStandardMaterial({ color: 0xF8FAFC, roughness: 0.5 });

  const torsoGeo = new THREE.BoxGeometry(torsoWidth, torsoHeight, torsoDepth);
  const torsoMesh = new THREE.Mesh(torsoGeo, torsoMat);
  torsoMesh.position.set(0, 0.44, 0);
  torsoGroup.add(torsoMesh);

  // Female Bustier / Sculpted Breastplate Contours
  if (isFemale) {
    [-0.11, 0.11].forEach((bx) => {
      const bustGeo = new THREE.SphereGeometry(0.105, 14, 12);
      bustGeo.scale(1.0, 0.85, 0.7);
      const bustMesh = new THREE.Mesh(bustGeo, torsoMat);
      bustMesh.position.set(bx, 0.48, 0.15);
      torsoGroup.add(bustMesh);
    });

    // Elegant tapered waist trim
    const waistBeltGeo = new THREE.BoxGeometry(torsoWidth + 0.02, 0.04, torsoDepth + 0.02);
    const waistBelt = new THREE.Mesh(waistBeltGeo, goldMat);
    waistBelt.position.set(0, 0.28, 0);
    torsoGroup.add(waistBelt);
  }

  // --- OUTFIT 3D DETAILING (EXAMS & PROJECTS) ---
  if (outfit === 'founderArmor') {
    // 1. PISO Founder Datu Sovereign nano-armor
    const pecTrimGeo = new THREE.BoxGeometry(0.56, 0.04, 0.4);
    const pecTrim = new THREE.Mesh(pecTrimGeo, goldMat);
    pecTrim.position.set(0, 0.62, 0);
    torsoGroup.add(pecTrim);

    const ribTrimGeo = new THREE.BoxGeometry(0.48, 0.03, 0.4);
    const ribTrim = new THREE.Mesh(ribTrimGeo, goldMat);
    ribTrim.position.set(0, 0.28, 0);
    torsoGroup.add(ribTrim);

    // Golden Sunburst Medallion
    const sunMedallionGeo = new THREE.CylinderGeometry(0.21, 0.21, 0.03, 16);
    const sunMedallion = new THREE.Mesh(sunMedallionGeo, goldMat);
    sunMedallion.rotation.x = Math.PI / 2;
    sunMedallion.position.set(0, 0.47, 0.2);
    torsoGroup.add(sunMedallion);

    for (let r = 0; r < 12; r++) {
      const angle = (r * Math.PI * 2) / 12;
      const rayGeo = new THREE.ConeGeometry(0.028, 0.09, 4);
      const rayMesh = new THREE.Mesh(rayGeo, goldMat);
      rayMesh.position.set(Math.cos(angle) * 0.24, 0.47 + Math.sin(angle) * 0.24, 0.2);
      rayMesh.rotation.z = angle - Math.PI / 2;
      torsoGroup.add(rayMesh);
    }

    // Extruded 3D "₱" Emblem
    const pGroup = new THREE.Group();
    pGroup.position.set(0, 0.47, 0.22);
    const stemGeo = new THREE.BoxGeometry(0.04, 0.22, 0.03);
    const stemMesh = new THREE.Mesh(stemGeo, goldMat);
    stemMesh.position.set(-0.04, 0, 0);
    pGroup.add(stemMesh);

    const loopGeo = new THREE.TorusGeometry(0.062, 0.022, 8, 16, Math.PI * 1.35);
    const loopMesh = new THREE.Mesh(loopGeo, goldMat);
    loopMesh.rotation.z = -Math.PI * 0.15;
    loopMesh.position.set(-0.01, 0.045, 0);
    pGroup.add(loopMesh);

    const barTop = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.022, 0.035), goldMat);
    barTop.position.set(0, 0.065, 0.005);
    pGroup.add(barTop);

    const barBot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.022, 0.035), goldMat);
    barBot.position.set(0, 0.015, 0.005);
    pGroup.add(barBot);

    const starMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.035, 0), goldMat);
    starMesh.position.set(0, -0.15, 0.01);
    pGroup.add(starMesh);
    torsoGroup.add(pGroup);

  } else if (outfit === 'mariaClaraCyber') {
    // 2. Katunayan Certificate Exam: High-Tech Philippine Butterfly Sleeves (Terno)
    [-0.26, 0.26].forEach((sx, idx) => {
      // Iconic upright arched butterfly sleeve
      const sleeveGeo = new THREE.CylinderGeometry(0.14, 0.09, 0.28, 16, 1, true, 0, Math.PI * 1.5);
      const sleeveMesh = new THREE.Mesh(sleeveGeo, ivoryTernoMat);
      sleeveMesh.position.set(sx, 0.64, 0);
      sleeveMesh.rotation.z = idx === 0 ? 0.38 : -0.38;
      sleeveMesh.rotation.x = 0.15;
      torsoGroup.add(sleeveMesh);

      // Gold filigree rim on top of butterfly sleeve
      const rimGeo = new THREE.TorusGeometry(0.13, 0.014, 6, 16, Math.PI * 1.4);
      const rimMesh = new THREE.Mesh(rimGeo, goldMat);
      rimMesh.position.set(sx, 0.77, 0);
      rimMesh.rotation.z = idx === 0 ? 0.38 : -0.38;
      torsoGroup.add(rimMesh);
    });

    // Katunayan Soulbound Certificate Medallion over heart
    const certBadgeGeo = new THREE.OctahedronGeometry(0.08, 0);
    const certBadge = new THREE.Mesh(certBadgeGeo, goldMat);
    certBadge.position.set(0, 0.48, torsoDepth / 2 + 0.02);
    torsoGroup.add(certBadge);

    const certCore = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), new THREE.MeshBasicMaterial({ color: 0x06B6D4 }));
    certCore.position.set(0, 0.48, torsoDepth / 2 + 0.04);
    torsoGroup.add(certCore);

  } else if (outfit === 'urdujaArmor') {
    // 3. Genesis Project: Princess Urduja Warrior Sovereign Armor
    [-0.30, 0.30].forEach((px, idx) => {
      const pauldronGeo = new THREE.SphereGeometry(0.14, 12, 12, 0, Math.PI);
      const pauldron = new THREE.Mesh(pauldronGeo, goldMat);
      pauldron.rotation.x = -Math.PI / 2;
      pauldron.position.set(px, 0.65, 0);
      torsoGroup.add(pauldron);

      const redRim = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.015, 6, 16, Math.PI), urdujaCrimsonMat);
      redRim.rotation.x = Math.PI / 2;
      redRim.position.set(px, 0.66, 0);
      torsoGroup.add(redRim);
    });

    const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(torsoWidth - 0.06, 0.3, 0.05), goldMat);
    chestPlate.position.set(0, 0.48, torsoDepth / 2 + 0.02);
    torsoGroup.add(chestPlate);

  } else if (outfit === 'babaylanOracle') {
    // 4. AI-Web3 Track Exam: Babaylan AI High Priestess Robes
    // Floating glowing Baybayin rune ring around the waist
    const runeRingGeo = new THREE.TorusGeometry(torsoWidth * 0.65, 0.022, 8, 28);
    const runeRingMat = new THREE.MeshBasicMaterial({ color: 0xD946EF });
    const runeRing = new THREE.Mesh(runeRingGeo, runeRingMat);
    runeRing.rotation.x = Math.PI / 2;
    runeRing.position.set(0, 0.28, 0);
    torsoGroup.add(runeRing);

    // Levitating Amethyst AI Oracle Prism at collar
    const prismGeo = new THREE.IcosahedronGeometry(0.085, 0);
    const prismMat = new THREE.MeshStandardMaterial({
      color: 0xC084FC,
      roughness: 0.1,
      metalness: 0.9,
      emissive: 0x7E22CE,
      emissiveIntensity: 0.8,
    });
    const prism = new THREE.Mesh(prismGeo, prismMat);
    prism.position.set(0, 0.64, torsoDepth / 2 + 0.03);
    torsoGroup.add(prism);

    const prismLight = new THREE.PointLight(0xD946EF, 1.2, 3);
    prismLight.position.set(0, 0.64, torsoDepth / 2 + 0.05);
    torsoGroup.add(prismLight);

  } else if (outfit === 'pandayBlacksmith') {
    // 5. Solidity Engineering Track Exam: Master Panday Forge Suit
    const apron = new THREE.Mesh(
      new THREE.BoxGeometry(torsoWidth - 0.08, 0.52, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.8, metalness: 0.3 })
    );
    apron.position.set(0, 0.38, torsoDepth / 2 + 0.02);
    torsoGroup.add(apron);

    // Glowing copper compiler coils
    [-0.08, 0, 0.08].forEach((cx) => {
      const coil = new THREE.Mesh(
        new THREE.BoxGeometry(0.025, 0.38, 0.02),
        new THREE.MeshBasicMaterial({ color: 0xF97316 })
      );
      coil.position.set(cx, 0.38, torsoDepth / 2 + 0.045);
      torsoGroup.add(coil);
    });

  } else if (outfit === 'bayanihanGuardian') {
    // 6. Bayanihan Faucet & Testnet DAO Project: Aqua-Guardian Exosuit
    // Dual glowing cyan testnet coolant tubes along the flanks
    [-torsoWidth / 2, torsoWidth / 2].forEach((tx) => {
      const tube = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 0.55, 8),
        new THREE.MeshBasicMaterial({ color: 0x06B6D4 })
      );
      tube.position.set(tx, 0.44, 0);
      torsoGroup.add(tube);
    });

    // Faucet droplet badge
    const droplet = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 8), new THREE.MeshBasicMaterial({ color: 0x06B6D4 }));
    droplet.rotation.x = Math.PI;
    droplet.position.set(0, 0.48, torsoDepth / 2 + 0.02);
    torsoGroup.add(droplet);

  } else {
    // Classic Barong / Cyberwear embroidery trim
    const trimGeo = new THREE.BoxGeometry(0.12, 0.58, torsoDepth + 0.02);
    const trimMat = new THREE.MeshBasicMaterial({
      color: outfit === 'katipunanTech' ? 0xFBBF24 : outfit === 'barongCyber' ? 0xF59E0B : 0x06B6D4,
    });
    const trim = new THREE.Mesh(trimGeo, trimMat);
    trim.position.set(0, 0.44, 0);
    torsoGroup.add(trim);
  }

  // Uploaded Reference Texture Projection
  if (config?.uploadedTextureUrl) {
    const loader = new THREE.TextureLoader();
    loader.load(
      config.uploadedTextureUrl,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        const badgeMat = new THREE.MeshBasicMaterial({
          map: tex,
          transparent: true,
          side: THREE.DoubleSide,
        });
        const badgeGeo = new THREE.PlaneGeometry(0.28, 0.28);
        const badgeMesh = new THREE.Mesh(badgeGeo, badgeMat);
        badgeMesh.position.set(0, 0.47, torsoDepth / 2 + 0.025);
        torsoGroup.add(badgeMesh);
      },
      undefined,
      (err) => console.warn('Texture loader warning:', err)
    );
  }

  // 3. Back Crest / 8-Ray Philippine Sun & 3 Stars
  let sunHaloGroup: THREE.Group | null = null;
  const backCrestType = config.backCrest || (isFounder ? 'philippineSunStars' : 'none');

  if (backCrestType === 'philippineSunStars') {
    sunHaloGroup = new THREE.Group();
    sunHaloGroup.position.set(0, 0.96, -0.22);

    // Central Golden Sun Disc
    const sunCoreGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.05, 16);
    const sunCore = new THREE.Mesh(sunCoreGeo, goldMat);
    sunCore.rotation.x = Math.PI / 2;
    sunHaloGroup.add(sunCore);

    // 8 Primary Diamond Sun Rays
    for (let i = 0; i < 8; i++) {
      const theta = (i * Math.PI) / 4;
      const rayGeo = new THREE.ConeGeometry(0.075, 0.56, 4);
      const ray = new THREE.Mesh(rayGeo, goldMat);
      ray.position.set(Math.sin(theta) * 0.46, Math.cos(theta) * 0.46, 0);
      ray.rotation.z = -theta;
      sunHaloGroup.add(ray);

      const subTheta = theta + Math.PI / 8;
      const subRayGeo = new THREE.ConeGeometry(0.045, 0.36, 4);
      const subRay = new THREE.Mesh(subRayGeo, goldMat);
      subRay.position.set(Math.sin(subTheta) * 0.38, Math.cos(subTheta) * 0.38, 0);
      subRay.rotation.z = -subTheta;
      sunHaloGroup.add(subRay);
    }

    // 3 Golden Stars (Luzon, Visayas, Mindanao)
    const starPoints = [
      { x: 0, y: 0.82 },
      { x: 0.68, y: 0.42 },
      { x: -0.68, y: 0.42 },
    ];
    starPoints.forEach((pt) => {
      const sGeo = new THREE.OctahedronGeometry(0.075, 0);
      const sMesh = new THREE.Mesh(sGeo, goldMat);
      sMesh.position.set(pt.x, pt.y, 0.02);
      sunHaloGroup!.add(sMesh);
    });

    torsoGroup.add(sunHaloGroup);
  } else if (backCrestType === 'cyberRings') {
    sunHaloGroup = new THREE.Group();
    sunHaloGroup.position.set(0, 0.95, -0.2);
    const r1Geo = new THREE.TorusGeometry(0.45, 0.02, 8, 24);
    const r1Mat = new THREE.MeshBasicMaterial({ color: auraColorNum });
    const r1 = new THREE.Mesh(r1Geo, r1Mat);
    sunHaloGroup.add(r1);
    torsoGroup.add(sunHaloGroup);
  }

  // 4. Flowing Superhero Cape
  let capeGroup: THREE.Group | null = null;
  const capeType = config.cape || (isFounder ? 'founderCape' : 'none');

  if (capeType !== 'none') {
    capeGroup = new THREE.Group();
    capeGroup.position.set(0, 0.72, -0.16);

    // Shoulder Clasps
    [-0.28, 0.28].forEach((cx) => {
      const claspGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.04, 12);
      const clasp = new THREE.Mesh(claspGeo, goldMat);
      clasp.rotation.x = Math.PI / 2;
      clasp.position.set(cx, 0.02, 0.04);
      capeGroup!.add(clasp);
    });

    const outerCapeGeo = new THREE.PlaneGeometry(isFemale ? 0.75 : 0.85, 1.42, 8, 12);
    const capeOuterMat = capeType === 'energyCape' ? new THREE.MeshBasicMaterial({ color: 0xFBBF24, transparent: true, opacity: 0.85 }) : capeType === 'shadowCape' ? darkArmorMat : royalBlueMat;
    const outerCape = new THREE.Mesh(outerCapeGeo, capeOuterMat);
    outerCape.position.set(0, -0.71, -0.01);
    outerCape.rotation.x = 0.12;
    capeGroup.add(outerCape);

    const innerCapeGeo = new THREE.PlaneGeometry(isFemale ? 0.74 : 0.84, 1.41, 8, 12);
    const innerCape = new THREE.Mesh(innerCapeGeo, crimsonRedMat);
    innerCape.position.set(0, -0.71, 0.005);
    innerCape.rotation.y = Math.PI;
    innerCape.rotation.x = -0.12;
    capeGroup.add(innerCape);

    torsoGroup.add(capeGroup);
  }

  // Belt & Sash
  const beltGeo = new THREE.BoxGeometry(torsoWidth + 0.04, 0.09, torsoDepth + 0.04);
  const beltMesh = new THREE.Mesh(beltGeo, goldMat);
  beltMesh.position.set(0, 0.06, 0);
  torsoGroup.add(beltMesh);

  if (isFounder || outfit === 'urdujaArmor') {
    const buckleStar = new THREE.Mesh(new THREE.OctahedronGeometry(0.06, 0), goldMat);
    buckleStar.position.set(0, 0.06, torsoDepth / 2 + 0.04);
    torsoGroup.add(buckleStar);

    const sashMat = outfit === 'urdujaArmor' ? urdujaCrimsonMat : royalBlueMat;
    const sashGeo = new THREE.BoxGeometry(0.22, 0.36, 0.04);
    const sashMesh = new THREE.Mesh(sashGeo, sashMat);
    sashMesh.position.set(0, -0.14, torsoDepth / 2 + 0.02);
    torsoGroup.add(sashMesh);
  }

  // 5. Head Group (Pivot at neck: y = 0.82 inside torsoGroup)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.82, 0);
  torsoGroup.add(headGroup);

  // Neck
  const neckRadius = isFemale ? 0.085 : 0.1;
  const neckGeo = new THREE.CylinderGeometry(neckRadius, neckRadius + 0.01, 0.16, 12);
  const neck = new THREE.Mesh(neckGeo, skinMat);
  neck.position.set(0, 0.05, 0);
  headGroup.add(neck);

  // Head Skull
  const headRadius = isFemale ? 0.23 : 0.26;
  const headGeo = new THREE.SphereGeometry(headRadius, 20, 20);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.set(0, 0.26, 0);
  head.scale.set(0.92, 1.05, 0.95);
  headGroup.add(head);

  // Eyes (Heroic / Cyber Optics)
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x06B6D4 });
  const eyeX = isFemale ? 0.075 : 0.085;
  const eyeY = isFemale ? 0.27 : 0.28;
  [-eyeX, eyeX].forEach((ex) => {
    const eyeGeo = new THREE.SphereGeometry(isFemale ? 0.028 : 0.032, 8, 8);
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(ex, eyeY, headRadius * 0.88);
    headGroup.add(eye);
  });

  // Facial Hair: Only rendered on male characters
  if (!isFemale && (config.hasBeard || isFounder)) {
    const mustache = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.04), hairMat);
    mustache.position.set(0, 0.21, 0.25);
    headGroup.add(mustache);

    const goatee = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.12, 4), hairMat);
    goatee.rotation.x = Math.PI;
    goatee.position.set(0, 0.12, 0.23);
    headGroup.add(goatee);
  }

  // --- HAIRSTYLES (INCLUDES FEMALE & SPECIALS) ---
  const hairStyle = config.hairStyle || (isFounder ? 'datuLongWavy' : isFemale ? 'mariaClaraBun' : 'cyberFade');

  if (hairStyle === 'mariaClaraBun') {
    // 1. Maria Clara Cyber-Updo (High coiled bun + hair cap)
    const hairCap = new THREE.Mesh(new THREE.SphereGeometry(headRadius + 0.02, 16, 16), hairMat);
    hairCap.position.set(0, 0.29, -0.02);
    headGroup.add(hairCap);

    // High Coiled Bun
    const bunGeo = new THREE.SphereGeometry(0.13, 14, 14);
    const bun = new THREE.Mesh(bunGeo, hairMat);
    bun.position.set(0, 0.50, -0.12);
    headGroup.add(bun);

    // Golden Sampaguita hairpin on temple
    const pin = new THREE.Mesh(new THREE.OctahedronGeometry(0.04, 0), goldMat);
    pin.position.set(0.16, 0.44, 0.05);
    headGroup.add(pin);

  } else if (hairStyle === 'diwataLocks') {
    // 2. Diwata Flowing Waves (Cascading down past waist)
    const hairCap = new THREE.Mesh(new THREE.SphereGeometry(headRadius + 0.02, 16, 16), hairMat);
    hairCap.position.set(0, 0.30, -0.02);
    headGroup.add(hairCap);

    [-0.18, 0.18].forEach((lx, idx) => {
      const lock = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.03, 0.65, 8), hairMat);
      lock.position.set(lx, 0.05, 0.08);
      lock.rotation.z = idx === 0 ? -0.12 : 0.12;
      headGroup.add(lock);
    });

    const backWaves = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.72, 0.15), hairMat);
    backWaves.position.set(0, 0.02, -0.16);
    headGroup.add(backWaves);

  } else if (hairStyle === 'urdujaPonytail') {
    // 3. Urduja Warrior High Ponytail
    const hairCap = new THREE.Mesh(new THREE.SphereGeometry(headRadius + 0.02, 16, 16), hairMat);
    hairCap.position.set(0, 0.30, 0);
    headGroup.add(hairCap);

    // Golden Ponytail Clasp Ring
    const clasp = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.015, 6, 16), goldMat);
    clasp.position.set(0, 0.44, -0.22);
    headGroup.add(clasp);

    // Swept-back ponytail
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.025, 0.52, 8), hairMat);
    tail.position.set(0, 0.22, -0.32);
    tail.rotation.x = -0.4;
    headGroup.add(tail);

  } else if (hairStyle === 'cyberBob') {
    // 4. Sharp Asymmetrical Cyber Bob
    const hairCap = new THREE.Mesh(new THREE.SphereGeometry(headRadius + 0.025, 16, 16), hairMat);
    hairCap.position.set(0, 0.30, 0);
    headGroup.add(hairCap);

    const bobLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.32, 0.28), hairMat);
    bobLeft.position.set(-headRadius - 0.01, 0.18, 0.04);
    headGroup.add(bobLeft);

    const bobRight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.24, 0.28), hairMat);
    bobRight.position.set(headRadius + 0.01, 0.22, 0.04);
    headGroup.add(bobRight);

  } else if (hairStyle === 'spaceBuns') {
    // 5. Twin Celestial Space Buns
    const hairCap = new THREE.Mesh(new THREE.SphereGeometry(headRadius + 0.02, 16, 16), hairMat);
    hairCap.position.set(0, 0.30, 0);
    headGroup.add(hairCap);

    [-0.18, 0.18].forEach((bx) => {
      const bun = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), hairMat);
      bun.position.set(bx, 0.48, -0.05);
      headGroup.add(bun);

      const bunRing = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.012, 6, 16), new THREE.MeshBasicMaterial({ color: 0x06B6D4 }));
      bunRing.rotation.x = Math.PI / 2;
      bunRing.position.set(bx, 0.45, -0.05);
      headGroup.add(bunRing);
    });

  } else if (hairStyle === 'datuLongWavy') {
    // 6. Datu Sovereign Long Wavy Locks
    const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), hairMat);
    hairCap.position.set(0, 0.32, -0.02);
    hairCap.scale.set(0.98, 1.05, 1.05);
    headGroup.add(hairCap);

    [-0.24, 0.24].forEach((lx, idx) => {
      const lock = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.04, 0.48, 8), hairMat);
      lock.position.set(lx, 0.15, 0.1);
      lock.rotation.z = idx === 0 ? -0.15 : 0.15;
      headGroup.add(lock);
    });

    const lockBack = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.52, 0.18), hairMat);
    lockBack.position.set(0, 0.12, -0.16);
    headGroup.add(lockBack);

  } else if (hairStyle === 'topknot') {
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 14), hairMat);
    hair.position.set(0, 0.58, 0);
    headGroup.add(hair);

  } else if (hairStyle === 'braids') {
    const hair = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.3, 16), hairMat);
    hair.position.set(0, 0.48, 0);
    headGroup.add(hair);

  } else if (hairStyle === 'neonBangs') {
    const hair = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.25, 16), hairMat);
    hair.position.set(0, 0.52, 0);
    headGroup.add(hair);

  } else {
    // Cyber-Fade default
    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.16, 0.54), hairMat);
    hair.position.set(0, 0.48, 0);
    headGroup.add(hair);
  }

  // --- ACCESSORIES ---
  const acc = config.accessory || (isFounder ? 'pisoSunCrest' : 'none');

  if (acc === 'sampaguitaPin') {
    // Golden Sampaguita Jasmine flower
    const flower = new THREE.Mesh(new THREE.OctahedronGeometry(0.045, 0), goldMat);
    flower.position.set(0.16, 0.38, 0.18);
    headGroup.add(flower);

    const petal = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), new THREE.MeshBasicMaterial({ color: 0xFFFFFF }));
    petal.position.set(0.16, 0.38, 0.22);
    headGroup.add(petal);

  } else if (acc === 'diwataCrown') {
    // Delicate Golden Pearl Diwata Tiara
    const tiara = new THREE.Mesh(new THREE.TorusGeometry(headRadius + 0.02, 0.015, 6, 24, Math.PI), goldMat);
    tiara.rotation.x = -Math.PI * 0.15;
    tiara.position.set(0, 0.35, 0.05);
    headGroup.add(tiara);

    const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), new THREE.MeshBasicMaterial({ color: 0x38BDF8 }));
    pearl.position.set(0, 0.38, headRadius + 0.03);
    headGroup.add(pearl);

  } else if (acc === 'baybayinTattoo') {
    // Glowing Neon Baybayin cryptographic attestation sigils under eyes
    [-0.08, 0.08].forEach((gx) => {
      const glyph = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.012, 0.01), new THREE.MeshBasicMaterial({ color: 0x06B6D4 }));
      glyph.position.set(gx, 0.22, headRadius * 0.94);
      headGroup.add(glyph);
    });

  } else if (acc === 'pisoSunCrest') {
    const coronet = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.018, 8, 24), goldMat);
    coronet.rotation.x = Math.PI / 2;
    coronet.position.set(0, 0.36, 0);
    headGroup.add(coronet);

    const sunPebble = new THREE.Mesh(new THREE.OctahedronGeometry(0.04, 0), goldMat);
    sunPebble.position.set(0, 0.37, 0.26);
    headGroup.add(sunPebble);

  } else if (acc === 'cyberVisor') {
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.09, 0.26), new THREE.MeshBasicMaterial({ color: 0x06B6D4 }));
    visor.position.set(0, 0.28, 0.22);
    headGroup.add(visor);

  } else if (acc === 'pisoPendant') {
    const pendant = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 16), goldMat);
    pendant.rotation.x = Math.PI / 2;
    pendant.position.set(0, 0.08, 0.24);
    headGroup.add(pendant);

  } else if (acc === 'holoMask') {
    const mask = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.2), new THREE.MeshBasicMaterial({ color: 0x3B82F6 }));
    mask.position.set(0, 0.16, 0.22);
    headGroup.add(mask);
  }

  // 6. Arms & Ornate Gauntlets (Pivot at shoulders)
  const shoulderX = isFemale ? 0.33 : 0.42;
  const shoulderY = isFemale ? 0.62 : 0.65;
  const armRadiusUpper = isFemale ? 0.065 : 0.08;
  const armRadiusLower = isFemale ? 0.058 : 0.075;

  const createArm = (isLeft: boolean) => {
    const armGroup = new THREE.Group();
    armGroup.position.set(isLeft ? -shoulderX : shoulderX, shoulderY, 0);

    const upper = new THREE.Mesh(new THREE.CylinderGeometry(armRadiusUpper, armRadiusUpper * 0.9, 0.32, 10), isFounder ? darkArmorMat : torsoMat);
    upper.position.set(0, -0.16, 0);
    armGroup.add(upper);

    const lower = new THREE.Mesh(new THREE.CylinderGeometry(armRadiusLower, armRadiusLower * 0.9, 0.32, 10), skinMat);
    lower.position.set(0, -0.44, 0);
    armGroup.add(lower);

    // Segmented Gold Gauntlet Vambrace
    const gauntlet = new THREE.Mesh(new THREE.CylinderGeometry(armRadiusLower + 0.015, armRadiusLower + 0.01, 0.18, 10), goldMat);
    gauntlet.position.set(0, -0.42, 0);
    armGroup.add(gauntlet);

    // Armored Hand
    const hand = new THREE.Mesh(new THREE.SphereGeometry(isFemale ? 0.048 : 0.06, 8, 8), isFounder ? darkArmorMat : skinMat);
    hand.position.set(0, -0.60, 0);
    armGroup.add(hand);

    return armGroup;
  };

  const leftArmGroup = createArm(true);
  const rightArmGroup = createArm(false);
  torsoGroup.add(leftArmGroup);
  torsoGroup.add(rightArmGroup);

  // --- FILIPINO CULTURAL WEAPONS, SHIELDS & ACCESSORIES ---
  const equippedPinoy = config.equippedPinoyItems;
  const isAllEquipped = !!equippedPinoy?.allEquipped;
  const weaponId = equippedPinoy?.weapon;
  const shieldId = equippedPinoy?.shield;
  const headwearId = equippedPinoy?.headwear;
  const towelId = equippedPinoy?.towel;
  const crownId = equippedPinoy?.crown;
  const backId = equippedPinoy?.back;
  const signboardId = equippedPinoy?.signboard;
  const amuletId = equippedPinoy?.amulet;
  const taboId = equippedPinoy?.tabo;

  // 1. Kampilan Plasma Blade
  const attachKampilan = (parent: THREE.Group) => {
    const bladeGroup = new THREE.Group();
    bladeGroup.position.set(0, -0.60, 0.1);
    bladeGroup.rotation.x = Math.PI / 4;

    const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.25, 8), darkArmorMat);
    hilt.position.set(0, -0.08, 0);
    bladeGroup.add(hilt);

    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.025, 0.05), goldMat);
    guard.position.set(0, 0.05, 0);
    bladeGroup.add(guard);

    const bladeMat = new THREE.MeshBasicMaterial({ color: 0x06B6D4 });
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.85, 0.015), bladeMat);
    blade.position.set(0, 0.48, 0);
    bladeGroup.add(blade);

    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 4), bladeMat);
    tip.position.set(0.02, 0.95, 0);
    tip.rotation.z = -0.2;
    bladeGroup.add(tip);

    parent.add(bladeGroup);
  };

  // 2. Tsinelas (Slipper)
  const attachTsinelas = (parent: THREE.Group, isHipHolster = false) => {
    const slipperGroup = new THREE.Group();
    if (isHipHolster) {
      slipperGroup.position.set(torsoWidth / 2 + 0.05, 0.12, 0.04);
      slipperGroup.rotation.set(0, 0, -0.3);
      slipperGroup.scale.setScalar(0.75);
    } else {
      slipperGroup.position.set(0, -0.60, 0.05);
      slipperGroup.rotation.x = Math.PI / 4;
      slipperGroup.rotation.y = Math.PI / 6;
    }

    const soleGeo = new THREE.BoxGeometry(0.13, 0.03, 0.28);
    const soleMat = new THREE.MeshStandardMaterial({ color: 0x0284C7, roughness: 0.8 });
    const sole = new THREE.Mesh(soleGeo, soleMat);
    slipperGroup.add(sole);

    const strapMat = new THREE.MeshStandardMaterial({ color: 0xDC2626, roughness: 0.5 });
    const strapL = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.13), strapMat);
    strapL.rotation.z = 0.5;
    strapL.rotation.x = -0.3;
    strapL.position.set(-0.03, 0.03, -0.02);
    slipperGroup.add(strapL);

    const strapR = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.13), strapMat);
    strapR.rotation.z = -0.5;
    strapR.rotation.x = -0.3;
    strapR.position.set(0.03, 0.03, -0.02);
    slipperGroup.add(strapR);

    parent.add(slipperGroup);
  };

  // 3. Baguio Walis Tambo
  const attachWalis = (parent: THREE.Group, isBackSlung = false) => {
    const broomGroup = new THREE.Group();
    if (isBackSlung) {
      broomGroup.position.set(-0.10, 0.35, -0.24);
      broomGroup.rotation.set(0.2, 0, 0.8);
      broomGroup.scale.setScalar(0.85);
    } else {
      broomGroup.position.set(0, -0.60, 0.1);
      broomGroup.rotation.x = Math.PI / 3;
    }

    const handleMat = new THREE.MeshStandardMaterial({ color: 0xD97706, roughness: 0.7 });
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.9, 8), handleMat);
    handle.position.set(0, -0.15, 0);
    broomGroup.add(handle);

    const whiskMat = new THREE.MeshStandardMaterial({ color: 0xEAB308, roughness: 0.9 });
    const whisk = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.45, 6), whiskMat);
    whisk.rotation.x = Math.PI;
    whisk.position.set(0, 0.35, 0);
    whisk.scale.set(1.4, 1.0, 0.3);
    broomGroup.add(whisk);

    parent.add(broomGroup);
  };

  // 4. Bathala's Lightning Scepter
  const attachBathalaScepter = (parent: THREE.Group) => {
    const scepterGroup = new THREE.Group();
    scepterGroup.position.set(0, -0.60, 0.1);
    scepterGroup.rotation.x = Math.PI / 3;

    const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 1.1, 8), goldMat);
    scepterGroup.add(staff);

    const boltMat = new THREE.MeshBasicMaterial({ color: 0xEF4444 });
    const bolt = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), boltMat);
    bolt.position.set(0, 0.58, 0);
    bolt.scale.set(0.8, 2.5, 0.8);
    scepterGroup.add(bolt);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.015, 6, 16), new THREE.MeshBasicMaterial({ color: 0xF59E0B }));
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 0.58, 0);
    scepterGroup.add(ring);

    parent.add(scepterGroup);
  };

  // 5. Karaoke Microphone
  const attachKaraokeMic = (parent: THREE.Group) => {
    const micGroup = new THREE.Group();
    micGroup.position.set(0, -0.60, 0.08);
    micGroup.rotation.x = Math.PI / 3;

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, metalness: 0.7, roughness: 0.3 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.015, 0.22, 10), bodyMat);
    micGroup.add(body);

    const meshHead = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 12), new THREE.MeshStandardMaterial({ color: 0xE2E8F0, metalness: 0.9, roughness: 0.2 }));
    meshHead.position.set(0, 0.12, 0);
    micGroup.add(meshHead);

    parent.add(micGroup);
  };

  // 6. Magic Kaldero Lid Aegis Shield (Left Hand)
  const attachKalderoLid = (parent: THREE.Group) => {
    const shieldGroup = new THREE.Group();
    shieldGroup.position.set(0, -0.45, 0.12);
    shieldGroup.rotation.y = Math.PI / 2;

    const lidMat = new THREE.MeshStandardMaterial({ color: 0xCBD5E1, metalness: 0.85, roughness: 0.2 });
    const lid = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16, 0, Math.PI * 2, 0, Math.PI / 3), lidMat);
    shieldGroup.add(lid);

    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.05, 8), darkArmorMat);
    knob.rotation.x = Math.PI / 2;
    knob.position.set(0, 0, 0.08);
    shieldGroup.add(knob);

    parent.add(shieldGroup);
  };

  // 7. Salakot Bamboo Hat (Head)
  const attachSalakot = (parent: THREE.Group) => {
    const salakotGroup = new THREE.Group();
    salakotGroup.position.set(0, 0.42, 0);

    const salakotMat = new THREE.MeshStandardMaterial({ color: 0xD97706, roughness: 0.85 });
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.44, 0.18, 16), salakotMat);
    salakotGroup.add(cone);

    const band = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.015, 6, 20), goldMat);
    band.rotation.x = Math.PI / 2;
    band.position.set(0, -0.05, 0);
    salakotGroup.add(band);

    parent.add(salakotGroup);
  };

  // 8. Good Morning Towel (Neck & Collar)
  const attachGoodMorningTowel = (parent: THREE.Group) => {
    const towelGroup = new THREE.Group();
    towelGroup.position.set(0, 0.05, 0);

    const towelMat = new THREE.MeshStandardMaterial({ color: 0xF8FAFC, roughness: 0.9 });
    const neckBand = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.035, 8, 18), towelMat);
    neckBand.rotation.x = Math.PI / 2;
    towelGroup.add(neckBand);

    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.35, 0.02), towelMat);
    tail.position.set(0.12, -0.15, 0.22);
    tail.rotation.z = -0.1;
    towelGroup.add(tail);

    parent.add(towelGroup);
  };

  // 9. Datu Maharlika Sun Crown (Crown Halo)
  const attachDatuCrown = (parent: THREE.Group, floatY = 0.45) => {
    const crownGroup = new THREE.Group();
    crownGroup.position.set(0, floatY, 0);

    const baseRing = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.025, 8, 24), goldMat);
    baseRing.rotation.x = Math.PI / 2;
    crownGroup.add(baseRing);

    for (let r = 0; r < 8; r++) {
      const angle = (r / 8) * Math.PI * 2;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.18, 4), goldMat);
      spike.position.set(Math.cos(angle) * 0.24, 0.08, Math.sin(angle) * 0.24);
      spike.rotation.z = -Math.cos(angle) * 0.4;
      spike.rotation.x = Math.sin(angle) * 0.4;
      crownGroup.add(spike);
    }

    parent.add(crownGroup);
  };

  // 10. Agimat ni Nardong Dikit (Chest Amulet)
  const attachAgimatAmulet = (parent: THREE.Group) => {
    const agimatGroup = new THREE.Group();
    agimatGroup.position.set(0, 0.45, torsoDepth / 2 + 0.03);

    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.012, 16), goldMat);
    disc.rotation.x = Math.PI / 2;
    agimatGroup.add(disc);

    const runeMat = new THREE.MeshBasicMaterial({ color: 0xF59E0B });
    const rune = new THREE.Mesh(new THREE.RingGeometry(0.025, 0.045, 8), runeMat);
    rune.position.z = 0.008;
    agimatGroup.add(rune);

    parent.add(agimatGroup);
  };

  // 11. Tabo of Holy Cleansing (Hip Dipper)
  const attachTabo = (parent: THREE.Group) => {
    const taboGroup = new THREE.Group();
    taboGroup.position.set(-torsoWidth / 2 - 0.06, 0.10, 0.05);
    taboGroup.rotation.z = -0.2;

    const taboMat = new THREE.MeshStandardMaterial({ color: 0x06B6D4, roughness: 0.3 });
    const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.11, 12), taboMat);
    taboGroup.add(bucket);

    const taboHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.12, 8), taboMat);
    taboHandle.rotation.x = Math.PI / 2;
    taboHandle.position.set(0, 0.03, -0.07);
    taboGroup.add(taboHandle);

    parent.add(taboGroup);
  };

  // 12. Jeepney Route Signboard (Back)
  const attachJeepneySign = (parent: THREE.Group, offsetZ = -0.22) => {
    const signGroup = new THREE.Group();
    signGroup.position.set(0, 0.38, offsetZ);
    signGroup.rotation.y = Math.PI;

    const boardMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.4 });
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.22, 0.02), boardMat);
    signGroup.add(board);

    const frameMat = new THREE.MeshBasicMaterial({ color: 0xF59E0B });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.24, 0.01), frameMat);
    frame.position.z = -0.005;
    signGroup.add(frame);

    parent.add(signGroup);
  };

  // 13. Sarimanok Prismatic Wings (Back)
  const attachSarimanokWings = (parent: THREE.Group) => {
    const wingsGroup = new THREE.Group();
    wingsGroup.position.set(0, 0.40, -0.20);

    const colors = [0xEF4444, 0xF59E0B, 0x10B981, 0x06B6D4, 0x8B5CF6, 0xEC4899];
    colors.forEach((col, idx) => {
      [-1, 1].forEach((dir) => {
        const feather = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.6 + idx * 0.06, 0.01), new THREE.MeshBasicMaterial({ color: col }));
        feather.position.set(dir * (0.2 + idx * 0.08), 0.25 - idx * 0.04, -idx * 0.02);
        feather.rotation.z = -dir * (0.4 + idx * 0.15);
        wingsGroup.add(feather);
      });
    });

    parent.add(wingsGroup);
  };

  // 14. Bakunawa Dragon Wings (Back)
  const attachBakunawaWings = (parent: THREE.Group) => {
    const wingsGroup = new THREE.Group();
    wingsGroup.position.set(0, 0.40, -0.20);

    const wingMat = new THREE.MeshBasicMaterial({ color: 0x8B5CF6, transparent: true, opacity: 0.85 });
    [-1, 1].forEach((dir) => {
      const wing = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.9, 3), wingMat);
      wing.position.set(dir * 0.5, 0.35, 0);
      wing.rotation.z = -dir * 0.8;
      wing.rotation.y = dir * 0.3;
      wingsGroup.add(wing);
    });

    parent.add(wingsGroup);
  };

  // --- ATTACH EQUIPMENT BASED ON CONFIG (ALL-EQUIPPED OR INDIVIDUAL) ---
  if (isAllEquipped) {
    // 🌟 FULL GOD-MODE PINOY CULTURE SET: Equip ALL items simultaneously!
    attachKampilan(rightArmGroup);
    attachKalderoLid(leftArmGroup);
    attachSalakot(headGroup);
    attachDatuCrown(headGroup, 0.58); // Floating celestial sun halo above salakot!
    attachGoodMorningTowel(headGroup);
    attachAgimatAmulet(torsoGroup);
    attachTabo(torsoGroup);
    attachTsinelas(torsoGroup, true); // Holstered on hip!
    attachWalis(torsoGroup, true); // Slung across back!
    attachSarimanokWings(torsoGroup);
    attachJeepneySign(torsoGroup, -0.26);
  } else {
    // Individual slot equipment
    if (weaponId === 'kampilan-lapulapu') attachKampilan(rightArmGroup);
    else if (weaponId === 'tsinelas-common') attachTsinelas(rightArmGroup);
    else if (weaponId === 'walis-tambo-whirlwind') attachWalis(rightArmGroup);
    else if (weaponId === 'bathala-kilat') attachBathalaScepter(rightArmGroup);
    else if (weaponId === 'karaoke-mic-stun') attachKaraokeMic(rightArmGroup);

    if (shieldId === 'kaldero-lid-aegis' || weaponId === 'kaldero-lid-aegis') attachKalderoLid(leftArmGroup);

    if (headwearId === 'salakot-solar') attachSalakot(headGroup);
    else if (headwearId === 'good-morning-towel' || towelId === 'good-morning-towel') attachGoodMorningTowel(headGroup);
    else if (headwearId === 'datu-sun-crown' || crownId === 'datu-sun-crown') attachDatuCrown(headGroup);

    if (amuletId === 'agimat-anting') attachAgimatAmulet(torsoGroup);
    if (taboId === 'tabo-cleansing') attachTabo(torsoGroup);

    if (backId === 'sarimanok-wings') attachSarimanokWings(torsoGroup);
    else if (backId === 'bakunawa-wings') attachBakunawaWings(torsoGroup);
    else if (backId === 'jeepney-route-sign' || signboardId === 'jeepney-route-sign') attachJeepneySign(torsoGroup);
  }

  // 7. Legs & Greaves (Pivot at hips)
  const hipX = isFemale ? 0.14 : 0.18;
  const legRadiusThigh = isFemale ? 0.08 : 0.1;
  const legRadiusShin = isFemale ? 0.07 : 0.09;

  const pantsMat = new THREE.MeshStandardMaterial({
    color: outfit === 'mariaClaraCyber' ? 0x1E293B : outfit === 'urdujaArmor' ? 0x7F1D1D : 0x0B0F17,
    roughness: 0.4,
    metalness: 0.5,
  });

  const createLeg = (isLeft: boolean) => {
    const hipGroup = new THREE.Group();
    hipGroup.position.set(isLeft ? -hipX : hipX, 0.85, 0);

    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(legRadiusThigh, legRadiusThigh * 0.9, 0.40, 12), pantsMat);
    thigh.position.set(0, -0.20, 0);
    hipGroup.add(thigh);

    const kneeGroup = new THREE.Group();
    kneeGroup.position.set(0, -0.40, 0);
    hipGroup.add(kneeGroup);

    // Gold Knee Cop
    const kneeCop = new THREE.Mesh(new THREE.OctahedronGeometry(isFemale ? 0.05 : 0.065, 0), goldMat);
    kneeCop.position.set(0, 0, 0.09);
    kneeGroup.add(kneeCop);

    const shin = new THREE.Mesh(new THREE.CylinderGeometry(legRadiusShin, legRadiusShin * 0.9, 0.38, 12), pantsMat);
    shin.position.set(0, -0.19, 0);
    kneeGroup.add(shin);

    const greave = new THREE.Mesh(new THREE.BoxGeometry(legRadiusShin * 1.3, 0.24, legRadiusShin * 1.8), goldMat);
    greave.position.set(0, -0.19, 0.01);
    kneeGroup.add(greave);

    // Boot (Female has sleek cyber-wedge / male has heavy sabaton)
    const boot = new THREE.Mesh(
      new THREE.BoxGeometry(isFemale ? 0.12 : 0.15, 0.12, isFemale ? 0.24 : 0.28),
      goldMat
    );
    boot.position.set(0, -0.36, 0.05);
    kneeGroup.add(boot);

    return { hipGroup, kneeGroup };
  };

  const leftLeg = createLeg(true);
  const rightLeg = createLeg(false);
  charGroup.add(leftLeg.hipGroup);
  charGroup.add(rightLeg.hipGroup);

  const rig: HumanoidRig = {
    torso: torsoGroup,
    head: headGroup,
    leftArm: leftArmGroup,
    rightArm: rightArmGroup,
    leftLeg: leftLeg.hipGroup,
    rightLeg: rightLeg.hipGroup,
    leftKnee: leftLeg.kneeGroup,
    rightKnee: rightLeg.kneeGroup,
  };

  const updateAnimation = (
    walkPhase: number,
    isMoving: boolean,
    delta: number,
    time: number,
    isJumping: boolean = false,
    isDoubleJump: boolean = false,
    jumpVelocityY: number = 0
  ) => {
    if (isJumping) {
      // Dynamic Airborne / Leap Pose
      const isAscending = jumpVelocityY > 0;
      if (isAscending) {
        // Tucked knees, arms balanced back/out, cape trailing down/back
        rig.leftLeg.rotation.x = THREE.MathUtils.lerp(rig.leftLeg.rotation.x, -0.45, 0.2);
        rig.rightLeg.rotation.x = THREE.MathUtils.lerp(rig.rightLeg.rotation.x, -0.32, 0.2);
        rig.leftKnee.rotation.x = THREE.MathUtils.lerp(rig.leftKnee.rotation.x, 0.68, 0.2);
        rig.rightKnee.rotation.x = THREE.MathUtils.lerp(rig.rightKnee.rotation.x, 0.55, 0.2);

        rig.leftArm.rotation.x = THREE.MathUtils.lerp(rig.leftArm.rotation.x, -0.65, 0.2);
        rig.rightArm.rotation.x = THREE.MathUtils.lerp(rig.rightArm.rotation.x, 0.65, 0.2);
        rig.torso.rotation.x = THREE.MathUtils.lerp(rig.torso.rotation.x, 0.12, 0.2);

        if (capeGroup) {
          capeGroup.rotation.x = THREE.MathUtils.lerp(capeGroup.rotation.x, 0.65, 0.25);
          capeGroup.rotation.z = Math.sin(time * 12) * 0.08;
        }
      } else {
        // Descending / Pre-landing pose: legs straightening slightly, arms out for stability
        rig.leftLeg.rotation.x = THREE.MathUtils.lerp(rig.leftLeg.rotation.x, 0.18, 0.2);
        rig.rightLeg.rotation.x = THREE.MathUtils.lerp(rig.rightLeg.rotation.x, 0.12, 0.2);
        rig.leftKnee.rotation.x = THREE.MathUtils.lerp(rig.leftKnee.rotation.x, 0.25, 0.2);
        rig.rightKnee.rotation.x = THREE.MathUtils.lerp(rig.rightKnee.rotation.x, 0.25, 0.2);

        rig.leftArm.rotation.x = THREE.MathUtils.lerp(rig.leftArm.rotation.x, -0.25, 0.2);
        rig.rightArm.rotation.x = THREE.MathUtils.lerp(rig.rightArm.rotation.x, -0.25, 0.2);
        rig.torso.rotation.x = THREE.MathUtils.lerp(rig.torso.rotation.x, -0.06, 0.2);

        if (capeGroup) {
          capeGroup.rotation.x = THREE.MathUtils.lerp(capeGroup.rotation.x, -0.15, 0.2);
        }
      }

      // Sun Halo spins faster during aerial leaps (especially on Double Jump!)
      if (sunHaloGroup) {
        sunHaloGroup.rotation.z += delta * (isDoubleJump ? 6.5 : 3.5);
      }
      rootGroup.position.y = 0.05;
    } else if (isMoving) {
      const sinWalk = Math.sin(walkPhase);

      rig.leftLeg.rotation.x = sinWalk * 0.58;
      rig.rightLeg.rotation.x = -sinWalk * 0.58;

      rig.leftKnee.rotation.x = Math.max(0, sinWalk * 0.65);
      rig.rightKnee.rotation.x = Math.max(0, -sinWalk * 0.65);

      rig.leftArm.rotation.x = -sinWalk * 0.48;
      rig.rightArm.rotation.x = sinWalk * 0.48;

      rig.torso.position.y = 0.85 + Math.abs(sinWalk) * 0.04;
      rig.torso.rotation.y = -sinWalk * 0.07;
      rig.torso.rotation.x = THREE.MathUtils.lerp(rig.torso.rotation.x, 0, 0.15);
      rig.head.rotation.y = sinWalk * 0.035;

      rootGroup.position.y = 0.05 + Math.abs(sinWalk) * 0.03;

      // Cape dynamic billowing
      if (capeGroup) {
        capeGroup.rotation.x = 0.18 + Math.abs(sinWalk) * 0.3 + 0.12;
        capeGroup.rotation.z = sinWalk * 0.06;
      }
      // Sun Halo slight tilt with stride
      if (sunHaloGroup) {
        sunHaloGroup.rotation.z = Math.sin(time * 2) * 0.04;
      }
    } else {
      // Idle breathing stance
      rig.leftLeg.rotation.x = THREE.MathUtils.lerp(rig.leftLeg.rotation.x, 0, 0.1);
      rig.rightLeg.rotation.x = THREE.MathUtils.lerp(rig.rightLeg.rotation.x, 0, 0.1);
      rig.leftKnee.rotation.x = THREE.MathUtils.lerp(rig.leftKnee.rotation.x, 0, 0.1);
      rig.rightKnee.rotation.x = THREE.MathUtils.lerp(rig.rightKnee.rotation.x, 0, 0.1);
      rig.leftArm.rotation.x = THREE.MathUtils.lerp(rig.leftArm.rotation.x, 0, 0.1);
      rig.rightArm.rotation.x = THREE.MathUtils.lerp(rig.rightArm.rotation.x, 0, 0.1);

      rig.torso.position.y = 0.85 + Math.sin(time * 2.0) * 0.015;
      rig.torso.rotation.y = THREE.MathUtils.lerp(rig.torso.rotation.y, 0, 0.1);
      rig.torso.rotation.x = THREE.MathUtils.lerp(rig.torso.rotation.x, 0, 0.1);
      rootGroup.position.y = 0.05;

      // Gentle cape breeze
      if (capeGroup) {
        capeGroup.rotation.x = THREE.MathUtils.lerp(
          capeGroup.rotation.x,
          0.12 + Math.sin(time * 2.5) * 0.05,
          0.1
        );
        capeGroup.rotation.z = THREE.MathUtils.lerp(capeGroup.rotation.z, 0, 0.1);
      }
      // Sun halo slow ethereal rotation
      if (sunHaloGroup) {
        sunHaloGroup.rotation.z = time * 0.15;
      }
    }
  };

  return {
    rootGroup,
    charGroup,
    rig,
    capeGroup,
    sunHaloGroup,
    groundRing,
    auraLight,
    updateAnimation,
  };
}

/**
 * Creates the loyal Companion Pet Recon Drone
 * Floats near the owner's shoulder and follows smoothly
 */
export function createPetDroneCompanion(
  skin: AvatarSkinId = 'panday',
  auraColorHex = '#F59E0B'
): PetDroneInstance {
  const group = new THREE.Group();

  let hullColor = 0x2A1C0E;
  let visorColor = 0xF59E0B;
  let ringColor = 0xD97706;
  let thrusterColor = 0xF97316;

  if (skin === 'babaylan') {
    hullColor = 0x24113A;
    visorColor = 0xC084FC;
    ringColor = 0xA855F7;
    thrusterColor = 0xE879F9;
  } else if (skin === 'jeepney') {
    hullColor = 0x334155;
    visorColor = 0xEAB308;
    ringColor = 0xEF4444;
    thrusterColor = 0xFACC15;
  } else if (skin === 'sentinel') {
    hullColor = 0x0F172A;
    visorColor = 0xEF4444;
    ringColor = 0x94A3B8;
    thrusterColor = 0xDC2626;
  } else if (skin === 'agila') {
    hullColor = 0x1E293B;
    visorColor = 0x06B6D4;
    ringColor = 0x3B82F6;
    thrusterColor = 0x06B6D4;
  }

  // 1. Mini Drone Chassis Capsule
  const bodyGeo = new THREE.SphereGeometry(0.22, 16, 16);
  bodyGeo.scale(1.2, 0.7, 1.4);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: hullColor,
    roughness: 0.35,
    metalness: 0.8,
  });
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
  group.add(bodyMesh);

  // 2. Glowing Visor Eye
  const visorGeo = new THREE.BoxGeometry(0.28, 0.08, 0.15);
  const visorMat = new THREE.MeshBasicMaterial({ color: visorColor });
  const visorMesh = new THREE.Mesh(visorGeo, visorMat);
  visorMesh.position.set(0, 0.05, 0.24);
  group.add(visorMesh);

  // 3. Rotating Gyro Magnet Ring
  const ringGeo = new THREE.TorusGeometry(0.42, 0.02, 8, 24);
  const ringMat = new THREE.MeshBasicMaterial({ color: ringColor });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.rotation.x = Math.PI / 2;
  group.add(ringMesh);

  // 4. Thruster Light & Flare
  const thrusterLight = new THREE.PointLight(thrusterColor, 2.2, 5);
  thrusterLight.position.set(0, -0.15, -0.25);
  group.add(thrusterLight);

  const updateFollow = (
    ownerPos: THREE.Vector3,
    ownerHeading: number,
    time: number,
    delta: number
  ) => {
    // Offset slightly behind and to the right shoulder of owner
    const offsetX = Math.cos(ownerHeading - 0.7) * 1.05;
    const offsetZ = -Math.sin(ownerHeading - 0.7) * 1.05;

    const targetX = ownerPos.x + offsetX;
    const targetZ = ownerPos.z + offsetZ;
    const targetY = ownerPos.y + 1.55 + Math.sin(time * 3.2) * 0.08;

    // Smooth spring physics
    group.position.x = THREE.MathUtils.lerp(group.position.x, targetX, 0.08);
    group.position.y = THREE.MathUtils.lerp(group.position.y, targetY, 0.08);
    group.position.z = THREE.MathUtils.lerp(group.position.z, targetZ, 0.08);

    group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, ownerHeading, 0.12);
    ringMesh.rotation.z = time * 3.5;
  };

  return {
    group,
    ringMesh,
    thrusterLight,
    updateFollow,
  };
}
