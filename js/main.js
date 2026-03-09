// ============================================
// FLUX — WebGL Distortion Gallery
// Three.js + GLSL + GSAP + Lenis
// ============================================

// Three.js loaded globally via script tag

// ============================================
// GLSL SHADERS
// ============================================
const vertexShader = /* glsl */ `
    varying vec2 vUv;
    uniform vec2 uMouse;
    uniform float uHover;
    uniform float uTime;

    void main() {
        vUv = uv;
        vec3 pos = position;

        // Subtle vertex wave on hover near mouse
        float dist = distance(uv, uMouse);
        float wave = sin(dist * 15.0 - uTime * 3.0);
        pos.z += wave * uHover * 20.0 * smoothstep(0.6, 0.0, dist);

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
`;

const fragmentShader = /* glsl */ `
    uniform sampler2D uTexture;
    uniform float uHover;
    uniform vec2 uMouse;
    uniform float uTime;
    uniform float uAlpha;
    varying vec2 vUv;

    void main() {
        vec2 uv = vUv;

        // Distance from mouse
        float dist = distance(uv, uMouse);

        // Wave-based liquid distortion
        float wave = sin(dist * 30.0 - uTime * 4.0) * 0.5 + 0.5;
        float strength = uHover * smoothstep(0.5, 0.0, dist) * 0.04;

        vec2 offset = vec2(
            sin(uv.y * 25.0 + uTime * 2.0) * strength * wave,
            cos(uv.x * 25.0 + uTime * 2.0) * strength * wave
        );

        // Chromatic aberration — RGB split
        float r = texture2D(uTexture, uv + offset * 1.4).r;
        float g = texture2D(uTexture, uv + offset * 0.7).g;
        float b = texture2D(uTexture, uv + offset * 1.0).b;

        gl_FragColor = vec4(r, g, b, uAlpha);
    }
`;

// ============================================
// LENIS SMOOTH SCROLL
// ============================================
const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    smoothWheel: true,
});

function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// Sync Lenis with GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

// ============================================
// CUSTOM CURSOR
// ============================================
class Cursor {
    constructor() {
        this.cursor = document.getElementById('cursor');
        this.follower = document.getElementById('cursorFollower');
        this.pos = { x: 0, y: 0 };
        this.target = { x: 0, y: 0 };
        this.followerPos = { x: 0, y: 0 };

        // Check for touch device
        if ('ontouchstart' in window) return;

        window.addEventListener('mousemove', (e) => {
            this.target.x = e.clientX;
            this.target.y = e.clientY;
        });

        // Hover state for gallery items
        document.querySelectorAll('[data-cursor]').forEach(el => {
            el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
            el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
        });

        // Hover state for links
        document.querySelectorAll('a, button').forEach(el => {
            el.addEventListener('mouseenter', () => {
                gsap.to(this.cursor, { scale: 2, duration: 0.3 });
            });
            el.addEventListener('mouseleave', () => {
                gsap.to(this.cursor, { scale: 1, duration: 0.3 });
            });
        });

        this.render();
    }

    render() {
        // Smooth follow
        this.pos.x += (this.target.x - this.pos.x) * 0.15;
        this.pos.y += (this.target.y - this.pos.y) * 0.15;
        this.followerPos.x += (this.target.x - this.followerPos.x) * 0.08;
        this.followerPos.y += (this.target.y - this.followerPos.y) * 0.08;

        if (this.cursor) {
            this.cursor.style.left = `${this.pos.x}px`;
            this.cursor.style.top = `${this.pos.y}px`;
        }
        if (this.follower) {
            this.follower.style.left = `${this.followerPos.x}px`;
            this.follower.style.top = `${this.followerPos.y}px`;
        }

        requestAnimationFrame(() => this.render());
    }
}

