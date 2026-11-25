"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function HomeMotion({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    ScrollTrigger.batch(".rise-in", {
      start: "top 88%",
      once: true,
      onEnter: (elements) => {
        gsap.fromTo(elements, { y: 40, autoAlpha: 0 }, {
          y: 0,
          autoAlpha: 1,
          duration: 0.8,
          stagger: 0.08,
          ease: "power2.out",
          clearProps: "transform,opacity,visibility",
        });
      },
    });

    gsap.fromTo(".pc-arc", { rotation: 28 }, {
      rotation: 78,
      ease: "none",
      scrollTrigger: {
        trigger: ".pc-hero",
        start: "top top",
        end: "bottom top",
        scrub: 0.7,
      },
    });
  }, { scope: root });

  return <div ref={root}>{children}</div>;
}
