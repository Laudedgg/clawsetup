import { Tier } from '@/types';

const TIER_STYLES: Record<Tier, { label: string; bg: string; text: string }> = {
  free:  { label: 'Free',     bg: 'bg-white/[0.06]',       text: 'text-white/40' },
  tier1: { label: 'DIY',      bg: 'bg-sky-500/15',         text: 'text-sky-300' },
  tier2: { label: 'Assisted', bg: 'bg-amber-400/15',       text: 'text-amber-300' },
  tier3: { label: 'Managed',  bg: 'bg-[rgb(255,79,90)]/15', text: 'text-[rgb(255,120,100)]' },
};

export default function TierBadge({ tier }: { tier: Tier }) {
  const t = TIER_STYLES[tier] ?? TIER_STYLES.free;

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold ${t.bg} ${t.text}`}>
      {t.label}
    </span>
  );
}
