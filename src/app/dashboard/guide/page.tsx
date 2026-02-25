'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import SetupGuide from '@/components/SetupGuide';

export default function GuidePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated') {
      const tier = (session?.user as any)?.tier;
      const paymentStatus = (session?.user as any)?.paymentStatus;
      if (tier === 'free' || paymentStatus !== 'completed') {
        router.push('/dashboard');
      }
    }
  }, [status, session, router]);

  if (status === 'loading' || !session) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-7 h-7 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
      </div>
    );
  }

  return (
    <div className="py-4 sm:py-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="pill w-fit mb-3">Setup Guide</div>
        <h1 className="text-2xl sm:text-3xl font-bold">Get OpenClaw running</h1>
        <p className="text-white/45 text-[13px] sm:text-sm mt-1.5">
          Follow the steps below to install and configure your AI Telegram bot.
          Check off tasks as you go — your progress is saved in this session.
        </p>
      </div>

      <SetupGuide />
    </div>
  );
}

