import React from "react";

export function FlagVN({ className = "w-5 h-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 640 480" className={`inline-block shrink-0 rounded-sm shadow-sm ${className}`} xmlns="http://www.w3.org/2000/svg">
      <rect width="640" height="480" fill="#da251d" rx="60" ry="60" />
      <polygon
        fill="#ffff00"
        points="320,102 360,227 491,227 385,304 425,429 320,352 215,429 255,304 149,227 280,227"
      />
    </svg>
  );
}

export function FlagGB({ className = "w-5 h-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 640 480" className={`inline-block shrink-0 rounded-sm shadow-sm ${className}`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="gb-rounded-clip">
          <rect width="640" height="480" rx="60" ry="60" />
        </clipPath>
      </defs>
      <g clipPath="url(#gb-rounded-clip)">
        <path fill="#012169" d="M0 0h640v480H0z"/>
        <path stroke="#fff" strokeWidth="80" d="m0 0 640 480M640 0 0 480"/>
        <path stroke="#c8102e" strokeWidth="45" d="m0 0 640 480M640 0 0 480"/>
        <path stroke="#fff" strokeWidth="120" d="M320 0v480M0 240h640"/>
        <path stroke="#c8102e" strokeWidth="72" d="M320 0v480M0 240h640"/>
      </g>
    </svg>
  );
}
