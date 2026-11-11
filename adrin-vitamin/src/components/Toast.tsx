import { AnimatePresence, motion } from 'framer-motion'
import { useUI } from '../store/ui'
import { GlowDot } from './Logo'

export function Toast() {
  const toast = useUI((s) => s.toast)
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[90] flex justify-center px-4" aria-live="polite">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="glass flex items-center gap-3 rounded-full px-5 py-3 text-sm text-bone"
          >
            <GlowDot />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
