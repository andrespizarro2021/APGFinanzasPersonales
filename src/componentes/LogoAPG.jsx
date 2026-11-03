export function LogoAPG({ className = "w-10 h-10" }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">
        <defs>
          <linearGradient id="neon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>

        {/* Hexágono de fondo translúcido estilo Glass/Tech */}
        <polygon 
          points="50,10 90,30 90,70 50,90 10,70 10,30" 
          fill="rgba(15, 23, 42, 0.6)" 
          stroke="url(#neon-grad)" 
          strokeWidth="3" 
        />

        {/* Gráfico de crecimiento / Picos estilizados de APG */}
        <path
          d="M25 60 L42 42 L58 55 L75 30"
          stroke="url(#neon-grad)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Puntos de nodos de datos (Neón) */}
        <circle cx="25" cy="60" r="4" fill="#06b6d4" />
        <circle cx="42" cy="42" r="4" fill="#6366f1" />
        <circle cx="58" cy="55" r="4" fill="#a855f7" />
        <circle cx="75" cy="30" r="5" fill="#ec4899" className="animate-pulse" />
      </svg>
    </div>
  );
}