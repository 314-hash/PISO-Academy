import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { PisoChatRoom } from '../../services/gunService';

interface Piso3DNetworkGraphProps {
  rooms: PisoChatRoom[];
  activeRoomId: string;
  onSelectRoom: (roomId: string) => void;
  connectedPeersCount?: number;
}

export const Piso3DNetworkGraph: React.FC<Piso3DNetworkGraphProps> = ({
  rooms,
  activeRoomId,
  onSelectRoom,
  connectedPeersCount = 4,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const onSelectRoomRef = useRef(onSelectRoom);

  useEffect(() => {
    onSelectRoomRef.current = onSelectRoom;
  });

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070A10);
    scene.fog = new THREE.FogExp2(0x070A10, 0.02);

    const camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      200
    );
    camera.position.set(0, 16, 26);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0x1E293B, 2.5);
    scene.add(ambientLight);

    const goldLight = new THREE.PointLight(0xF59E0B, 3, 40);
    goldLight.position.set(0, 5, 0);
    scene.add(goldLight);

    const blueLight = new THREE.PointLight(0x06B6D4, 2.5, 30);
    blueLight.position.set(-10, 8, 10);
    scene.add(blueLight);

    // 3. Cyber Floor Grid
    const gridHelper = new THREE.GridHelper(50, 30, 0xF59E0B, 0x1E293B);
    gridHelper.position.y = -4;
    scene.add(gridHelper);

    // 4. Central PISO Chain Validator Consensus Core (L1 Node 2026001)
    const coreGroup = new THREE.Group();
    coreGroup.position.set(0, 0, 0);

    const coreGeo = new THREE.IcosahedronGeometry(2.2, 0);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xF59E0B, wireframe: true });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreGroup.add(coreMesh);

    const innerCoreGeo = new THREE.SphereGeometry(1.2, 16, 16);
    const innerCoreMat = new THREE.MeshBasicMaterial({ color: 0xD97706 });
    const innerCore = new THREE.Mesh(innerCoreGeo, innerCoreMat);
    coreGroup.add(innerCore);

    const coreRingGeo = new THREE.TorusGeometry(3.6, 0.06, 8, 36);
    const coreRingMat = new THREE.MeshBasicMaterial({ color: 0xFBBF24, transparent: true, opacity: 0.7 });
    const coreRing = new THREE.Mesh(coreRingGeo, coreRingMat);
    coreRing.rotation.x = Math.PI / 2;
    coreGroup.add(coreRing);

    scene.add(coreGroup);

    // Helper for floating text billboard sprites
    const createBillboardSprite = (title: string, sub: string, colorHex: string, isActive: boolean) => {
      const canvas = document.createElement('canvas');
      canvas.width = 384;
      canvas.height = 110;
      const ctx = canvas.getContext('2d');
      if (!ctx) return new THREE.Sprite();

      ctx.fillStyle = isActive ? 'rgba(245, 158, 11, 0.22)' : 'rgba(11, 15, 23, 0.85)';
      ctx.strokeStyle = colorHex;
      ctx.lineWidth = isActive ? 4 : 2;
      ctx.beginPath();
      ctx.roundRect(8, 8, 368, 94, 18);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 30px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(title, 192, 52);

      ctx.fillStyle = colorHex;
      ctx.font = 'bold 18px monospace';
      ctx.fillText(sub, 192, 84);

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(4.2, 1.2, 1);
      return sprite;
    };

    // 5. Orbiting Room Nodes
    const roomMeshes: {
      group: THREE.Group;
      room: PisoChatRoom;
      line: THREE.Line;
      angle: number;
      radius: number;
      speed: number;
    }[] = [];

    const roomColors: Record<string, number> = {
      governance: 0xF59E0B, // Sun Gold
      devnet: 0x3B82F6,     // Azure
      security: 0x10B981,   // Emerald
      defi: 0xA855F7,       // Purple
      hackathon: 0xEC4899,  // Pink
      general: 0x06B6D4,    // Cyan
    };

    const count = Math.max(rooms.length, 1);
    rooms.forEach((room, idx) => {
      const g = new THREE.Group();
      const radius = 10.5 + (idx % 2) * 2.5;
      const angle = (idx / count) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = Math.sin(idx * 1.5) * 1.8;
      g.position.set(x, y, z);

      const color = roomColors[room.category] || 0x06B6D4;
      const isActive = room.id === activeRoomId;

      // Room Outer Ring
      const rGeo = new THREE.RingGeometry(0.8, 1.05, 24);
      const rMat = new THREE.MeshBasicMaterial({
        color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: isActive ? 0.95 : 0.65,
      });
      const ringMesh = new THREE.Mesh(rGeo, rMat);
      ringMesh.rotation.x = Math.PI / 2;
      g.add(ringMesh);

      // Node Diamond
      const dGeo = new THREE.OctahedronGeometry(isActive ? 0.9 : 0.7);
      const dMat = new THREE.MeshBasicMaterial({ color, wireframe: true });
      const diamond = new THREE.Mesh(dGeo, dMat);
      g.add(diamond);

      // 3D Billboard Label
      const label = createBillboardSprite(
        `#${room.id.substring(0, 14)}`,
        room.category.toUpperCase(),
        '#' + color.toString(16).padStart(6, '0'),
        isActive
      );
      label.position.y = 1.8;
      g.add(label);

      // Connecting Laser Line from central core to room
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(x, y, z),
      ]);
      const lineMat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: isActive ? 0.6 : 0.25,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      scene.add(line);

      scene.add(g);
      roomMeshes.push({
        group: g,
        room,
        line,
        angle,
        radius,
        speed: 0.06 + (idx % 3) * 0.02,
      });
    });

    // 6. Connected Peer Nodes (Orbiting peripheral swarm)
    const peerNodes: { mesh: THREE.Mesh; angle: number; radius: number; speed: number; y: number }[] = [];
    const peerCount = Math.max(3, connectedPeersCount);
    for (let p = 0; p < peerCount; p++) {
      const pGeo = new THREE.SphereGeometry(0.3, 12, 12);
      const pMat = new THREE.MeshBasicMaterial({ color: 0x06B6D4 });
      const pMesh = new THREE.Mesh(pGeo, pMat);

      const pRadius = 15.5 + (p % 3) * 1.5;
      const pAngle = (p / peerCount) * Math.PI * 2;
      const py = (Math.random() - 0.5) * 4;

      pMesh.position.set(Math.cos(pAngle) * pRadius, py, Math.sin(pAngle) * pRadius);
      scene.add(pMesh);

      peerNodes.push({ mesh: pMesh, angle: pAngle, radius: pRadius, speed: 0.12, y: py });
    }

    // 7. Dynamic Data Pulse Photons (travel along lines from core to rooms)
    const photonCount = 8;
    const photons: { mesh: THREE.Mesh; progress: number; roomIdx: number }[] = [];
    for (let i = 0; i < photonCount; i++) {
      const ptGeo = new THREE.SphereGeometry(0.2, 8, 8);
      const ptMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
      const ptMesh = new THREE.Mesh(ptGeo, ptMat);
      scene.add(ptMesh);
      photons.push({
        mesh: ptMesh,
        progress: (i / photonCount),
        roomIdx: i % roomMeshes.length,
      });
    }

    // 8. Interaction: Raycast clicking to select room
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      for (const { group, room } of roomMeshes) {
        const hits = raycaster.intersectObjects(group.children, true);
        if (hits.length > 0) {
          onSelectRoomRef.current(room.id);
          break;
        }
      }
    };

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      let isOverRoom = false;
      for (const { group } of roomMeshes) {
        if (raycaster.intersectObjects(group.children, true).length > 0) {
          isOverRoom = true;
          break;
        }
      }
      container.style.cursor = isOverRoom ? 'pointer' : 'default';
    };

    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('pointermove', handlePointerMove);

    // 9. Orbit Camera drag control
    let isDragging = false;
    let prevX = 0;
    let cameraAngle = 0;

    const handleDragStart = (e: MouseEvent) => {
      if (e.button === 0) {
        isDragging = true;
        prevX = e.clientX;
      }
    };
    const handleDragMove = (e: MouseEvent) => {
      if (isDragging) {
        const dx = e.clientX - prevX;
        cameraAngle -= dx * 0.006;
        prevX = e.clientX;
      }
    };
    const handleDragEnd = () => {
      isDragging = false;
    };

    window.addEventListener('mousedown', handleDragStart);
    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);

    // 10. Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Rotate Consensus Core
      coreGroup.rotation.y = time * 0.5;
      coreGroup.rotation.x = Math.sin(time * 0.8) * 0.15;
      coreRing.rotation.z = time * 0.8;

      // Rotate Rooms & update connection lines
      roomMeshes.forEach(({ group, line, radius, speed }, idx) => {
        const a = (idx / roomMeshes.length) * Math.PI * 2 + time * speed * 0.4;
        const x = Math.cos(a) * radius;
        const z = Math.sin(a) * radius;
        const y = Math.sin(time * 1.2 + idx) * 1.2;

        group.position.set(x, y, z);
        group.children[1].rotation.y = time * 1.5; // rotate diamond

        // Update line vertices
        const posAttr = line.geometry.attributes.position as THREE.BufferAttribute;
        posAttr.setXYZ(0, 0, 0, 0);
        posAttr.setXYZ(1, x, y, z);
        posAttr.needsUpdate = true;
      });

      // Update peer nodes
      peerNodes.forEach(({ mesh, radius, speed, y }, pIdx) => {
        const pa = (pIdx / peerNodes.length) * Math.PI * 2 - time * speed * 0.3;
        mesh.position.x = Math.cos(pa) * radius;
        mesh.position.z = Math.sin(pa) * radius;
        mesh.position.y = y + Math.sin(time * 2 + pIdx) * 0.5;
      });

      // Update photon pulses along lines
      photons.forEach((pt) => {
        pt.progress += delta * 0.65;
        if (pt.progress > 1) {
          pt.progress = 0;
          pt.roomIdx = (pt.roomIdx + 1) % Math.max(roomMeshes.length, 1);
        }
        const targetRoom = roomMeshes[pt.roomIdx];
        if (targetRoom) {
          pt.mesh.position.lerpVectors(
            new THREE.Vector3(0, 0, 0),
            targetRoom.group.position,
            pt.progress
          );
        }
      });

      // Orbit camera slowly unless user dragged
      const targetCamAngle = cameraAngle + time * 0.05;
      camera.position.x = Math.sin(targetCamAngle) * 26;
      camera.position.z = Math.cos(targetCamAngle) * 26;
      camera.lookAt(0, 0.5, 0);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousedown', handleDragStart);
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointermove', handlePointerMove);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [rooms, activeRoomId, connectedPeersCount]);

  return (
    <div className="relative w-full h-56 md:h-64 rounded-2xl overflow-hidden border border-amber-500/30 bg-[#070A10] shadow-[0_0_30px_rgba(0,0,0,0.8)]">
      <div ref={containerRef} className="w-full h-full" />
      
      {/* 3D HUD Overlay */}
      <div className="absolute top-2 left-3 z-10 flex items-center space-x-2 pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span className="font-mono text-[10px] font-bold text-amber-300 tracking-wider">
          PISO P2P MESH GRAPH // THREE.JS 3D CONSOLE
        </span>
      </div>

      <div className="absolute bottom-2 right-3 z-10 flex items-center space-x-3 text-[9px] font-mono text-slate-400 pointer-events-none">
        <span>Click node to select room</span>
        <span>Drag to orbit</span>
      </div>
    </div>
  );
};
