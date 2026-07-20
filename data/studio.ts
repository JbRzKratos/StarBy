export interface StoryBlock {
  id: string;
  heading: string;
  body: string;
  accent: string;
}

export const storyBlocks: StoryBlock[] = [
  {
    id: 'origin',
    heading: 'Born from a Blank Canvas',
    body: "StarBy started with a simple belief: every object you own should tell your story. Not a brand's story. Yours. We build the tools; you create the meaning.",
    accent: "We don't sell products. We sell self-expression.",
  },
  {
    id: 'craft',
    heading: 'Engineered, Not Printed',
    body: 'Every StarBy product undergoes a multi-step quality process. From 280gsm heavyweight cotton to giclée fine-art printing, we treat every piece like it belongs in a gallery.',
    accent: "Premium is not a price point. It's a standard.",
  },
  {
    id: 'tools',
    heading: 'Your Design Studio',
    body: 'Our live customizer puts professional design tools in your hands. Upload, position, preview — all in real time. No templates, no limitations, no compromises.',
    accent: 'Design without boundaries.',
  },
  {
    id: 'impact',
    heading: 'Made to Matter',
    body: "We produce on demand. Zero waste, zero overstock. Every item is made because someone designed it with intention. That's not just sustainable — it's personal.",
    accent: 'One piece at a time. Your piece.',
  },
];

export const processSteps = [
  { step: '01', title: 'Design', description: 'Use our live customizer or upload your artwork.' },
  { step: '02', title: 'Review', description: 'Preview your creation on the actual product.' },
  { step: '03', title: 'Produce', description: 'Printed and assembled at our quality lab.' },
  { step: '04', title: 'Deliver', description: 'Packed with care, shipped to your door.' },
];

export const brandValues = [
  { title: 'Quality First', description: 'Premium materials, precision manufacturing.' },
  { title: 'Zero Waste', description: 'On-demand production, no overstock.' },
  { title: 'Your Vision', description: 'Full creative control, no templates.' },
  { title: 'Design-Led', description: 'Studio-grade aesthetics, not print-on-demand.' },
];