// ============================================
// WEBGL GALLERY — Three.js Distortion
// ============================================
class WebGLGallery {
    constructor() {
        this.canvas = document.getElementById('webgl-canvas');
        this.images = [...document.querySelectorAll('.gallery-img[data-webgl]')];
        this.meshes = [];
        this.mouse = new THREE.Vector2(0, 0);
        this.raycaster = new THREE.Raycaster();
        this.clock = new THREE.Clock();

        if (this.images.length === 0) return;

        this.setupRenderer();
        this.setupCamera();
        this.loadTextures();
        this.setupEvents();
        this.animate();
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: true,
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    setupCamera() {
        // OrthographicCamera for pixel-perfect mapping
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.camera = new THREE.OrthographicCamera(
            w / -2, w / 2, h / 2, h / -2, -1000, 1000
        );
        this.camera.position.z = 2;
        this.scene = new THREE.Scene();
    }

    loadTextures() {
        const loader = new THREE.TextureLoader();

        this.images.forEach((img, i) => {
            // Wait for image to be loaded
            const createMesh = (src) => {
                const texture = loader.load(src);
                texture.minFilter = THREE.LinearFilter;
                texture.magFilter = THREE.LinearFilter;
                texture.generateMipmaps = false;

                const material = new THREE.ShaderMaterial({
                    uniforms: {
                        uTexture: { value: texture },
                        uHover: { value: 0 },
                        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
                        uTime: { value: 0 },
                        uAlpha: { value: 0 },
                    },
                    vertexShader,
                    fragmentShader,
                    transparent: true,
                    side: THREE.DoubleSide,
                });

                const geometry = new THREE.PlaneGeometry(1, 1, 32, 32);
                const mesh = new THREE.Mesh(geometry, material);
                this.scene.add(mesh);

                this.meshes.push({
                    mesh,
                    img,
                    material,
                    isHovered: false,
                });
            };

            if (img.complete && img.naturalWidth > 0) {
                createMesh(img.src);
            } else {
                img.addEventListener('load', () => createMesh(img.src));
            }
        });
    }

    syncPositions() {
        this.meshes.forEach(({ mesh, img }) => {
            const rect = img.getBoundingClientRect();
            mesh.position.x = rect.left - window.innerWidth / 2 + rect.width / 2;
            mesh.position.y = -rect.top + window.innerHeight / 2 - rect.height / 2;
            mesh.scale.set(rect.width, rect.height, 1);
        });
    }

    setupEvents() {
        // Mouse move for hover distortion
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

            // Update UV mouse position for hovered mesh
            this.meshes.forEach(({ mesh, material, img }) => {
                const rect = img.getBoundingClientRect();
                const localX = (e.clientX - rect.left) / rect.width;
                const localY = 1 - (e.clientY - rect.top) / rect.height;
                material.uniforms.uMouse.value.set(
                    Math.max(0, Math.min(1, localX)),
                    Math.max(0, Math.min(1, localY))
                );
            });
        });

        // Hover states via DOM events (more reliable than raycasting)
        this.images.forEach((img, i) => {
            const item = img.closest('.gallery-item');

            item.addEventListener('mouseenter', () => {
                if (!this.meshes[i]) return;
                this.meshes[i].isHovered = true;
                img.classList.add('webgl-active');
                gsap.to(this.meshes[i].material.uniforms.uHover, {
                    value: 1,
                    duration: 0.8,
                    ease: 'power2.out',
                });
                gsap.to(this.meshes[i].material.uniforms.uAlpha, {
                    value: 1,
                    duration: 0.3,
                    ease: 'power2.out',
                });
            });

            item.addEventListener('mouseleave', () => {
                if (!this.meshes[i]) return;
                this.meshes[i].isHovered = false;
                img.classList.remove('webgl-active');
                gsap.to(this.meshes[i].material.uniforms.uHover, {
                    value: 0,
                    duration: 0.6,
                    ease: 'power2.inOut',
                });
                gsap.to(this.meshes[i].material.uniforms.uAlpha, {
                    value: 0,
                    duration: 0.5,
                    delay: 0.1,
                    ease: 'power2.in',
                });
            });
        });

        // Resize
        window.addEventListener('resize', () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            this.renderer.setSize(w, h);
            this.camera.left = w / -2;
            this.camera.right = w / 2;
            this.camera.top = h / 2;
            this.camera.bottom = h / -2;
            this.camera.updateProjectionMatrix();
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const elapsed = this.clock.getElapsedTime();

        // Update uniforms
        this.meshes.forEach(({ material }) => {
            material.uniforms.uTime.value = elapsed;
        });

        // Sync mesh positions with DOM
        this.syncPositions();

        this.renderer.render(this.scene, this.camera);
    }
}

// ============================================
// PRELOADER
// ============================================
class Preloader {
    constructor(onComplete) {
        this.fill = document.getElementById('preloaderFill');
        this.counter = document.getElementById('preloaderCount');
        this.preloader = document.getElementById('preloader');
        this.onComplete = onComplete;
        this.progress = 0;
        this.targetProgress = 0;

        this.simulateLoad();
    }

