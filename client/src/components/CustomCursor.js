import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import './CustomCursor.css';

const CustomCursor = () => {
    const cursorRef = useRef(null);

    useEffect(() => {
        const cursor = cursorRef.current;
        if (!cursor) return;

        // --- Start of Translated Code ---
        const amount = 20;
        const sineDots = Math.floor(amount * 0.3);
        const width = 26;
        const idleTimeout = 150;
        let lastFrame = 0;
        const mousePosition = { x: 0, y: 0 };
        const dots = [];
        let timeoutID;
        let idle = false;
        let animationFrameId;

        // The Dot class manages the state and drawing of each dot in the trail
        class Dot {
            constructor(index = 0) {
                this.index = index;
                this.anglespeed = 0.05;
                this.x = 0;
                this.y = 0;
                this.scale = 1 - 0.05 * index;
                this.range = width / 2 - (width / 2 * this.scale) + 2;
                this.limit = width * 0.75 * this.scale;
                this.element = document.createElement("span");
                gsap.set(this.element, { scale: this.scale });
                cursor.appendChild(this.element);
            }

            lock() {
                this.lockX = this.x;
                this.lockY = this.y;
                this.angleX = Math.PI * 2 * Math.random();
                this.angleY = Math.PI * 2 * Math.random();
            }

            draw() {
                if (!idle || this.index <= sineDots) {
                    gsap.set(this.element, { x: this.x, y: this.y });
                } else {
                    this.angleX += this.anglespeed;
                    this.angleY += this.anglespeed;
                    this.y = this.lockY + Math.sin(this.angleY) * this.range;
                    this.x = this.lockX + Math.sin(this.angleX) * this.range;
                    gsap.set(this.element, { x: this.x, y: this.y });
                }
            }
        }

        function startIdleTimer() {
            timeoutID = setTimeout(goInactive, idleTimeout);
            idle = false;
        }

        function resetIdleTimer() {
            clearTimeout(timeoutID);
            startIdleTimer();
        }

        function goInactive() {
            idle = true;
            for (let dot of dots) {
                dot.lock();
            }
        }

        function buildDots() {
            for (let i = 0; i < amount; i++) {
                let dot = new Dot(i);
                dots.push(dot);
            }
        }

        const onMouseMove = event => {
            mousePosition.x = event.clientX - width / 2;
            mousePosition.y = event.clientY - width / 2;
            resetIdleTimer();
        };

        const onTouchMove = event => {
            mousePosition.x = event.touches[0].clientX - width / 2;
            mousePosition.y = event.touches[0].clientY - width / 2;
            resetIdleTimer();
        };

        const render = timestamp => {
            const delta = timestamp - lastFrame;
            positionCursor(delta);
            lastFrame = timestamp;
            animationFrameId = requestAnimationFrame(render);
        };

        const positionCursor = () => {
            let x = mousePosition.x;
            let y = mousePosition.y;
            dots.forEach((dot, index, dots) => {
                let nextDot = dots[index + 1] || dots[0];
                dot.x = x;
                dot.y = y;
                dot.draw();
                if (!idle || index <= sineDots) {
                    const dx = (nextDot.x - dot.x) * 0.35;
                    const dy = (nextDot.y - dot.y) * 0.35;
                    x += dx;
                    y += dy;
                }
            });
        };

        // Initial setup
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("touchmove", onTouchMove);
        buildDots();
        startIdleTimer();
        animationFrameId = requestAnimationFrame(render);
        // --- End of Translated Code ---


        // Cleanup function to remove listeners and cancel animation frame
        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("touchmove", onTouchMove);
            cancelAnimationFrame(animationFrameId);
            // Clear any created spans
            if (cursor) {
                cursor.innerHTML = '';
            }
        };

    }, []); // Empty dependency array ensures this runs only once on mount

    return <div ref={cursorRef} className="Cursor"></div>;
};

export default CustomCursor;