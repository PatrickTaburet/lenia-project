import { useEffect, useRef } from "react";
import * as THREE from "three";
import vertexShader from "../shaders/vertex.glsl?raw";
import updateShader from "../shaders/update.glsl?raw";
import renderShader from "../shaders/render.glsl?raw";

export function ShaderCanvas() {
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const SIM_WIDTH = 512;
        const SIM_HEIGHT = 512;

        const viewWidth = container.clientWidth;
        const viewHeight = container.clientHeight;

        // 1. RENDERER
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(viewWidth, viewHeight);
        container.appendChild(renderer.domElement);

        // 2. CAMERA
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
        camera.position.z = 1;

        // 3. RENDERTARGETS (ping-pong)
        const rtOptions: THREE.RenderTargetOptions = {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            type: THREE.UnsignedByteType,
            depthBuffer: false,
            stencilBuffer: false,
        };
        let rtA = new THREE.WebGLRenderTarget(SIM_WIDTH, SIM_HEIGHT, rtOptions);
        let rtB = new THREE.WebGLRenderTarget(SIM_WIDTH, SIM_HEIGHT, rtOptions);

        // 4. UNIFORMS 
        // Communs
        const simResolution = new THREE.Vector2(SIM_WIDTH, SIM_HEIGHT);
        // const displayResolution = new THREE.Vector2(viewWidth, viewHeight);

        // Simulation
        const simUniforms = {
            u_state: { value: rtA.texture },
            u_resolution: { value: simResolution },
            u_dt: { value: 0.02 },
            u_time: { value: 0.0 },
        };

        // Display
        const displayUniforms = {
            u_state: { value: rtA.texture },
        };

        // 5. SIMULATION SCENE (update)
        const simScene = new THREE.Scene();
        const simMaterial = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader: updateShader,
            uniforms: simUniforms,
        });
        const simQuad = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 2),
            simMaterial
        );
        simScene.add(simQuad);

        // 6. DISPLAY SCENE (render)
        const displayScene = new THREE.Scene();
        const displayMaterial = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader: renderShader,
            uniforms: displayUniforms,
        });

        const displayQuad = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 2),
            displayMaterial
        );
        displayScene.add(displayQuad);

        // 7. ANIMATION LOOP : ping-pong
        let sourceRT = rtA;
        let targetRT = rtB;

        let startTime = performance.now();
        let animationId: number;

        const animate = () => {
            const now = performance.now();
            const elapsed = (now - startTime) / 1000;
            simUniforms.u_time.value = elapsed;

            // --- PASS 1 : SIMULATION (update.glsl) ---
            simUniforms.u_state.value = sourceRT.texture;

            renderer.setRenderTarget(targetRT);
            renderer.render(simScene, camera);

            // --- PASS 2 : AFFICHAGE (render.glsl) ---
            displayUniforms.u_state.value = targetRT.texture;

            renderer.setRenderTarget(null); // écran
            renderer.render(displayScene, camera);

            // --- SWAP ---
            const tmp = sourceRT;
            sourceRT = targetRT;
            targetRT = tmp;

            animationId = requestAnimationFrame(animate);
        };

        animate();

        // 8. RESIZE
        const handleResize = () => {
            if (!container) return;
            const newWidth = container.clientWidth;
            const newHeight = container.clientHeight;
            renderer.setSize(newWidth, newHeight);
            // displayResolution.set(newWidth, newHeight);

            // rtA.dispose();
            // rtB.dispose();
            // rtA = new THREE.WebGLRenderTarget(width, height, rtOptions);
            // rtB = new THREE.WebGLRenderTarget(width, height, rtOptions);

            // // on met à jour la source pour éviter glitch
            // sourceRT = rtA;
            // targetRT = rtB;
        };

        window.addEventListener("resize", handleResize);

        // CLEANUP
        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener("resize", handleResize);
            simQuad.geometry.dispose();
            simMaterial.dispose();
            displayQuad.geometry.dispose();
            displayMaterial.dispose();
            rtA.dispose();
            rtB.dispose();
            renderer.dispose();
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
        };

    }, []);

    return <div className="canvas-shader" ref={containerRef} />;

}