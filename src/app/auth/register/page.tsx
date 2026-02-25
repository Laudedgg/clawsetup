import AuthForm from '@/components/AuthForm';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-screen page-gradient px-4 py-12 sm:py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
        {/* Left — marketing panel */}
        <div className="hidden lg:block">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[rgb(255,79,90)] mb-5">Get Started</p>
          <h1 className="text-4xl xl:text-5xl font-serif italic text-white/80 leading-[1.2] mb-4">
            Deploy OpenClaw with a premium setup.
          </h1>
          <p className="text-base text-white/40 leading-relaxed mb-10">
            Create an account to access the setup guide, AI support, and managed hosting.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: '⚡', title: 'Fast', desc: 'Minutes to deploy' },
              { icon: '🔒', title: 'Private', desc: 'Dedicated VM' },
              { icon: '🤖', title: 'AI Support', desc: '24/7 instant help' },
              { icon: '🛡️', title: 'Managed', desc: 'We handle everything' },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 hover:border-white/[0.12] hover:bg-white/[0.03] transition-all">
                <div className="text-2xl mb-2">{item.icon}</div>
                <div className="font-semibold text-white/80 text-sm">{item.title}</div>
                <div className="text-[12px] text-white/35 mt-0.5">{item.desc}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center gap-3">
            <div className="flex -space-x-2">
              {['bg-[rgb(255,79,90)]', 'bg-sky-500', 'bg-amber-500', 'bg-emerald-500'].map((c, i) => (
                <div key={i} className={`w-7 h-7 rounded-full ${c} border-2 border-[rgb(10,11,16)] flex items-center justify-center text-[9px] font-bold text-white`}>
                  {['C', 'A', 'M', 'K'][i]}
                </div>
              ))}
            </div>
            <p className="text-[12px] text-white/30">200+ instances deployed</p>
          </div>
        </div>

        {/* Right — form */}
        <div className="flex items-center justify-center">
          <AuthForm mode="register" />
        </div>
      </div>
    </div>
  );
}
