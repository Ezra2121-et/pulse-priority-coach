import { useEffect, useRef } from "react";

export function CursorSpotlight() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (ref.current) {
        ref.current.style.setProperty("--x", `${e.clientX}px`);
        ref.current.style.setProperty("--y", `${e.clientY}px`);
        ref.current.style.opacity = "1";
      }
    };

    const handleMouseLeave = () => {
      if (ref.current) ref.current.style.opacity = "0";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed inset-0 z-0 opacity-0 transition-opacity duration-300"
      style={{
        background:
          "radial-gradient(600px circle at var(--x, 50%) var(--y, 50%), oklch(0.65 0.22 260 / 6%), transparent 40%)",
      }}
    />
  );
}
