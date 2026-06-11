"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export function HeroMotion() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const context = gsap.context(() => {
      gsap.fromTo(
        ".orbit-dot",
        { opacity: 0, scale: 0.4 },
        { opacity: 1, scale: 1, duration: 0.7, stagger: 0.08, ease: "power3.out" },
      );
      gsap.to(".radar-sweep", {
        rotate: 360,
        duration: 9,
        repeat: -1,
        ease: "none",
        transformOrigin: "50% 100%",
      });
    }, ref);

    return () => context.revert();
  }, []);

  return (
    <div className="radar-stage" ref={ref} aria-hidden="true">
      <div className="radar-ring ring-one" />
      <div className="radar-ring ring-two" />
      <div className="radar-ring ring-three" />
      <div className="radar-sweep" />
      <span className="orbit-dot dot-one" />
      <span className="orbit-dot dot-two" />
      <span className="orbit-dot dot-three" />
      <span className="orbit-dot dot-four" />
      <span className="center-core">AI</span>
    </div>
  );
}
