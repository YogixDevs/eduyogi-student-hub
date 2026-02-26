/**
 * EDUYOGI — Hero Globe Animation
 * Three.js r180 — ES Module import via importmap
 * Creates a golden wireframe sphere that reacts on hover
 */

import * as THREE from 'three';

const container = document.getElementById('globeContainer');
if (container) {
    // ── Scene ──────────────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.z = 4;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // ── Sphere ─────────────────────────────────────────────
    // High-detail icosahedron for the dense wireframe look
    const geometry = new THREE.IcosahedronGeometry(1.6, 4);
    const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color('#c5a059'),   // golden-brown
        wireframe: true,
        transparent: true,
        opacity: 0.3,
    });
    const globe = new THREE.Mesh(geometry, material);
    scene.add(globe);

    // ── Hover state ────────────────────────────────────────
    let isHovering = false;
    let hoverFactor = 0;          // 0 = idle, 1 = full hover
    const HOVER_SPEED_IN = 0.04;
    const HOVER_SPEED_OUT = 0.025;

    container.addEventListener('mouseenter', () => { isHovering = true; });
    container.addEventListener('mouseleave', () => { isHovering = false; });

    // ── Mouse position (for tilt) ──────────────────────────
    let mouseX = 0;
    let mouseY = 0;
    container.addEventListener('mousemove', (e) => {
        const rect = container.getBoundingClientRect();
        mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    });

    // ── Resize ─────────────────────────────────────────────
    const onResize = () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    // ── Animation loop ─────────────────────────────────────
    const clock = new THREE.Clock();

    const animate = () => {
        requestAnimationFrame(animate);
        const elapsed = clock.getElapsedTime();

        // Smooth hover interpolation
        hoverFactor += ((isHovering ? 1 : 0) - hoverFactor) *
            (isHovering ? HOVER_SPEED_IN : HOVER_SPEED_OUT);

        // Idle rotation (slows down on hover)
        const rotSpeed = 0.15 * (1 - hoverFactor * 0.6);
        globe.rotation.y = elapsed * rotSpeed;
        globe.rotation.x = elapsed * rotSpeed * 0.4;

        // On hover: tilt toward cursor
        if (hoverFactor > 0.01) {
            globe.rotation.x += mouseY * 0.4 * hoverFactor;
            globe.rotation.y += mouseX * 0.4 * hoverFactor;
        }

        // Scale pulse on hover
        const scale = 1 + hoverFactor * 0.12;
        globe.scale.setScalar(scale);

        // Opacity boost on hover
        material.opacity = 0.3 + hoverFactor * 0.25;

        renderer.render(scene, camera);
    };

    animate();
}