    simulateLoad() {
        // Wait for all images + a minimum display time
        const images = document.querySelectorAll('img');
        let loaded = 0;
        const total = images.length || 1;

        const checkComplete = () => {
            loaded++;
            this.targetProgress = Math.floor((loaded / total) * 100);
        };

        images.forEach(img => {
            if (img.complete) {
                checkComplete();
            } else {
                img.addEventListener('load', checkComplete);
                img.addEventListener('error', checkComplete);
            }
        });

        // Animate counter
        const updateCounter = () => {
            if (this.progress < this.targetProgress) {
                this.progress += 2;
                if (this.progress > this.targetProgress) this.progress = this.targetProgress;
            }

            if (this.fill) this.fill.style.width = `${this.progress}%`;
            if (this.counter) this.counter.textContent = this.progress;

            if (this.progress >= 100) {
                setTimeout(() => this.hide(), 400);
                return;
            }
            requestAnimationFrame(updateCounter);
        };

        // Start with slight delay for aesthetic
        setTimeout(() => {
            this.targetProgress = 100;
            updateCounter();
        }, 300);
    }

    hide() {
        gsap.to(this.preloader, {
            opacity: 0,
            duration: 0.6,
            ease: 'power2.inOut',
            onComplete: () => {
                this.preloader.style.display = 'none';
                if (this.onComplete) this.onComplete();
            },
        });
    }
}

// ============================================
// GSAP SCROLL ANIMATIONS
// ============================================
function initScrollAnimations() {
    // Hero entrance
    const heroTl = gsap.timeline({ delay: 0.2 });

    heroTl
        .to('.hero-line', {
            clipPath: 'inset(0 0 0% 0)',
            duration: 1.2,
            ease: 'power3.inOut',
            stagger: 0.15,
        })
        .to('.hero-tag', {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power2.out',
        }, '-=0.6')
        .to('.hero-subtitle', {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power2.out',
        }, '-=0.5')
        .to('.hero-cta', {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power2.out',
        }, '-=0.5')
        .to('.scroll-indicator', {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power2.out',
        }, '-=0.4');

    // Gallery header
    ScrollTrigger.create({
        trigger: '.gallery-header',
        start: 'top 80%',
        once: true,
        onEnter: () => {
            gsap.to('.gallery-header', {
                opacity: 1,
                y: 0,
                duration: 1,
                ease: 'power2.out',
            });
        },
    });

    // Gallery items stagger
    document.querySelectorAll('.gallery-item').forEach((item, i) => {
        ScrollTrigger.create({
            trigger: item,
            start: 'top 85%',
            once: true,
            onEnter: () => {
                gsap.to(item, {
                    opacity: 1,
                    y: 0,
                    duration: 1,
                    delay: i * 0.1,
                    ease: 'power2.out',
                });
            },
        });
    });

    // About section
    ScrollTrigger.create({
        trigger: '.about',
        start: 'top 75%',
        once: true,
        onEnter: () => {
            gsap.to('.about-left', {
                opacity: 1,
                y: 0,
                duration: 1,
                ease: 'power2.out',
            });
            gsap.to('.about-right', {
                opacity: 1,
                y: 0,
                duration: 1,
                delay: 0.2,
                ease: 'power2.out',
            });
        },
    });

    // Parallax on hero title
    gsap.to('.hero-title', {
        yPercent: -30,
        ease: 'none',
        scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: true,
        },
    });

    // Nav background on scroll
    ScrollTrigger.create({
        start: 100,
        onUpdate: (self) => {
            const nav = document.getElementById('nav');
            if (self.direction === 1 && self.progress > 0) {
                nav.style.background = 'rgba(6,6,6,0.8)';
                nav.style.backdropFilter = 'blur(20px)';
            } else if (self.progress === 0) {
                nav.style.background = 'transparent';
                nav.style.backdropFilter = 'none';
            }
        },
    });
}

// ============================================
// INITIALIZE
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Fetch CMS content (falls back to static HTML if unavailable)
    try {
        if (typeof initSanityContent === 'function') {
            await initSanityContent();
            console.log('[FLUX] CMS content loaded');
        } else {
            console.log('[FLUX] CMS bypassed, using static content');
        }
    } catch (err) {
        console.warn('[FLUX] CMS unavailable, using static content:', err);
    }

    // 2. Initialize cursor (works on any content)
    new Cursor();

    // 3. Preloader — waits for all images (including CMS-loaded ones)
    new Preloader(() => {
        initScrollAnimations();
    });

    // 4. WebGL gallery — reads DOM images, so runs after CMS rendered them
    setTimeout(() => {
        new WebGLGallery();
    }, 500);
});

