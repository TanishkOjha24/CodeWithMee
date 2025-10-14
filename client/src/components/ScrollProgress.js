import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './ScrollProgress.css';

gsap.registerPlugin(ScrollTrigger);

const ScrollProgress = () => {
    const trackRef = useRef(null);
    const thumbRef = useRef(null);

    useEffect(() => {
        const thumb = thumbRef.current;
        
        const ctx = gsap.context(() => {
            gsap.to(thumb, {
                scrollTrigger: {
                    trigger: document.documentElement,
                    start: 'top top',
                    end: 'bottom bottom',
                    scrub: 0.5, 
                },
                height: '100%',
                ease: 'none',
            });
        });

        return () => ctx.revert();
    }, []);

    return (
        <div ref={trackRef} className="scroll-track">
            <div ref={thumbRef} className="scroll-thumb"></div>
        </div>
    );
};

export default ScrollProgress;