import AuthForm from '@/components/AuthForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen page-gradient px-4 py-12 sm:py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
        {/* Left — marketing panel */}
        <div className="hidden lg:block">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[rgb(255,79,90)] mb-5">Welcome Back</p>
          <h1 className="text-4xl xl:text-5xl font-serif italic text-white/80 leading-[1.2] mb-4">
            Sign in to your dashboard.
          </h1>
          <p className="text-base text-white/40 leading-relaxed mb-10">
            Manage your plan, access AI support, and launch your OpenClaw instance.
          </p>

          {/* Mini terminal demo */}
          <div className="rounded-xl border border-white/[0.08] bg-[rgb(12,13,18)] overflow-hidden">
            <div className="flex items-center gap-2 px-3.5 py-2 border-b border-white/[0.04] bg-white/[0.02]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
              <span className="ml-2 text-[10px] text-white/25 font-mono">dashboard</span>
            </div>
            <div className="p-5 font-mono text-[12px] space-y-2">
              <p className="text-white/30"><span className="text-[rgb(255,79,90)]">$</span> clawsetup status</p>
              <div className="space-y-1.5 pt-1">
                <p className="text-emerald-400/70">✓ Instance: <span className="text-white/50">claw-prod-x9k2</span></p>
                <p className="text-emerald-400/70">✓ Status: <span className="text-white/50">Running</span></p>
                <p className="text-emerald-400/70">✓ Uptime: <span className="text-white/50">99.8%</span></p>
                <p className="text-emerald-400/70">✓ Messages: <span className="text-white/50">12,438</span></p>
              </div>
              <p className="text-white/20 pt-1">All systems operational.</p>
            </div>
          </div>
        </div>

        {/* Right — form */}
        <div className="flex items-center justify-center">
          <AuthForm mode="login" />
        </div>
      </div>
    </div>
  );
}
