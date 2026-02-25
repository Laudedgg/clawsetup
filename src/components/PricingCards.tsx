'use client';

import { TIER_CONFIGS } from '@/lib/constants';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function PricingCards() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleSelectTier = (tierId: string) => {
    if (tierId === 'tier4') {
      window.location.href = 'mailto:support@clawsetup.com';
      return;
    }
    if (!session) {
      router.push('/auth/login');
      return;
    }
    router.push(`/checkout?tier=${tierId}`);
  };

  const tiers = Object.entries(TIER_CONFIGS);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-4xl mx-auto">
      {tiers.map(([tierId, config]) => {
        const isPopular = config.popular;
        const isEnterprise = config.billing === 'custom';
        const hasDiscount = config.originalPrice && config.originalPrice > config.price;

        return (
          <div key={tierId} className="relative">
            {/* Popular badge */}
            {isPopular && (
              <div className="absolute -top-3.5 left-0 right-0 flex justify-center z-10">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-4 py-1 text-[11px] font-semibold text-white tracking-wide shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, rgb(255,79,90) 0%, rgb(255,138,92) 100%)',
                  }}
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Most Popular
                </span>
              </div>
            )}

            <div
              className={`flex flex-col h-full rounded-2xl p-7 sm:p-8 transition-all duration-300 ${
                isPopular
                  ? 'border-2 border-[rgb(255,79,90)]/40 shadow-[0_0_40px_-8px_rgba(255,79,90,0.15)] pt-10'
                  : 'border border-white/[0.08] hover:border-white/15'
              }`}
              style={{
                background: isPopular
                  ? 'linear-gradient(170deg, rgba(255,79,90,0.12) 0%, rgba(255,138,92,0.06) 35%, rgba(10,11,16,0.95) 70%)'
                  : 'rgba(255,255,255,0.02)',
              }}
            >
              {/* Header: name + launch badge */}
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-lg font-bold text-white/90">{config.name}</h3>
                {hasDiscount && (
                  <span className="inline-flex items-center rounded-full bg-emerald-500/15 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400 tracking-wide uppercase">
                    Launch Price
                  </span>
                )}
              </div>

              {/* Price block */}
              {isEnterprise ? (
                <div className="mb-5">
                  <p className="text-xl font-serif italic text-white/60 leading-snug">
                    {config.tagline}
                  </p>
                </div>
              ) : (
                <div className="mb-2">
                  {/* Slashed original price */}
                  {hasDiscount && (
                    <span className="text-base text-white/25 line-through mr-2">
                      ${config.originalPrice?.toFixed(2)}
                    </span>
                  )}
                  <span className={`font-bold text-white ${isPopular ? 'text-3xl' : 'text-2xl'}`}>
                    ${config.price}
                  </span>
                  {config.billing === 'monthly' && (
                    <span className="text-xs text-white/35 ml-1.5">/ month</span>
                  )}
                </div>
              )}

              {/* Access period */}
              {config.accessPeriod && (
                <p className="text-xs text-white/30 mb-5">{config.accessPeriod}</p>
              )}

              {/* Divider */}
              <div className="h-px bg-white/[0.06] mb-5" />

              {/* Features */}
              <ul className="space-y-2.5 mb-7 flex-1">
                {config.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-[13px] leading-snug">
                    <span className="mt-0.5 shrink-0">
                      {isEnterprise ? (
                        <svg className="w-3.5 h-3.5 text-[rgb(255,79,90)]" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5 text-[rgb(255,79,90)]" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </span>
                    <span className={isPopular ? 'text-white/65' : 'text-white/50'}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => handleSelectTier(tierId)}
                className={`w-full rounded-xl py-3 text-sm font-semibold transition-all duration-200 ${
                  isPopular || isEnterprise
                    ? 'text-white shadow-lg hover:shadow-xl hover:brightness-110 hover:-translate-y-0.5'
                    : 'border border-white/10 bg-white/[0.04] text-white/80 hover:bg-white/[0.08] hover:text-white hover:-translate-y-0.5'
                }`}
                style={
                  isPopular || isEnterprise
                    ? {
                        background: 'linear-gradient(135deg, rgb(255,79,90) 0%, rgb(255,138,92) 100%)',
                      }
                    : undefined
                }
              >
                {config.cta || 'Get Started'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
