import { type ServiceId } from '@/lib/launcher-data'
import { ServiceLogo } from './service-logo'
import { FlowFill } from './flow-fill'

export type LaunchState = {
  key: number
  name: string
  service?: ServiceId
  icon?: string
  action: string
}

export function LaunchOverlay({ launch, onDismiss }: { launch: LaunchState; onDismiss: () => void }) {
  return (
    <div
      role="status"
      aria-live="assertive"
      onClick={onDismiss}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-[3vh] bg-black/85 backdrop-blur-md animate-in fade-in duration-200 will-change-[opacity]"
    >
      <div className="grid size-[clamp(96px,9vw,180px)] place-items-center rounded-[28%] bg-white/10 ring-1 ring-inset ring-white/15 animate-in zoom-in-90 duration-500">
        <ServiceLogo id={launch.service} icon={launch.icon} className={launch.service ? 'h-[48%] w-[66%]' : 'size-full rounded-[inherit] object-cover'} />
      </div>
      <div className="text-center">
        <p className="text-[clamp(16px,1.4vw,28px)] font-semibold text-white">{launch.action}</p>
        <p className="mt-1 text-[clamp(12px,0.9vw,18px)] text-white/55">{`Deep-linking into ${launch.name}`}</p>
      </div>
      <div className="h-[3.5px] w-[clamp(120px,10vw,220px)] overflow-hidden rounded-full bg-white/15" aria-hidden="true">
        <div
          className="relative h-full origin-left rounded-full animate-slide-progress [animation-duration:2000ms] overflow-hidden"
          style={{
            boxShadow: '0 0 14px var(--tv-accent, #00f0ff), 0 0 20px var(--tv-glow-2, #a855f7)',
          }}
        >
          <FlowFill />
        </div>
      </div>
    </div>
  )
}
