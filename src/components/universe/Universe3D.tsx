import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { Category, Topic, TopicConnection } from '../../types/knowledge';
import { calculateOrbitalPositions } from '../../utils/knowledgeLogic';

interface Universe3DProps {
  categories: Category[];
  topics: Topic[];
  connections: TopicConnection[];
  selectedCategoryId: string | null;
  selectedTopicId: string | null;
  highlightQuery: string;
  resetCounter: number;
  onSelectCategory: (categoryId: string | null) => void;
  onSelectTopic: (topicId: string | null) => void;
  onHoverItem: (info: { title: string; subtitle: string; x: number; y: number } | null) => void;
  onWebGLUnavailable: () => void;
}

const _goalPos = new THREE.Vector3();
const _goalTarget = new THREE.Vector3();

function createPlanetTexture(hexColor: string, seedIndex: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const base = new THREE.Color(hexColor);
    const dark = base.clone().multiplyScalar(0.45);
    const light = base.clone().lerp(new THREE.Color(0xffffff), 0.35);

    const grad = ctx.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0, `#${dark.getHexString()}`);
    grad.addColorStop(0.5, `#${base.getHexString()}`);
    grad.addColorStop(1, `#${dark.getHexString()}`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 128);

    // Procedural atmospheric bands
    for (let i = 0; i < 14; i++) {
      const y = ((i * 19 + seedIndex * 11) % 128);
      const h = 3 + ((i + seedIndex) % 7);
      ctx.fillStyle = i % 2 === 0 ? `rgba(255,255,255,0.10)` : `rgba(0,0,0,0.16)`;
      ctx.fillRect(0, y, 256, h);
    }

    // Bright equatorial meridian accent
    ctx.fillStyle = `#${light.getHexString()}33`;
    ctx.fillRect(0, 58, 256, 10);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

function createAccretionTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const cx = 256;
    const cy = 256;
    const grad = ctx.createRadialGradient(cx, cy, 48, cx, cy, 250);
    grad.addColorStop(0.0, 'rgba(255, 244, 200, 0.98)');
    grad.addColorStop(0.22, 'rgba(245, 194, 92, 0.92)');
    grad.addColorStop(0.48, 'rgba(217, 136, 42, 0.55)');
    grad.addColorStop(0.75, 'rgba(94, 162, 239, 0.22)');
    grad.addColorStop(1.0, 'rgba(6, 8, 14, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = 'rgba(255, 232, 163, 0.28)';
    for (let r = 68; r < 220; r += 16) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function Universe3D({
  categories,
  topics,
  connections,
  selectedCategoryId,
  selectedTopicId,
  highlightQuery,
  resetCounter,
  onSelectCategory,
  onSelectTopic,
  onHoverItem,
  onWebGLUnavailable,
}: Universe3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  const callbacksRef = useRef({
    onSelectCategory,
    onSelectTopic,
    onHoverItem,
    onWebGLUnavailable,
  });
  callbacksRef.current = {
    onSelectCategory,
    onSelectTopic,
    onHoverItem,
    onWebGLUnavailable,
  };

  const sceneStateRef = useRef<{
    rebuildData?: () => void;
    focusSelection?: () => void;
    resetView?: () => void;
    updateHighlights?: () => void;
  }>({});

  const propsRef = useRef({
    categories,
    topics,
    connections,
    selectedCategoryId,
    selectedTopicId,
    highlightQuery,
  });
  propsRef.current = {
    categories,
    topics,
    connections,
    selectedCategoryId,
    selectedTopicId,
    highlightQuery,
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Software WebGL detection per threejs skill
    const isSoftwareGl = (() => {
      try {
        const probe = document.createElement('canvas');
        const gl = probe.getContext('webgl2') || probe.getContext('webgl');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      callbacksRef.current.onWebGLUnavailable();
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth || 800, container.clientHeight || 600);
    renderer.domElement.setAttribute('data-testid', 'universe-3d-canvas');
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05070d);
    scene.fog = new THREE.FogExp2(0x05070d, 0.0042);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(
      52,
      (container.clientWidth || 800) / Math.max(1, container.clientHeight || 600),
      0.2,
      500
    );
    camera.position.set(0, 42, 74);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 8;
    controls.maxDistance = 165;
    controls.maxPolarAngle = Math.PI * 0.85;

    // Warm/cool galaxy lighting rig
    const hemi = new THREE.HemisphereLight(0x8bb8ff, 0x161224, 0.85);
    scene.add(hemi);
    const coreLight = new THREE.PointLight(0xffcf6e, 4.5, 160, 1.1);
    coreLight.position.set(0, 2, 0);
    scene.add(coreLight);
    const rimLight = new THREE.DirectionalLight(0x8b7cf6, 1.1);
    rimLight.position.set(-45, 35, -35);
    scene.add(rimLight);

    // Deep-space starfield (2,600 stars)
    const starCount = 2600;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    const palette = [
      new THREE.Color(0xf8e7b5),
      new THREE.Color(0x9ec5ff),
      new THREE.Color(0xc4b5fd),
      new THREE.Color(0xffffff),
    ];
    for (let i = 0; i < starCount; i++) {
      const r = 75 + ((i * 37) % 140);
      const theta = (i * 2.39996) % (Math.PI * 2);
      const phi = Math.acos(2 * ((i % 97) / 97) - 1);
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.cos(phi) * 0.65;
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      const c = palette[i % palette.length];
      starColors[i * 3] = c.r;
      starColors[i * 3 + 1] = c.g;
      starColors[i * 3 + 2] = c.b;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const starMat = new THREE.PointsMaterial({
      size: 0.55,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // Central Golden Black Hole ("DIGITAL MARKETING") — Multi-Part THREE.Group
    const blackHoleGroup = new THREE.Group();
    const coreGeo = new THREE.SphereGeometry(3.4, 32, 32);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0x050507,
      roughness: 0.12,
      metalness: 0.92,
      clearcoat: 1.0,
    });
    const eventHorizon = new THREE.Mesh(coreGeo, coreMat);
    blackHoleGroup.add(eventHorizon);

    const photonGeo = new THREE.TorusGeometry(3.65, 0.18, 16, 64);
    const photonMat = new THREE.MeshStandardMaterial({
      color: 0xffd57e,
      emissive: 0xf5b841,
      emissiveIntensity: 2.0,
      roughness: 0.2,
    });
    const photonRing = new THREE.Mesh(photonGeo, photonMat);
    photonRing.rotation.x = Math.PI / 2;
    blackHoleGroup.add(photonRing);

    const accretionTex = createAccretionTexture();
    const accretionGeo = new THREE.RingGeometry(4.0, 12.5, 64);
    const accretionMat = new THREE.MeshBasicMaterial({
      map: accretionTex,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const accretionDisk = new THREE.Mesh(accretionGeo, accretionMat);
    accretionDisk.rotation.x = -Math.PI / 2 + 0.22;
    blackHoleGroup.add(accretionDisk);

    const haloGeo = new THREE.TorusGeometry(6.8, 0.08, 12, 64);
    const haloMat = new THREE.MeshStandardMaterial({
      color: 0x5ea2ef,
      emissive: 0x5ea2ef,
      emissiveIntensity: 0.9,
      transparent: true,
      opacity: 0.55,
    });
    const outerHalo = new THREE.Mesh(haloGeo, haloMat);
    outerHalo.rotation.x = Math.PI / 3;
    outerHalo.rotation.y = 0.4;
    blackHoleGroup.add(outerHalo);
    scene.add(blackHoleGroup);

    // Dynamic Knowledge Graph Container
    const graphGroup = new THREE.Group();
    scene.add(graphGroup);

    let interactables: THREE.Object3D[] = [];
    const planetPositions = new Map<string, THREE.Vector3>();
    const nodePositions = new Map<string, THREE.Vector3>();
    const planetMeshes = new Map<string, THREE.Group>();
    const nodeMeshes = new Map<string, THREE.Mesh>();
    const disposableTextures: THREE.Texture[] = [accretionTex];
    const disposableGeometries: THREE.BufferGeometry[] = [starGeo, coreGeo, photonGeo, accretionGeo, haloGeo];
    const disposableMaterials: THREE.Material[] = [starMat, coreMat, photonMat, accretionMat, haloMat];

    let cameraTransitioning = false;
    let lastTime = performance.now();
    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;
    let disposed = false;

    function afterDraw(cb: () => void) {
      if (disposed) return;
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync?.(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      if (!sync) {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const poll = () => {
        if (disposed) {
          gl.deleteSync(sync);
          return;
        }
        const state = gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function requestRender() {
      if (disposed) return;
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame(() => {
        if (disposed) return;
        renderDirty = false;
        const now = performance.now();
        const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
        lastTime = now;

        if (cameraTransitioning) {
          camera.position.x = THREE.MathUtils.damp(camera.position.x, _goalPos.x, 5.5, dt);
          camera.position.y = THREE.MathUtils.damp(camera.position.y, _goalPos.y, 5.5, dt);
          camera.position.z = THREE.MathUtils.damp(camera.position.z, _goalPos.z, 5.5, dt);
          controls.target.x = THREE.MathUtils.damp(controls.target.x, _goalTarget.x, 5.5, dt);
          controls.target.y = THREE.MathUtils.damp(controls.target.y, _goalTarget.y, 5.5, dt);
          controls.target.z = THREE.MathUtils.damp(controls.target.z, _goalTarget.z, 5.5, dt);

          if (
            camera.position.distanceTo(_goalPos) < 0.12 &&
            controls.target.distanceTo(_goalTarget) < 0.08
          ) {
            cameraTransitioning = false;
          } else {
            renderDirty = true;
          }
        }

        controls.update();
        renderer.render(scene, camera);

        const done = () => {
          renderBusy = false;
          if (renderDirty && !disposed) requestRender();
        };
        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    }

    function clearGraph() {
      while (graphGroup.children.length > 0) {
        const child = graphGroup.children[0];
        graphGroup.remove(child);
      }
      interactables = [];
      planetPositions.clear();
      nodePositions.clear();
      planetMeshes.clear();
      nodeMeshes.clear();
    }

    function rebuildData() {
      clearGraph();
      const { categories: cats, topics: tps, connections: conns } = propsRef.current;
      const layout = calculateOrbitalPositions(cats, tps);

      // Build planets (Composite 4-part THREE.Group)
      const sharedNodeGeo = new THREE.SphereGeometry(0.42, 16, 16);
      disposableGeometries.push(sharedNodeGeo);

      cats.forEach((cat, idx) => {
        const pos = layout.planets.get(cat.id);
        if (!pos) return;
        const pVec = new THREE.Vector3(pos.x, pos.y, pos.z);
        planetPositions.set(cat.id, pVec);

        // Orbit path ring around black hole
        const orbitGeo = new THREE.RingGeometry(cat.orbitRadius - 0.06, cat.orbitRadius + 0.06, 96);
        const orbitMat = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.09,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        const orbitRing = new THREE.Mesh(orbitGeo, orbitMat);
        orbitRing.rotation.x = Math.PI / 2;
        orbitRing.position.y = pos.y * 0.2;
        graphGroup.add(orbitRing);
        disposableGeometries.push(orbitGeo);
        disposableMaterials.push(orbitMat);

        // Planet Group
        const pGroup = new THREE.Group();
        pGroup.position.copy(pVec);

        const pTex = createPlanetTexture(cat.color, idx);
        disposableTextures.push(pTex);

        const sphereGeo = new THREE.SphereGeometry(cat.planetSize, 28, 28);
        const sphereMat = new THREE.MeshStandardMaterial({
          map: pTex,
          color: 0xffffff,
          roughness: 0.45,
          metalness: 0.25,
          emissive: new THREE.Color(cat.color),
          emissiveIntensity: 0.16,
        });
        const planetBody = new THREE.Mesh(sphereGeo, sphereMat);
        planetBody.userData = {
          kind: 'category',
          categoryId: cat.id,
          title: cat.name,
          subtitle: `${tps.filter((tp) => tp.categoryId === cat.id).length} knowledge nodes`,
        };
        planetBody.layers.enable(1);
        pGroup.add(planetBody);
        interactables.push(planetBody);

        // Planetary Ring
        const ringGeo = new THREE.TorusGeometry(cat.planetSize * 1.48, 0.07, 10, 48);
        const ringMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(cat.color),
          metalness: 0.85,
          roughness: 0.2,
          transparent: true,
          opacity: 0.72,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2.4;
        ringMesh.rotation.y = idx * 0.4;
        pGroup.add(ringMesh);

        // Atmospheric Shell
        const atmoGeo = new THREE.SphereGeometry(cat.planetSize * 1.13, 20, 20);
        const atmoMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(cat.color),
          transparent: true,
          opacity: 0.15,
          depthWrite: false,
        });
        const atmo = new THREE.Mesh(atmoGeo, atmoMat);
        pGroup.add(atmo);

        // Polar Beacon
        const beaconGeo = new THREE.TorusGeometry(cat.planetSize * 0.65, 0.04, 8, 32);
        const beacon = new THREE.Mesh(beaconGeo, ringMat);
        beacon.position.y = cat.planetSize * 1.25;
        beacon.rotation.x = Math.PI / 2;
        pGroup.add(beacon);

        disposableGeometries.push(sphereGeo, ringGeo, atmoGeo, beaconGeo);
        disposableMaterials.push(sphereMat, ringMat, atmoMat);

        graphGroup.add(pGroup);
        planetMeshes.set(cat.id, pGroup);
      });

      // Topic Nodes + Tethers to Parent Planet
      const tetherPoints: number[] = [];
      const tetherColors: number[] = [];
      const catColorMap = new Map(cats.map((c) => [c.id, new THREE.Color(c.color)]));

      tps.forEach((topic) => {
        const nPos = layout.nodes.get(topic.id);
        const pVec = planetPositions.get(topic.categoryId);
        if (!nPos || !pVec) return;

        const baseColor = catColorMap.get(topic.categoryId) ?? new THREE.Color(0xe5b85c);
        const statusTint =
          topic.status === 'completed'
            ? new THREE.Color(0x34d399)
            : topic.status === 'learning'
              ? new THREE.Color(0xe5b85c)
              : baseColor;

        const nMat = new THREE.MeshStandardMaterial({
          color: statusTint,
          emissive: statusTint,
          emissiveIntensity: topic.status === 'completed' ? 0.85 : 0.45,
          roughness: 0.25,
          metalness: 0.4,
          transparent: true,
          opacity: 0.95,
        });
        const nodeMesh = new THREE.Mesh(sharedNodeGeo, nMat);
        nodeMesh.position.set(nPos.x, nPos.y, nPos.z);
        nodeMesh.userData = {
          kind: 'topic',
          topicId: topic.id,
          categoryId: topic.categoryId,
          title: topic.title,
          subtitle: topic.shortDefinition,
        };
        nodeMesh.layers.enable(1);
        graphGroup.add(nodeMesh);
        interactables.push(nodeMesh);
        nodePositions.set(topic.id, nodeMesh.position.clone());
        nodeMeshes.set(topic.id, nodeMesh);
        disposableMaterials.push(nMat);

        tetherPoints.push(pVec.x, pVec.y, pVec.z, nPos.x, nPos.y, nPos.z);
        tetherColors.push(
          baseColor.r,
          baseColor.g,
          baseColor.b,
          baseColor.r,
          baseColor.g,
          baseColor.b
        );
      });

      if (tetherPoints.length > 0) {
        const tetherGeo = new THREE.BufferGeometry();
        tetherGeo.setAttribute('position', new THREE.Float32BufferAttribute(tetherPoints, 3));
        tetherGeo.setAttribute('color', new THREE.Float32BufferAttribute(tetherColors, 3));
        const tetherMat = new THREE.LineBasicMaterial({
          vertexColors: true,
          transparent: true,
          opacity: 0.22,
        });
        graphGroup.add(new THREE.LineSegments(tetherGeo, tetherMat));
        disposableGeometries.push(tetherGeo);
        disposableMaterials.push(tetherMat);
      }

      // Cross-topic Knowledge Connections (glowing golden-blue links)
      const connPoints: number[] = [];
      conns.forEach((c) => {
        const a = nodePositions.get(c.sourceTopicId);
        const b = nodePositions.get(c.targetTopicId);
        if (a && b) {
          connPoints.push(a.x, a.y, a.z, b.x, b.y, b.z);
        }
      });

      if (connPoints.length > 0) {
        const connGeo = new THREE.BufferGeometry();
        connGeo.setAttribute('position', new THREE.Float32BufferAttribute(connPoints, 3));
        const connMat = new THREE.LineBasicMaterial({
          color: 0xe5b85c,
          transparent: true,
          opacity: 0.62,
        });
        graphGroup.add(new THREE.LineSegments(connGeo, connMat));
        disposableGeometries.push(connGeo);
        disposableMaterials.push(connMat);
      }

      updateHighlights();
      requestRender();
    }

    function updateHighlights() {
      const { selectedCategoryId: selCat, selectedTopicId: selTopic, highlightQuery: hq, topics: tps } =
        propsRef.current;
      const q = hq.trim().toLowerCase();
      const topicById = new Map(tps.map((tp) => [tp.id, tp]));

      planetMeshes.forEach((group, catId) => {
        const dimmed = Boolean(selCat && selCat !== catId);
        group.scale.setScalar(selCat === catId ? 1.18 : 1.0);
        group.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
            if (mat && 'opacity' in mat && mat.transparent) {
              mat.opacity = dimmed ? 0.22 : 0.72;
            }
          }
        });
      });

      nodeMeshes.forEach((mesh, topicId) => {
        const tp = topicById.get(topicId);
        if (!tp) return;
        const matchesQuery = q
          ? `${tp.title} ${tp.shortDefinition} ${tp.tags.join(' ')}`.toLowerCase().includes(q)
          : false;
        const isSelected = selTopic === topicId;
        const inSelectedCat = selCat ? tp.categoryId === selCat : true;

        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (isSelected || matchesQuery) {
          mesh.scale.setScalar(isSelected ? 2.1 : 1.75);
          mat.emissiveIntensity = 1.65;
          mat.opacity = 1.0;
        } else if (!inSelectedCat || (q && !matchesQuery)) {
          mesh.scale.setScalar(0.75);
          mat.emissiveIntensity = 0.15;
          mat.opacity = 0.22;
        } else {
          mesh.scale.setScalar(1.0);
          mat.emissiveIntensity = tp.status === 'completed' ? 0.85 : 0.45;
          mat.opacity = 0.95;
        }
      });

      requestRender();
    }

    function focusSelection() {
      const { selectedTopicId: selTopic, selectedCategoryId: selCat } = propsRef.current;
      if (selTopic && nodePositions.has(selTopic)) {
        const p = nodePositions.get(selTopic)!;
        _goalTarget.copy(p);
        _goalPos.set(p.x + 6, p.y + 4.5, p.z + 9);
        cameraTransitioning = true;
        requestRender();
        return;
      }
      if (selCat && planetPositions.has(selCat)) {
        const p = planetPositions.get(selCat)!;
        _goalTarget.copy(p);
        _goalPos.set(p.x * 1.32, p.y + 10, p.z * 1.32 + 12);
        cameraTransitioning = true;
        requestRender();
      }
    }

    function resetView() {
      _goalTarget.set(0, 0, 0);
      _goalPos.set(0, 42, 74);
      cameraTransitioning = true;
      requestRender();
    }

    sceneStateRef.current = {
      rebuildData,
      focusSelection,
      resetView,
      updateHighlights,
    };

    // Raycasting for hover & click
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    const pointer = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };
    let lastHoverCheck = 0;

    const updatePointer = (ev: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((ev.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
      pointer.y = -((ev.clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1;
    };

    const onPointerMove = (ev: PointerEvent) => {
      const now = performance.now();
      if (now - lastHoverCheck < 50) return;
      lastHoverCheck = now;
      updatePointer(ev);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(interactables, false);
      if (hits.length > 0) {
        const data = hits[0].object.userData;
        renderer.domElement.style.cursor = 'pointer';
        callbacksRef.current.onHoverItem({
          title: String(data.title || ''),
          subtitle: String(data.subtitle || ''),
          x: ev.clientX,
          y: ev.clientY,
        });
      } else {
        renderer.domElement.style.cursor = 'grab';
        callbacksRef.current.onHoverItem(null);
      }
    };

    const onPointerDown = (ev: PointerEvent) => {
      pointerDownPos = { x: ev.clientX, y: ev.clientY };
    };

    const onPointerUp = (ev: PointerEvent) => {
      const dist = Math.hypot(ev.clientX - pointerDownPos.x, ev.clientY - pointerDownPos.y);
      if (dist > 6) return; // Dragging camera, not clicking
      updatePointer(ev);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(interactables, false);
      if (hits.length > 0) {
        const data = hits[0].object.userData;
        if (data.kind === 'topic' && data.topicId) {
          callbacksRef.current.onSelectTopic(String(data.topicId));
        } else if (data.kind === 'category' && data.categoryId) {
          callbacksRef.current.onSelectCategory(String(data.categoryId));
        }
      }
    };

    const onControlsStart = () => {
      cameraTransitioning = false;
    };
    const onControlsChange = () => {
      requestRender();
    };
    const onResize = () => {
      if (!container || disposed) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    };

    const onContextLost = (ev: Event) => {
      ev.preventDefault();
      callbacksRef.current.onWebGLUnavailable();
    };

    controls.addEventListener('start', onControlsStart);
    controls.addEventListener('change', onControlsChange);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    window.addEventListener('resize', onResize);

    rebuildData();
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }
    focusSelection();
    requestRender();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      controls.removeEventListener('start', onControlsStart);
      controls.removeEventListener('change', onControlsChange);
      controls.dispose();
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      window.removeEventListener('resize', onResize);
      disposableGeometries.forEach((g) => g.dispose());
      disposableMaterials.forEach((m) => m.dispose());
      disposableTextures.forEach((t) => t.dispose());
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    sceneStateRef.current.rebuildData?.();
  }, [categories, topics, connections]);

  useEffect(() => {
    sceneStateRef.current.updateHighlights?.();
    sceneStateRef.current.focusSelection?.();
  }, [selectedCategoryId, selectedTopicId, highlightQuery]);

  useEffect(() => {
    if (resetCounter > 0) {
      sceneStateRef.current.resetView?.();
    }
  }, [resetCounter]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 bg-[#05070d]"
      data-focused-planet={selectedCategoryId ?? ''}
      data-focused-topic={selectedTopicId ?? ''}
    />
  );
}
