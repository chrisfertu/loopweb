// Concentric rotating rings echoing the app's home-screen spiral.
// Pure SVG + CSS animation; disabled via prefers-reduced-motion in CSS.
const SpiralRings = ({ className = '', opacity = 0.1 }) => (
  <div
    className={`pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden ${className}`}
    aria-hidden="true"
    style={{ opacity }}
  >
    <svg
      viewBox="0 0 1200 1200"
      className="w-[160vmin] h-[160vmin] flex-shrink-0"
      fill="none"
    >
      <g className="ring-spin-slow" style={{ transformOrigin: '600px 600px' }}>
        {[140, 260, 380, 500].map((r) => (
          <circle key={r} cx="600" cy="600" r={r} stroke="white" strokeWidth="1" />
        ))}
      </g>
      <g className="ring-spin-reverse" style={{ transformOrigin: '600px 600px' }}>
        {[200, 320, 440, 560].map((r) => (
          <circle
            key={r}
            cx="600"
            cy="600"
            r={r}
            stroke="white"
            strokeWidth="1"
            strokeDasharray={`${r * 2.4} ${r * 1.8}`}
            strokeLinecap="round"
          />
        ))}
      </g>
      <g className="ring-spin-slower" style={{ transformOrigin: '600px 600px' }}>
        {[170, 290, 410, 530].map((r) => (
          <circle
            key={r}
            cx="600"
            cy="600"
            r={r}
            stroke="white"
            strokeWidth="0.75"
            strokeDasharray={`${r * 0.9} ${r * 3.2}`}
            strokeLinecap="round"
          />
        ))}
      </g>
    </svg>
  </div>
);

export default SpiralRings;
