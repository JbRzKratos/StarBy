'use client';

import { Building2, GraduationCap, Trophy, PartyPopper, Flame, Sparkles } from 'lucide-react';
import type { BulkOrderType } from '@/lib/bulk-orders/types';

interface UseCaseCardsProps {
  onSelectType: (type: BulkOrderType) => void;
}

const USE_CASES: Array<{
  type: BulkOrderType;
  title: string;
  badge: string;
  description: string;
  icon: typeof Building2;
  gradient: string;
  recommended: string;
}> = [
  {
    type: 'Corporate',
    title: 'Corporate & Company',
    badge: 'Teams & Startups',
    description:
      'Polos, hoodies, and premium tees for employee kits, brand launches, hackathons, and executive gifts.',
    icon: Building2,
    gradient: 'from-blue-600/20 to-indigo-900/40 border-blue-500/30',
    recommended: 'Pique Polos & 240 GSM Tees',
  },
  {
    type: 'College',
    title: 'College & University',
    badge: 'Festivals & Batches',
    description:
      'College fest merchandise, department hoodies, farewell tees, batch yearbooks, and club wear.',
    icon: GraduationCap,
    gradient: 'from-amber-600/20 to-orange-900/40 border-amber-500/30',
    recommended: 'Oversized Boxy Tees & Hoodies',
  },
  {
    type: 'Sports Team',
    title: 'Sports & Esports Teams',
    badge: 'Jerseys & Performance',
    description:
      'Breathable moisture-wicking jerseys with player names, numbers, team crests, and sponsor placements.',
    icon: Trophy,
    gradient: 'from-emerald-600/20 to-teal-900/40 border-emerald-500/30',
    recommended: 'Sublimated Dry-Fit Jerseys',
  },
  {
    type: 'Event',
    title: 'Events & Conferences',
    badge: 'Conferences & Expos',
    description:
      'Volunteer uniforms, attendee welcome packs, stage crew apparel, and limited-edition conference merch.',
    icon: PartyPopper,
    gradient: 'from-purple-600/20 to-pink-900/40 border-purple-500/30',
    recommended: '180 GSM Round Neck Tees',
  },
  {
    type: 'Brand Merchandise',
    title: 'Brand & D2C Merch',
    badge: 'Private Label & Drops',
    description:
      'Ready-to-retail custom apparel with custom inside neck labels, woven tags, premium packaging, and barcoding.',
    icon: Flame,
    gradient: 'from-rose-600/20 to-red-900/40 border-rose-500/30',
    recommended: 'French Terry & Heavyweight Oversized',
  },
  {
    type: 'Creator Merchandise',
    title: 'Creator & Community',
    badge: 'Influencers & Guilds',
    description:
      'High-impact drops for streamers, artists, YouTube communities, and gaming clans with zero compromise on print quality.',
    icon: Sparkles,
    gradient: 'from-cyan-600/20 to-blue-900/40 border-cyan-500/30',
    recommended: 'Vibrant DTF & Oversized Silhouettes',
  },
];

export function UseCaseCards({ onSelectType }: UseCaseCardsProps) {
  return (
    <section className="py-16 md:py-24 bg-[#0A0A0A] text-[#F5F1EA] border-b border-white/10 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-mono tracking-widest uppercase text-[#3B5EFF] block font-bold">
            Tailored For Every Requirement
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-[#F5F1EA]">
            What Is Your Next Big Project?
          </h2>
          <p className="text-sm md:text-base text-pearl/70 font-sans">
            Choose your order category below to launch the quotation builder with optimal apparel
            and printing presets.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {USE_CASES.map((uc) => {
            const Icon = uc.icon;
            return (
              <div
                key={uc.type}
                onClick={() => onSelectType(uc.type)}
                className={`group relative p-6 sm:p-7 rounded-2xl bg-gradient-to-br ${uc.gradient} border backdrop-blur-md hover:border-white/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl cursor-pointer flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="font-mono text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full bg-white/10 text-pearl/80">
                      {uc.badge}
                    </span>
                  </div>

                  <h3 className="font-display text-xl sm:text-2xl font-bold uppercase tracking-tight text-[#F5F1EA] group-hover:text-white transition-colors">
                    {uc.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-pearl/70 font-sans mt-2.5 leading-relaxed">
                    {uc.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                  <div className="text-[11px] font-mono text-pearl/60">
                    <span className="text-pearl/40 block">Popular:</span>
                    <span className="text-white font-medium">{uc.recommended}</span>
                  </div>

                  <span className="font-mono text-xs font-bold text-[#3B5EFF] group-hover:translate-x-1 transition-transform flex items-center gap-1 uppercase tracking-wider">
                    Build ↗
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
