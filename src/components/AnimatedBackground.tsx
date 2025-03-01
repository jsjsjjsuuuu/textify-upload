
import { useEffect, useState } from "react";
import { renderCanvas } from "@/components/ui/canvas";

const AnimatedBackground = () => {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    renderCanvas();

    const handleMouseMove = () => {
      setIsActive(true);
      const timeout = setTimeout(() => {
        setIsActive(false);
      }, 2000);
      return () => clearTimeout(timeout);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <canvas
      className={`pointer-events-none absolute inset-0 -z-10 mx-auto transition-opacity duration-1000 ${
        isActive ? "opacity-70" : "opacity-30"
      }`}
      id="canvas"
    ></canvas>
  );
};

export default AnimatedBackground;
