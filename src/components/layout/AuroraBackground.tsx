import { motion } from 'framer-motion'

export function AuroraBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0d0d2b]">
      {/* Aurora Orb 1 - Violet */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-45"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.45), transparent 70%)',
          top: '10%',
          left: '10%',
        }}
        animate={{
          x: [0, 300, 0],
          y: [0, -150, 0],
        }}
        transition={{
          duration: 28,
          ease: 'easeInOut',
          repeat: Infinity,
        }}
      />

      {/* Aurora Orb 2 - Cyan */}
      <motion.div
        className="absolute w-[700px] h-[700px] rounded-full blur-[140px] opacity-35"
        style={{
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.35), transparent 70%)',
          bottom: '10%',
          right: '10%',
        }}
        animate={{
          x: [0, -250, 0],
          y: [0, 120, 0],
        }}
        transition={{
          duration: 35,
          ease: 'easeInOut',
          repeat: Infinity,
        }}
      />

      {/* Aurora Orb 3 - Emerald */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full blur-[100px] opacity-30"
        style={{
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.30), transparent 70%)',
          bottom: '20%',
          left: '30%',
        }}
        animate={{
          x: [0, 200, 0],
          y: [0, 200, 0],
        }}
        transition={{
          duration: 42,
          ease: 'easeInOut',
          repeat: Infinity,
        }}
      />

      {/* Noise overlay */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          mixBlendMode: 'overlay',
        }}
      />

      {/* Content layer */}
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  )
}
