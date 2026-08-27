import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
} from "motion/react";

export default function TiltedCard({
  children,
  className = "",
  rotateAmplitude = 10,
  scaleOnHover = 1.035,
}) {
  const ref = useRef(null);

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const scale = useMotionValue(1);

  const springRotateX = useSpring(rotateX, {
    stiffness: 180,
    damping: 22,
    mass: 0.6,
  });

  const springRotateY = useSpring(rotateY, {
    stiffness: 180,
    damping: 22,
    mass: 0.6,
  });

  const springScale = useSpring(scale, {
    stiffness: 220,
    damping: 22,
    mass: 0.6,
  });

  const handleMouseMove = (event) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateYValue =
      ((x - centerX) / centerX) * rotateAmplitude;

    const rotateXValue =
      -((y - centerY) / centerY) * rotateAmplitude;

    rotateX.set(rotateXValue);
    rotateY.set(rotateYValue);
  };

  const handleMouseEnter = () => {
    scale.set(scaleOnHover);
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
    scale.set(1);
  };

  return (
    <div
      ref={ref}
      className={`[perspective:1200px] ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="h-full w-full [transform-style:preserve-3d]"
        style={{
          rotateX: springRotateX,
          rotateY: springRotateY,
          scale: springScale,
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}