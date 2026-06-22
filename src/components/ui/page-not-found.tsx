"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type StickFigure = {
  top?: string;
  bottom?: string;
  src: string;
  transform?: string;
  speedX: number;
  speedRotation?: number;
};

type Circle = {
  x: number;
  y: number;
  size: number;
};

export default function PageNotFound() {
  return (
    <main className="relative flex h-dvh w-full items-center justify-center overflow-hidden bg-black">
      <MessageDisplay />
      <CharactersAnimation />
      <CircleAnimation />
    </main>
  );
}

function MessageDisplay() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsVisible(true), 1200);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="absolute z-[100] flex h-[90%] w-[90%] items-center justify-center">
      <div className={`flex flex-col items-center transition-opacity duration-500 ${isVisible ? "opacity-100" : "opacity-0"}`}>
        <div className="m-[1%] text-[35px] font-semibold text-black">Page Not Found</div>
        <div className="m-[1%] text-[80px] font-bold text-black">404</div>
        <p className="m-[1%] w-1/2 min-w-[40%] text-center text-[15px] text-black max-sm:w-[86%]">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <div className="mt-8 flex gap-6 max-sm:flex-col max-sm:gap-3">
          <button
            className="group flex h-auto items-center gap-2 border-2 border-black px-6 py-2 text-base font-medium text-black transition-all duration-300 ease-in-out hover:scale-105 hover:bg-black hover:text-white"
            onClick={() => router.back()}
            type="button"
          >
            <svg
              className="transition-transform group-hover:-translate-x-1"
              fill="none"
              height="20"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            Go Back
          </button>
          <Link
            className="group flex h-auto items-center gap-2 bg-black px-6 py-2 text-base font-medium text-white transition-all duration-300 ease-in-out hover:scale-105 hover:bg-gray-900"
            href="/dashboard"
          >
            <svg
              className="transition-transform group-hover:translate-x-1"
              fill="none"
              height="20"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}

function CharactersAnimation() {
  const charactersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stickFigures: StickFigure[] = [
      {
        top: "0%",
        src: "https://raw.githubusercontent.com/RicardoYare/imagenes/9ef29f5bbe075b1d1230a996d87bca313b9b6a63/sticks/stick0.svg",
        transform: "rotateZ(-90deg)",
        speedX: 1500
      },
      {
        top: "10%",
        src: "https://raw.githubusercontent.com/RicardoYare/imagenes/9ef29f5bbe075b1d1230a996d87bca313b9b6a63/sticks/stick1.svg",
        speedX: 3000,
        speedRotation: 2000
      },
      {
        top: "20%",
        src: "https://raw.githubusercontent.com/RicardoYare/imagenes/9ef29f5bbe075b1d1230a996d87bca313b9b6a63/sticks/stick2.svg",
        speedX: 5000,
        speedRotation: 1000
      },
      {
        top: "25%",
        src: "https://raw.githubusercontent.com/RicardoYare/imagenes/9ef29f5bbe075b1d1230a996d87bca313b9b6a63/sticks/stick0.svg",
        speedX: 2500,
        speedRotation: 1500
      },
      {
        top: "35%",
        src: "https://raw.githubusercontent.com/RicardoYare/imagenes/9ef29f5bbe075b1d1230a996d87bca313b9b6a63/sticks/stick0.svg",
        speedX: 2000,
        speedRotation: 300
      },
      {
        bottom: "5%",
        src: "https://raw.githubusercontent.com/RicardoYare/imagenes/9ef29f5bbe075b1d1230a996d87bca313b9b6a63/sticks/stick3.svg",
        speedX: 0
      }
    ];

    const createCharacters = () => {
      const container = charactersRef.current;
      if (!container) return;

      container.innerHTML = "";

      stickFigures.forEach((figure, index) => {
        const stick = document.createElement("img");
        stick.alt = "";
        stick.src = figure.src;
        stick.style.position = "absolute";
        stick.style.width = "18%";
        stick.style.height = "18%";
        stick.style.pointerEvents = "none";
        if (figure.top) stick.style.top = figure.top;
        if (figure.bottom) stick.style.bottom = figure.bottom;
        if (figure.transform) stick.style.transform = figure.transform;
        container.appendChild(stick);

        if (index === 5) return;

        stick.animate([{ left: "100%" }, { left: "-20%" }], {
          duration: figure.speedX,
          easing: "linear",
          fill: "forwards"
        });

        if (index === 0 || !figure.speedRotation) return;

        stick.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(-360deg)" }], {
          duration: figure.speedRotation,
          iterations: Infinity,
          easing: "linear"
        });
      });
    };

    createCharacters();
    window.addEventListener("resize", createCharacters);

    return () => {
      window.removeEventListener("resize", createCharacters);
      if (charactersRef.current) charactersRef.current.innerHTML = "";
    };
  }, []);

  return <div ref={charactersRef} className="absolute h-[95%] w-[99%]" />;
}

function CircleAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestIdRef = useRef<number | null>(null);
  const timerRef = useRef(0);
  const circlesRef = useRef<Circle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const init = () => {
      circlesRef.current = Array.from({ length: 300 }, () => ({
        x: Math.floor(Math.random() * (canvas.width * 3 - canvas.width * 1.2 + 1)) + canvas.width * 1.2,
        y: Math.floor(Math.random() * (canvas.height - canvas.height * -0.2 + 1)) + canvas.height * -0.2,
        size: canvas.width / 1000
      }));
    };

    const draw = () => {
      const context = canvas.getContext("2d");
      if (!context) return;

      timerRef.current += 1;
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.fillStyle = "white";
      context.clearRect(0, 0, canvas.width, canvas.height);

      const distanceX = canvas.width / 80;
      const growthRate = canvas.width / 1000;

      circlesRef.current.forEach((circle) => {
        context.beginPath();
        if (timerRef.current < 65) {
          circle.x -= distanceX;
          circle.size += growthRate;
        }
        if (timerRef.current > 65 && timerRef.current < 500) {
          circle.x -= distanceX * 0.02;
          circle.size += growthRate * 0.2;
        }
        context.arc(circle.x, circle.y, circle.size, 0, 360);
        context.fill();
      });

      if (timerRef.current <= 500) {
        requestIdRef.current = window.requestAnimationFrame(draw);
      }
    };

    const reset = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      timerRef.current = 0;
      if (requestIdRef.current !== null) window.cancelAnimationFrame(requestIdRef.current);
      canvas.getContext("2d")?.reset();
      init();
      draw();
    };

    reset();
    window.addEventListener("resize", reset);

    return () => {
      window.removeEventListener("resize", reset);
      if (requestIdRef.current !== null) window.cancelAnimationFrame(requestIdRef.current);
    };
  }, []);

  return <canvas ref={canvasRef} className="h-full w-full" />;
}
