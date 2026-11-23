import React from 'react';

interface FSocietyMaskProps {
  className?: string;
  size?: number;
}

export const FSocietyMask: React.FC<FSocietyMaskProps> = ({
  className = "w-6 h-6",
  size
}) => {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      {/* Top Hat */}
      <path
        d="M26 38H74V18C74 15 70 14 66 14H34C30 14 26 15 26 18V38Z"
        fill="#111827"
        stroke="#22c55e"
        strokeWidth="1.5"
      />
      {/* Hat Ribbon */}
      <path
        d="M26 32H74V37H26V32Z"
        fill="#ef4444"
      />
      {/* Hat Brim */}
      <ellipse
        cx="50"
        cy="38"
        rx="36"
        ry="6"
        fill="#1f2937"
        stroke="#22c55e"
        strokeWidth="1.5"
      />

      {/* Face Base */}
      <path
        d="M25 40C25 36 75 36 75 40C77 62 72 82 50 88C28 82 23 62 25 40Z"
        fill="#f8fafc"
        stroke="#15803d"
        strokeWidth="1.5"
      />

      {/* Rosy Cheeks */}
      <circle cx="33" cy="58" r="6" fill="#f87171" opacity="0.85" />
      <circle cx="67" cy="58" r="6" fill="#f87171" opacity="0.85" />

      {/* Dark Eye Sockets */}
      <ellipse cx="36" cy="48" rx="7" ry="5" fill="#0f172a" />
      <ellipse cx="64" cy="48" rx="7" ry="5" fill="#0f172a" />

      {/* Piercing Pupils */}
      <circle cx="36" cy="48" r="2" fill="#22c55e" />
      <circle cx="64" cy="48" r="2" fill="#22c55e" />

      {/* Arched Eyebrows */}
      <path
        d="M28 42C32 38 42 41 43 43"
        stroke="#0f172a"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M72 42C68 38 58 41 57 43"
        stroke="#0f172a"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Mustache - Iconic Handlebar */}
      <path
        d="M34 65C38 61 46 63 50 66C54 63 62 61 66 65C69 68 62 70 56 67C52 65 48 65 44 67C38 70 31 68 34 65Z"
        fill="#0f172a"
      />

      {/* Sinister Grin Mouth */}
      <path
        d="M33 71C40 82 60 82 67 71C60 76 40 76 33 71Z"
        fill="#b91c1c"
        stroke="#0f172a"
        strokeWidth="1"
      />

      {/* Teeth in Grin */}
      <path
        d="M37 72H63"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M43 71V74M50 72V75M57 71V74"
        stroke="#ffffff"
        strokeWidth="1.5"
      />

      {/* Chin Dimple */}
      <circle cx="50" cy="83" r="1.5" fill="#cbd5e1" />
    </svg>
  );
};
