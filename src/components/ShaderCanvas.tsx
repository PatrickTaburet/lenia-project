import { useEffect, useRef } from "react";
import * as THREE from "three";
import renderShader from "../shaders/render.glsl?raw";
import updateShader from "../shaders/update.glsl?raw";

export function ShaderCanvas() {
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const scene = new THREE.Scene();

        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
        camera.position.z = 1;

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(renderer.domElement);

        const uniforms = {
            u_time: { value: 0.0 },
            u_resolution: { value: new THREE.Vector2(container.clientWidth, container.clientHeight) },
        };
        const geometry = new THREE.PlaneGeometry(2, 2);
        const material = new THREE.ShaderMaterial({
            vertexShader: updateShader,
            fragmentShader: renderShader,
            uniforms,
        });

        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        let animationId: number;
        let startTime = performance.now();

        const animate = () => {
            const now = performance.now();
            const elapsed = (now - startTime) / 1000;
            uniforms.u_time.value = elapsed;

            renderer.render(scene, camera);
            animationId = requestAnimationFrame(animate);
        };
        animate();

        const handleResize = () => {
            if (!container) return;
            const width = container.clientWidth;
            const height = container.clientHeight;
            renderer.setSize(width, height);
            uniforms.u_resolution.value.set(width, height);
        };
        window.addEventListener("resize", handleResize);
        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener("resize", handleResize);
            geometry.dispose();
            material.dispose();
            renderer.dispose();
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
        };

    }, []);

    return <div className="canvas-shader" ref={containerRef} />;

}