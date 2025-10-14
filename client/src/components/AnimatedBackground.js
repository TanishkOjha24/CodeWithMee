import React, { useEffect, useRef } from 'react';
import './AnimatedBackground.css'; // We'll create this next
import easingUtils from "https://esm.sh/easing-utils";

const AnimatedBackground = () => {
    const canvasRef = useRef(null);
    const aHoleRef = useRef(null);
    const animationFrameId = useRef(null); // Use useRef to store the animation frame ID

    // This useEffect hook will run once when the component is mounted.
    useEffect(() => {
        const canvas = canvasRef.current;
        const aHole = aHoleRef.current;
        const ctx = canvas.getContext("2d");
        let rect, render, discs, lines, particles, startDisc, endDisc, clip, linesCanvas, linesCtx, particleArea;

        // All the logic from your file is encapsulated here
        const setup = () => {
            rect = aHole.getBoundingClientRect();
            render = {
                width: rect.width,
                height: rect.height,
                dpi: window.devicePixelRatio
            };
            canvas.width = render.width * render.dpi;
            canvas.height = render.height * render.dpi;

            // Set Discs
            const totalDiscs = 100;
            discs = [];

            // FIX: Base ellipse dimensions on the largest screen dimension to maintain aspect ratio
            const ellipseBaseSize = Math.max(rect.width, rect.height);
            startDisc = { 
                x: rect.width * 0.5, 
                y: rect.height * 0.45, 
                w: ellipseBaseSize * 0.75, 
                h: ellipseBaseSize * 0.5 
            };

            endDisc = { x: rect.width * 0.5, y: rect.height * 0.95, w: 0, h: 0 };
            let prevBottom = rect.height;
            clip = {};
            for (let i = 0; i < totalDiscs; i++) {
                const p = i / totalDiscs;
                const disc = tweenDisc({ p });
                const bottom = disc.y + disc.h;
                if (bottom <= prevBottom) {
                    clip = { disc: { ...disc }, i };
                }
                prevBottom = bottom;
                discs.push(disc);
            }
            clip.path = new Path2D();
            clip.path.ellipse(clip.disc.x, clip.disc.y, clip.disc.w, clip.disc.h, 0, 0, Math.PI * 2);
            clip.path.rect(clip.disc.x - clip.disc.w, 0, clip.disc.w * 2, clip.disc.y);

            // Set Lines
            const totalLines = 100;
            const linesAngle = (Math.PI * 2) / totalLines;
            lines = Array.from({ length: totalLines }, () => []);
            discs.forEach(disc => {
                for (let i = 0; i < totalLines; i++) {
                    const angle = i * linesAngle;
                    lines[i].push({ x: disc.x + Math.cos(angle) * disc.w, y: disc.y + Math.sin(angle) * disc.h });
                }
            });
            linesCanvas = new OffscreenCanvas(rect.width, rect.height);
            linesCtx = linesCanvas.getContext("2d");
            lines.forEach(line => {
                linesCtx.save();
                let lineIsIn = false;
                line.forEach((p1, j) => {
                    if (j === 0) return;
                    const p0 = line[j - 1];
                    if (!lineIsIn && (linesCtx.isPointInPath(clip.path, p1.x, p1.y) || linesCtx.isPointInStroke(clip.path, p1.x, p1.y))) {
                        lineIsIn = true;
                    } else if (lineIsIn) {
                        linesCtx.clip(clip.path);
                    }
                    linesCtx.beginPath();
                    linesCtx.moveTo(p0.x, p0.y);
                    linesCtx.lineTo(p1.x, p1.y);
                    linesCtx.strokeStyle = "#444";
                    linesCtx.lineWidth = 2;
                    linesCtx.stroke();
                    linesCtx.closePath();
                });
                linesCtx.restore();
            });

            // Set Particles
            const totalParticles = 100;
            particles = [];
            particleArea = { sw: clip.disc.w * 0.5, ew: clip.disc.w * 2, h: rect.height * 0.85 };
            particleArea.sx = (rect.width - particleArea.sw) / 2;
            particleArea.ex = (rect.width - particleArea.ew) / 2;
            for (let i = 0; i < totalParticles; i++) {
                particles.push(initParticle(true));
            }
        };

        const tweenValue = (start, end, p, ease = false) => {
            const delta = end - start;
            const easeFn = easingUtils[ease ? "ease" + ease.charAt(0).toUpperCase() + ease.slice(1) : "linear"];
            return start + delta * easeFn(p);
        };

        const tweenDisc = (disc) => {
            disc.x = tweenValue(startDisc.x, endDisc.x, disc.p);
            disc.y = tweenValue(startDisc.y, endDisc.y, disc.p, "inExpo");
            disc.w = tweenValue(startDisc.w, endDisc.w, disc.p);
            disc.h = tweenValue(startDisc.h, endDisc.h, disc.p);
            return disc;
        };

        const initParticle = (start = false) => {
            const sx = particleArea.sx + particleArea.sw * Math.random();
            const ex = particleArea.ex + particleArea.ew * Math.random();
            const dx = ex - sx;
            const y = start ? particleArea.h * Math.random() : particleArea.h;
            const r = 0.5 + Math.random() * 4;
            const vy = 0.5 + Math.random();
            return { x: sx, sx, dx, y, vy, p: 0, r, c: `rgba(255, 255, 255, ${Math.random()})` };
        };

        const tick = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.scale(render.dpi, render.dpi);

            discs.forEach(disc => { disc.p = (disc.p + 0.001) % 1; tweenDisc(disc); });
            particles.forEach(p => { p.p = 1 - p.y / particleArea.h; p.x = p.sx + p.dx * p.p; p.y -= p.vy; if (p.y < 0) Object.assign(p, initParticle()); });

            // Draw Discs
            ctx.strokeStyle = "#444";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(startDisc.x, startDisc.y, startDisc.w, startDisc.h, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.closePath();
            discs.forEach((disc, i) => {
                if (i % 5 !== 0) return;
                if (disc.w < clip.disc.w - 5) ctx.save();
                if (disc.w < clip.disc.w - 5) ctx.clip(clip.path);
                ctx.beginPath();
                ctx.ellipse(disc.x, disc.y, disc.w, disc.h, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.closePath();
                if (disc.w < clip.disc.w - 5) ctx.restore();
            });

            // Draw Lines & Particles
            ctx.drawImage(linesCanvas, 0, 0);
            ctx.save();
            ctx.clip(clip.path);
            particles.forEach(p => { ctx.fillStyle = p.c; ctx.beginPath(); ctx.rect(p.x, p.y, p.r, p.r); ctx.closePath(); ctx.fill(); });
            ctx.restore();

            ctx.restore();
            animationFrameId.current = requestAnimationFrame(tick); // Assign to the .current property
        };

        setup();
        tick();

        window.addEventListener('resize', setup);

        // Cleanup function to stop animation when component unmounts
        return () => {
            window.removeEventListener('resize', setup);
            cancelAnimationFrame(animationFrameId.current); // Cancel using the .current property
        };
    }, []); // Empty array ensures this runs only once on mount

    return (
        <div ref={aHoleRef} className="a-hole">
            <canvas ref={canvasRef} className="js-canvas"></canvas>
            <div className="aura"></div>
            <div className="overlay"></div>
        </div>
    );
};

export default AnimatedBackground;