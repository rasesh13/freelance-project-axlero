import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Layers, RotateCcw } from 'lucide-react';

export default function ArchitecturalCanvas({ className = '' }) {
  const containerRef = useRef(null);
  const [skeletonMode, setSkeletonMode] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const skeletonModeRef = useRef(skeletonMode);
  skeletonModeRef.current = skeletonMode;

  const resetTriggerRef = useRef(0);

  const handleResetOrientation = () => {
    resetTriggerRef.current += 1;
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- 1. Scene & Camera Setup ---
    const scene = new THREE.Scene();

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 560;

    const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 100);
    // Framed to match the majestic perspective of Reference Image 1
    camera.position.set(0.4, 0.5, 12.0);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.28;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // --- 2. Procedural Architectural Concrete Bump Texture ---
    const createConcreteTexture = () => {
      const size = 512;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#F5F2EB';
      ctx.fillRect(0, 0, size, size);

      // Fine aggregate grain
      const imgData = ctx.getImageData(0, 0, size, size);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 16;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
      }
      ctx.putImageData(imgData, 0, 0);

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(4, 4);
      return texture;
    };

    const concreteBumpMap = createConcreteTexture();

    // --- 3. Physical Materials ---
    // Pristine White Architectural Concrete (Exterior Shell & Fins)
    const whiteConcreteMaterial = new THREE.MeshStandardMaterial({
      color: 0xfcf9f5,
      roughness: 0.62,
      metalness: 0.03,
      bumpMap: concreteBumpMap,
      bumpScale: 0.01,
      side: THREE.DoubleSide,
    });

    // Warm Architectural Travertine for Recessed Inner Cove
    const warmCoveMaterial = new THREE.MeshStandardMaterial({
      color: 0xf7ede2,
      roughness: 0.72,
      metalness: 0.02,
      bumpMap: concreteBumpMap,
      bumpScale: 0.012,
      side: THREE.DoubleSide,
    });

    // Grounded Foundation Concrete Material
    const baseConcreteMaterial = new THREE.MeshStandardMaterial({
      color: 0xe6e0d5,
      roughness: 0.75,
      metalness: 0.03,
      bumpMap: concreteBumpMap,
      bumpScale: 0.016,
    });

    // Satin Architectural Steel for Internal Framework
    const steelMaterial = new THREE.MeshStandardMaterial({
      color: 0xc6beb5,
      metalness: 0.92,
      roughness: 0.2,
    });

    // Warm Copper Anodized Tension Connectors
    const copperMaterial = new THREE.MeshStandardMaterial({
      color: 0xe87a38,
      metalness: 0.88,
      roughness: 0.25,
    });

    // Structural Schematic Line Material
    const skeletalLineMaterial = new THREE.LineBasicMaterial({
      color: 0xf36b21,
      transparent: true,
      opacity: 0.4,
    });

    // --- 4. Architectural Lighting ---
    // Natural Soft Skylight
    const hemiLight = new THREE.HemisphereLight(0xfffefb, 0xe2dcce, 1.4);
    scene.add(hemiLight);

    // Warm Sun Directional Light (From upper left, casting soft building shadows)
    const sunLight = new THREE.DirectionalLight(0xfff7ed, 2.6);
    sunLight.position.set(8, 15, 9);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.bias = -0.0003;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 30;
    sunLight.shadow.camera.left = -6;
    sunLight.shadow.camera.right = 6;
    sunLight.shadow.camera.top = 6;
    sunLight.shadow.camera.bottom = -6;
    scene.add(sunLight);

    // Soft Ambient Fill Light
    const fillLight = new THREE.DirectionalLight(0xffede0, 0.75);
    fillLight.position.set(-8, 3, 5);
    scene.add(fillLight);

    // INTEGRATED WARM ORANGE ARCHITECTURAL COVE LIGHTS
    // Embedded deep inside the building's recessed cove, washing warm light through the louvers
    const orangeCoveLight1 = new THREE.PointLight(0xf36b21, 9.5, 14, 1.5);
    orangeCoveLight1.position.set(0.4, 0.1, 0.3);
    scene.add(orangeCoveLight1);

    const orangeCoveLight2 = new THREE.PointLight(0xffa54a, 6.5, 11, 1.3);
    orangeCoveLight2.position.set(-0.6, 0.7, -0.3);
    scene.add(orangeCoveLight2);

    const coveSpotLight = new THREE.SpotLight(0xf36b21, 5.5, 12, Math.PI / 3, 0.6, 1.3);
    coveSpotLight.position.set(-1.4, 0.1, 0.7);
    coveSpotLight.target.position.set(1.4, 0.3, -0.6);
    scene.add(coveSpotLight);
    scene.add(coveSpotLight.target);

    // --- 5. ONE CONTINUOUS ARCHITECTURAL BUILDING MODEL ---
    // Master Group anchored on the right side of the hero
    const buildingMasterGroup = new THREE.Group();
    buildingMasterGroup.position.set(0.4, -0.2, 0);
    scene.add(buildingMasterGroup);

    // Layer Groups for Unified Composition with subtle parallax:
    const foundationGroup = new THREE.Group();
    const continuousShellGroup = new THREE.Group();
    const structuralRibsGroup = new THREE.Group();
    const internalSkeletonGroup = new THREE.Group();

    buildingMasterGroup.add(foundationGroup);
    buildingMasterGroup.add(continuousShellGroup);
    buildingMasterGroup.add(structuralRibsGroup);
    buildingMasterGroup.add(internalSkeletonGroup);

    // -------------------------------------------------------------
    // PART 1: THE FOUNDATION & GROUNDED CONCRETE PARAPET WALL
    // -------------------------------------------------------------
    // Plinth wall along the bottom right grounding the architecture firmly into physical space
    const parapetWallGeo = new THREE.BoxGeometry(8.8, 1.3, 1.8);
    const parapetWallMesh = new THREE.Mesh(parapetWallGeo, baseConcreteMaterial);
    parapetWallMesh.position.set(2.0, -2.45, 1.3);
    parapetWallMesh.rotation.set(-0.03, -0.2, 0.02);
    parapetWallMesh.receiveShadow = true;
    foundationGroup.add(parapetWallMesh);

    // Crisp Coping Edge Stone
    const copingGeo = new THREE.BoxGeometry(9.0, 0.22, 1.95);
    const copingMesh = new THREE.Mesh(copingGeo, baseConcreteMaterial);
    copingMesh.position.set(2.0, -1.74, 1.3);
    copingMesh.rotation.set(-0.03, -0.2, 0.02);
    copingMesh.receiveShadow = true;
    foundationGroup.add(copingMesh);

    // Structural Base Plinth Footing extending under the cantilever
    const footingGeo = new THREE.BoxGeometry(5.5, 0.8, 4.0);
    const footingMesh = new THREE.Mesh(footingGeo, baseConcreteMaterial);
    footingMesh.position.set(2.4, -2.9, 0.0);
    footingMesh.receiveShadow = true;
    foundationGroup.add(footingMesh);

    // -------------------------------------------------------------
    // PART 2: THE CONTINUOUS ARCHITECTURAL SPINE & SHELL
    // -------------------------------------------------------------
    // A single continuous parametric 3D space spline tracing the monumental building:
    // Starts at the solid foundation, sweeps forward in a cantilevered eye, curves up through
    // the central hub, and soars into the upper wing roof!
    const totalSpineSteps = 100;
    const buildingSpinePoints = [];
    const outerRimPoints = [];
    const innerCovePoints = [];
    const upperRoofPoints = [];

    for (let i = 0; i <= totalSpineSteps; i++) {
      const t = i / totalSpineSteps;

      // Master continuous geometric trajectory:
      let x, y, z;
      if (t < 0.5) {
        // Lower Cantilever & Eye (t: 0 -> 0.5)
        const localT = t / 0.5;
        const angle = localT * Math.PI * 0.95 - 0.2;
        const radius = 3.6 + Math.sin(localT * Math.PI) * 0.85 - localT * 0.5;
        x = Math.cos(angle) * radius * 0.95 + (localT * 1.6 - 0.5);
        y = Math.sin(angle) * (radius * 0.6) - 0.2 + Math.cos(localT * Math.PI * 0.5) * 0.35;
        z = Math.sin(localT * Math.PI) * 1.85 - localT * 1.5 + 0.5;
      } else {
        // Soaring Upper Wing Roof (t: 0.5 -> 1.0)
        const localT = (t - 0.5) / 0.5;
        const angle = 0.75 - localT * 0.65;
        const radius = 3.1 + localT * 1.8;
        x = Math.cos(angle) * radius * 0.75 + 1.1 + localT * 1.4;
        y = 0.75 + localT * 3.4 + Math.sin(localT * Math.PI * 0.6) * 0.6;
        z = -0.15 - localT * 2.4;
      }

      const spinePt = new THREE.Vector3(x, y, z);
      buildingSpinePoints.push(spinePt);

      // Outer leading aerodynamic cantilever rim
      outerRimPoints.push(new THREE.Vector3(x + 0.18, y + 0.12, z + 0.25));

      // Recessed inner cove ceiling (catches warm orange light)
      innerCovePoints.push(new THREE.Vector3(x - 0.55, y + 0.35, z - 0.65));

      // Upper sweeping roof deck
      upperRoofPoints.push(new THREE.Vector3(x + 0.28, y + 0.45, z - 0.22));
    }

    const buildingSpineSpline = new THREE.CatmullRomCurve3(buildingSpinePoints);
    const outerRimSpline = new THREE.CatmullRomCurve3(outerRimPoints);
    const innerCoveSpline = new THREE.CatmullRomCurve3(innerCovePoints);
    const upperRoofSpline = new THREE.CatmullRomCurve3(upperRoofPoints);

    // 1. Outer Aerodynamic Concrete Cantilever Fascia (Continuous White Shell)
    const outerFasciaGeo = new THREE.TubeGeometry(outerRimSpline, 64, 0.36, 14, false);
    const outerFasciaMesh = new THREE.Mesh(outerFasciaGeo, whiteConcreteMaterial);
    outerFasciaMesh.castShadow = true;
    outerFasciaMesh.receiveShadow = true;
    continuousShellGroup.add(outerFasciaMesh);

    // 2. Sweeping Upper Roof Deck (Continuous White Shell)
    const roofDeckGeo = new THREE.TubeGeometry(upperRoofSpline, 60, 0.44, 12, false);
    const roofDeckMesh = new THREE.Mesh(roofDeckGeo, whiteConcreteMaterial);
    roofDeckMesh.castShadow = true;
    continuousShellGroup.add(roofDeckMesh);

    // 3. Central Structural Core Spine Tube
    const spineCoreGeo = new THREE.TubeGeometry(buildingSpineSpline, 64, 0.24, 10, false);
    const spineCoreMesh = new THREE.Mesh(spineCoreGeo, whiteConcreteMaterial);
    spineCoreMesh.castShadow = true;
    continuousShellGroup.add(spineCoreMesh);

    // 4. Recessed Inner Cove Ceiling (Receives the rich warm orange cove illumination)
    const coveCeilingGeo = new THREE.TubeGeometry(innerCoveSpline, 52, 0.58, 12, false);
    const coveCeilingMesh = new THREE.Mesh(coveCeilingGeo, warmCoveMaterial);
    coveCeilingMesh.receiveShadow = true;
    continuousShellGroup.add(coveCeilingMesh);

    // -------------------------------------------------------------
    // PART 3: HUNDREDS OF FINE, EVENLY SPACED STRUCTURAL RIBS
    // -------------------------------------------------------------
    // The user specifically requested:
    // "Hundreds of fine, evenly spaced structural ribs following the building's curved geometry."
    // We create 92 precisely spaced, sleek architectural ribs across the continuous shell:
    // - Ribs 0 to 45: Underside cantilever fins lining the ceiling cove (lit warmly from within)
    // - Ribs 46 to 91: Soaring vertical louver blades on the upper roof wing
    const totalRibs = 92;
    const ribMeshes = [];

    for (let i = 0; i < totalRibs; i++) {
      const t = i / (totalRibs - 1);
      const spinePt = buildingSpineSpline.getPointAt(t);
      const rimPt = outerRimSpline.getPointAt(t);
      const covePt = innerCoveSpline.getPointAt(t);
      const roofPt = upperRoofSpline.getPointAt(t);

      if (t < 0.5) {
        // Underside Cantilever Ribs (In Reference Image 1: tightly spaced fins under the eye)
        const localT = t / 0.5;
        const ribVec = rimPt.clone().sub(covePt);
        const ribLength = ribVec.length();

        // Sleek, fine architectural blade
        const ribThickness = 0.042;
        const ribDepth = 0.42 * (1 - localT * 0.2);
        const ribGeo = new THREE.BoxGeometry(ribThickness, ribDepth, ribLength);

        const ribMesh = new THREE.Mesh(ribGeo, whiteConcreteMaterial);
        ribMesh.position.copy(covePt.clone().add(rimPt).multiplyScalar(0.5));
        ribMesh.lookAt(rimPt);
        ribMesh.rotateX(0.22 * Math.sin(localT * Math.PI));
        ribMesh.castShadow = true;
        ribMesh.receiveShadow = true;

        structuralRibsGroup.add(ribMesh);
        ribMeshes.push(ribMesh);

        // Structural schematic outline for skeleton mode
        const edges = new THREE.EdgesGeometry(ribGeo, 28);
        const line = new THREE.LineSegments(edges, skeletalLineMaterial);
        line.position.copy(ribMesh.position);
        line.rotation.copy(ribMesh.rotation);
        internalSkeletonGroup.add(line);
      } else {
        // Upper Soaring Wing Louvers (In Reference Image 1: tall blades sweeping up into the sky)
        const localT = (t - 0.5) / 0.5;
        const bladeHeight = 1.4 + localT * 3.6;
        const bladeThickness = 0.045;
        const bladeBreadth = 0.48 * (1 - localT * 0.18);

        const bladeGeo = new THREE.BoxGeometry(bladeThickness, bladeHeight, bladeBreadth);

        // Taper top
        const pos = bladeGeo.attributes.position;
        for (let v = 0; v < pos.count; v++) {
          const vy = pos.getY(v);
          if (vy > bladeHeight * 0.25) {
            const factor = 1 - (vy - bladeHeight * 0.25) / (bladeHeight * 0.75) * 0.42;
            pos.setZ(v, pos.getZ(v) * factor);
          }
        }
        bladeGeo.computeVertexNormals();

        const bladeMesh = new THREE.Mesh(bladeGeo, whiteConcreteMaterial);
        bladeMesh.position.set(roofPt.x, roofPt.y + bladeHeight * 0.46, roofPt.z);

        // Smooth aerodynamic twist following the building's geometry
        bladeMesh.rotation.y = -0.32 + localT * 0.42;
        bladeMesh.rotation.z = -0.12 - localT * 0.22;
        bladeMesh.rotation.x = 0.1 - localT * 0.16;
        bladeMesh.castShadow = true;
        bladeMesh.receiveShadow = true;

        structuralRibsGroup.add(bladeMesh);
        ribMeshes.push(bladeMesh);

        // Structural edge lines
        const edges = new THREE.EdgesGeometry(bladeGeo, 24);
        const line = new THREE.LineSegments(edges, skeletalLineMaterial);
        line.position.copy(bladeMesh.position);
        line.rotation.copy(bladeMesh.rotation);
        internalSkeletonGroup.add(line);
      }
    }

    // -------------------------------------------------------------
    // PART 4: INTERNAL SKELETON (BELONGING TO THE SAME BUILDING)
    // -------------------------------------------------------------
    // Heavy structural steel box-beam following the building's continuous spine
    const steelSpineGeo = new THREE.TubeGeometry(buildingSpineSpline, 64, 0.085, 8, false);
    const steelSpineMesh = new THREE.Mesh(steelSpineGeo, steelMaterial);
    internalSkeletonGroup.add(steelSpineMesh);

    // Longitudinal steel tension pipes running through the ribs
    const tensionGuideGeo1 = new THREE.TubeGeometry(outerRimSpline, 52, 0.04, 8, false);
    const tensionGuideMesh1 = new THREE.Mesh(tensionGuideGeo1, steelMaterial);
    internalSkeletonGroup.add(tensionGuideMesh1);

    const tensionGuideGeo2 = new THREE.TubeGeometry(innerCoveSpline, 48, 0.04, 8, false);
    const tensionGuideMesh2 = new THREE.Mesh(tensionGuideGeo2, steelMaterial);
    internalSkeletonGroup.add(tensionGuideMesh2);

    // Triangulated Steel Space-Truss Struts and Copper Nodes inside the Upper Wing
    const strutCylinderGeo = new THREE.CylinderGeometry(0.022, 0.022, 1.0, 8);
    const nodeSphereGeo = new THREE.SphereGeometry(0.052, 10, 10);

    for (let i = 50; i < totalSpineSteps - 4; i += 4) {
      const p1 = buildingSpinePoints[i];
      const p2 = buildingSpinePoints[i + 4];
      const midHigh = new THREE.Vector3(
        (p1.x + p2.x) / 2 - 0.2,
        (p1.y + p2.y) / 2 + 1.15,
        (p1.z + p2.z) / 2 - 0.15
      );

      // Node
      const nodeMesh = new THREE.Mesh(nodeSphereGeo, copperMaterial);
      nodeMesh.position.copy(midHigh);
      internalSkeletonGroup.add(nodeMesh);

      // Diagonal strut p1 -> midHigh
      const v1 = midHigh.clone().sub(p1);
      const s1 = new THREE.Mesh(strutCylinderGeo, steelMaterial);
      s1.scale.set(1, v1.length(), 1);
      s1.position.copy(p1.clone().add(midHigh).multiplyScalar(0.5));
      s1.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v1.clone().normalize());
      internalSkeletonGroup.add(s1);

      // Diagonal strut midHigh -> p2
      const v2 = p2.clone().sub(midHigh);
      const s2 = new THREE.Mesh(strutCylinderGeo, steelMaterial);
      s2.scale.set(1, v2.length(), 1);
      s2.position.copy(midHigh.clone().add(p2).multiplyScalar(0.5));
      s2.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v2.clone().normalize());
      internalSkeletonGroup.add(s2);
    }

    // Soft architectural ground plane shadow
    const groundPlaneGeo = new THREE.PlaneGeometry(24, 24);
    const groundPlaneMat = new THREE.ShadowMaterial({ opacity: 0.16 });
    const groundPlane = new THREE.Mesh(groundPlaneGeo, groundPlaneMat);
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.position.y = -2.48;
    groundPlane.receiveShadow = true;
    scene.add(groundPlane);

    // --- 6. Smooth Mouse-Controlled Physics State ---
    const mousePhysics = {
      targetX: 0,
      targetY: 0,
      currentX: 0,
      currentY: 0,
      isInteracting: false,
      lastInteractionTime: Date.now(),
    };

    let isPointerDown = false;
    let startPointerX = 0;
    let startPointerY = 0;
    let dragRotationX = 0;
    let dragRotationY = 0;
    let lastResetCount = resetTriggerRef.current;

    const onPointerDown = (e) => {
      isPointerDown = true;
      startPointerX = e.clientX;
      startPointerY = e.clientY;
      mousePhysics.isInteracting = true;
      mousePhysics.lastInteractionTime = Date.now();
      try {
        container.setPointerCapture(e.pointerId);
      } catch (err) {}
    };

    const onPointerMove = (e) => {
      if (isPointerDown) {
        const deltaX = (e.clientX - startPointerX) * 0.0035;
        const deltaY = (e.clientY - startPointerY) * 0.0035;
        dragRotationY = THREE.MathUtils.clamp(dragRotationY + deltaX, -0.4, 0.4);
        dragRotationX = THREE.MathUtils.clamp(dragRotationX + deltaY, -0.28, 0.28);
        startPointerX = e.clientX;
        startPointerY = e.clientY;
        mousePhysics.targetX = dragRotationY;
        mousePhysics.targetY = -dragRotationX;
        mousePhysics.lastInteractionTime = Date.now();
      }
    };

    const onPointerUp = (e) => {
      isPointerDown = false;
      try {
        container.releasePointerCapture(e.pointerId);
      } catch (err) {}
    };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    let scrollProgress = 0;

    // Window cursor position listener (Subtle, elegant perspective influence)
    const handleWindowMouseMove = (event) => {
      if (!isPointerDown) {
        mousePhysics.isInteracting = true;
        mousePhysics.lastInteractionTime = Date.now();

        // Normalized window coordinates [-1, 1]
        const normX = (event.clientX / window.innerWidth) * 2 - 1;
        const normY = -(event.clientY / window.innerHeight) * 2 + 1;

        // Subtle realistic architectural bounds (max ±12° horizontal, ±8° vertical)
        mousePhysics.targetX = normX * 0.24 + dragRotationY;
        mousePhysics.targetY = normY * 0.16 - dragRotationX;
      }
    };

    const handleTouchMove = (event) => {
      if (event.touches.length > 0) {
        mousePhysics.isInteracting = true;
        mousePhysics.lastInteractionTime = Date.now();
        const touch = event.touches[0];
        const normX = (touch.clientX / window.innerWidth) * 2 - 1;
        const normY = -(touch.clientY / window.innerHeight) * 2 + 1;
        mousePhysics.targetX = normX * 0.22;
        mousePhysics.targetY = normY * 0.15;
      }
    };

    const handleMouseLeave = () => {
      mousePhysics.isInteracting = false;
      mousePhysics.targetX = 0;
      mousePhysics.targetY = 0;
      dragRotationX = 0;
      dragRotationY = 0;
    };

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      scrollProgress = Math.min(scrollY / viewportHeight, 1.4);
    };

    window.addEventListener('mousemove', handleWindowMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    // --- 7. Master Render & Animation Loop ---
    let animationFrameId;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Check reset trigger
      if (lastResetCount !== resetTriggerRef.current) {
        lastResetCount = resetTriggerRef.current;
        dragRotationX = 0;
        dragRotationY = 0;
        mousePhysics.targetX = 0;
        mousePhysics.targetY = 0;
        mousePhysics.isInteracting = false;
      }

      // Smooth organic return to rest when interaction pauses
      const timeSinceInteraction = Date.now() - mousePhysics.lastInteractionTime;
      if (timeSinceInteraction > 2800 && mousePhysics.isInteracting && !isPointerDown) {
        mousePhysics.targetX = THREE.MathUtils.lerp(mousePhysics.targetX, 0, 0.05);
        mousePhysics.targetY = THREE.MathUtils.lerp(mousePhysics.targetY, 0, 0.05);
      }

      // Smooth damping interpolation (0.048 damping factor for organic architectural motion)
      const damping = 0.048;
      mousePhysics.currentX += (mousePhysics.targetX - mousePhysics.currentX) * damping;
      mousePhysics.currentY += (mousePhysics.targetY - mousePhysics.currentY) * damping;

      // Subtle resting breathing motion (Architecture feels majestic and alive)
      const breathingX = Math.sin(elapsedTime * 0.6) * 0.01;
      const breathingY = Math.cos(elapsedTime * 0.45) * 0.007;

      // Handle skeleton mode transitions for the entire building
      const isSkeleton = skeletonModeRef.current;
      whiteConcreteMaterial.wireframe = isSkeleton;
      whiteConcreteMaterial.opacity = isSkeleton ? 0.2 : 1.0;
      whiteConcreteMaterial.transparent = isSkeleton;
      warmCoveMaterial.opacity = isSkeleton ? 0.3 : 1.0;
      warmCoveMaterial.transparent = isSkeleton;
      skeletalLineMaterial.opacity = isSkeleton ? 0.85 : 0.35;
      steelMaterial.metalness = isSkeleton ? 1.0 : 0.92;
      orangeCoveLight1.intensity = isSkeleton ? 12.0 : 9.5;

      // 1. Master Architectural Orientation
      buildingMasterGroup.rotation.y = THREE.MathUtils.lerp(
        buildingMasterGroup.rotation.y,
        mousePhysics.currentX * 0.32 + breathingX,
        0.08
      );
      buildingMasterGroup.rotation.x = THREE.MathUtils.lerp(
        buildingMasterGroup.rotation.x,
        -mousePhysics.currentY * 0.22 + breathingY,
        0.08
      );

      // 2. Parallax Layer 1: Grounded Foundation Wall (0.75x factor)
      foundationGroup.rotation.y = mousePhysics.currentX * 0.08;
      foundationGroup.rotation.x = -mousePhysics.currentY * 0.06;

      // 3. Parallax Layer 2: Continuous Building Shell (1.0x factor)
      continuousShellGroup.rotation.y = mousePhysics.currentX * 0.14;
      continuousShellGroup.rotation.x = -mousePhysics.currentY * 0.1;

      // 4. Parallax Layer 3: Repeating Structural Ribs (1.15x factor - creates tangible depth)
      structuralRibsGroup.rotation.y = mousePhysics.currentX * 0.2;
      structuralRibsGroup.rotation.x = -mousePhysics.currentY * 0.14;

      // 5. Parallax Layer 4: Internal Steel Space-Frame Skeleton (1.35x factor with Z-depth offset)
      internalSkeletonGroup.rotation.y = mousePhysics.currentX * 0.28;
      internalSkeletonGroup.rotation.x = -mousePhysics.currentY * 0.2;
      internalSkeletonGroup.position.z = mousePhysics.currentY * 0.22;

      // Dynamic Orange Cove Light Shifting with cursor
      orangeCoveLight1.position.x = 0.4 + mousePhysics.currentX * 0.4;
      orangeCoveLight1.position.y = 0.1 - mousePhysics.currentY * 0.25;

      // 6. Scroll Interaction: Perspective camera elevation and orbit sweep
      camera.position.y = 0.5 - scrollProgress * 0.75;
      camera.position.z = 12.0 + scrollProgress * 1.5;
      camera.position.x = 0.4 + scrollProgress * 0.4;
      camera.lookAt(0.4, -0.1 + scrollProgress * 0.2, 0);

      renderer.render(scene, camera);
    };

    animate();

    // --- 8. Resize Handling ---
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener('resize', handleResize);

    // --- 9. Clean Teardown ---
    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);

      scene.traverse((obj) => {
        if (obj.isMesh || obj.isLine) {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach((m) => m.dispose());
            } else {
              obj.material.dispose();
            }
          }
        }
      });
      concreteBumpMap.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative w-full h-full min-h-[520px] lg:min-h-[640px] select-none cursor-grab active:cursor-grabbing ${className}`}
    >
      {/* Subtle ambient light gradient blending naturally with #FFF9F5 */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-[#FFF4EB]/20 to-[#FCE2D3]/15 rounded-3xl" />

      {/* Architectural Inspection Controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <button
          onClick={() => setSkeletonMode(!skeletonMode)}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm ${
            skeletonMode
              ? 'bg-[#F36B21] text-white shadow-orange-500/25 ring-2 ring-orange-400/40'
              : 'bg-white/90 hover:bg-white text-[#171717] border border-[#EAE2DC] backdrop-blur-md hover:border-[#d4c8bf]'
          }`}
          title="Toggle structural steel skeleton"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{skeletonMode ? 'Skeletal Framework' : 'Inspect Skeleton'}</span>
        </button>

        <button
          onClick={handleResetOrientation}
          className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-white/85 hover:bg-white border border-[#EAE2DC] text-[#777777] hover:text-[#171717] backdrop-blur-md transition-all shadow-xs"
          title="Reset to default angle"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Interactive Cursor Indicator */}
      <div
        className={`absolute bottom-5 left-5 z-20 transition-opacity duration-300 pointer-events-none ${
          isHovered ? 'opacity-100' : 'opacity-70'
        }`}
      >
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs bg-white/85 backdrop-blur-md border border-[#EAE2DC] text-[#777777] shadow-xs">
          <span className="w-2 h-2 rounded-full bg-[#F36B21] animate-pulse" />
          <span className="font-medium text-[#171717]">Interactive Architecture</span>
          <span className="text-[#999999]">• Drag or hover to rotate</span>
        </div>
      </div>
    </div>
  );
}
