/**
 * FREGORO WALL STUDIO - CURATED DESIGN PLACEMENTS
 *
 * Pre-composed, art-directed wall design placements combining:
 * 1. HYBRID SPLIT + FRAME COMBOS: Central continuous multi-panel split artwork flanked by curated individual prints.
 * 2. CURATED GALLERY WALLS: Harmonious collections of distinct artworks.
 */

import type { SlotSelection } from './types';

export interface DesignPlacement {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  themeSlug: string;
  themeName: string;
  layoutId: string;
  layoutSlug: string;
  physicalPrintCount: number;
  coverageLabel: string;
  accentColor: string;
  previewImageUrl: string;
  badge?: string;
  selections: Record<string, SlotSelection>;
}

export const FREGORO_DESIGN_PLACEMENTS: DesignPlacement[] = [
  {
    "id": "placement-stepped-gotham-nocturne",
    "slug": "stepped-gotham-nocturne-5",
    "title": "The Dark Knight: Gotham Nocturne",
    "tagline": "5-Piece Stepped Split Hero & Gotham Flank Gallery",
    "description": "Commanding 5-print hybrid wall art. Features a 3-panel stepped split (6×9\", 6×11\", 6×9\") of Gotham’s skyline flanked by dual vertical A4 shadow portraits of Batman.",
    "themeSlug": "dc",
    "themeName": "DC / Gotham Noir",
    "layoutId": "hybrid-stepped-triptych-flank-5",
    "layoutSlug": "hybrid-stepped-triptych-flank",
    "physicalPrintCount": 5,
    "coverageLabel": "93 × 30 cm",
    "accentColor": "#3B5EFF",
    "previewImageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_9776c4f2-ec7d-46df-b71b-7b83937385ca_3.webp",
    "badge": "Stepped Dual-Pillar",
    "selections": {
      "slot-stf5-left-a4": {
        "slotId": "slot-stf5-left-a4",
        "artworkId": "art-dc-05",
        "title": "Batman Standing On Gothams Highest Rooftop Duri",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Batman_standing_on_Gothams_highest_rooftop_duri_33c23a87-b982-4d38-a47f-af0c820e944e.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Batman_standing_on_Gothams_highest_rooftop_duri_33c23a87-b982-4d38-a47f-af0c820e944e.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A4",
        "price": 199
      },
      "slot-stf5-split-1": {
        "slotId": "slot-stf5-split-1",
        "artworkId": "art-dc-12",
        "title": "The Batman — Gotham Rain Nocturne Totem",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_9776c4f2-ec7d-46df-b71b-7b83937385ca_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_9776c4f2-ec7d-46df-b71b-7b83937385ca_3.webp",
        "splitGroupId": "split-stf5-hero",
        "panelIndex": 0,
        "physicalSize": "CUSTOM",
        "price": 499
      },
      "slot-stf5-split-2": {
        "slotId": "slot-stf5-split-2",
        "artworkId": "art-dc-12",
        "title": "The Batman — Gotham Rain Nocturne Totem",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_9776c4f2-ec7d-46df-b71b-7b83937385ca_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_9776c4f2-ec7d-46df-b71b-7b83937385ca_3.webp",
        "splitGroupId": "split-stf5-hero",
        "panelIndex": 1,
        "physicalSize": "CUSTOM",
        "price": 499
      },
      "slot-stf5-split-3": {
        "slotId": "slot-stf5-split-3",
        "artworkId": "art-dc-12",
        "title": "The Batman — Gotham Rain Nocturne Totem",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_9776c4f2-ec7d-46df-b71b-7b83937385ca_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_9776c4f2-ec7d-46df-b71b-7b83937385ca_3.webp",
        "splitGroupId": "split-stf5-hero",
        "panelIndex": 2,
        "physicalSize": "CUSTOM",
        "price": 499
      },
      "slot-stf5-right-a4": {
        "slotId": "slot-stf5-right-a4",
        "artworkId": "art-dc-04",
        "title": "Batman Standing Alone On A Rain Soaked Gothic R",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Batman_standing_alone_on_a_rain_soaked_gothic_r_c46d574d-e4ce-4dea-abdd-eb59f01017eb.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Batman_standing_alone_on_a_rain_soaked_gothic_r_c46d574d-e4ce-4dea-abdd-eb59f01017eb.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A4",
        "price": 199
      }
    }
  },
  {
    "id": "placement-stepped-avengers-midtown",
    "slug": "stepped-avengers-midtown-5",
    "title": "Avengers: Midtown Vanguard",
    "tagline": "5-Piece Stepped Split Hero & Iron Man Vanguard",
    "description": "Dynamic Marvel hybrid showcase. Features a 3-panel stepped split of Spider-Man overlooking Queens, flanked by Iron Man Mark LXXXV and Captain America’s Vibranium Shield.",
    "themeSlug": "marvel",
    "themeName": "Marvel / Avengers",
    "layoutId": "hybrid-stepped-triptych-flank-5",
    "layoutSlug": "hybrid-stepped-triptych-flank",
    "physicalPrintCount": 5,
    "coverageLabel": "93 × 30 cm",
    "accentColor": "#E62429",
    "previewImageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Miles_Morales_Marvels_Spider_Man_game_character_0b07a660-89c2-4834-87e3-a122a2e93ec6.webp",
    "badge": "Stepped Dual-Pillar",
    "selections": {
      "slot-stf5-left-a4": {
        "slotId": "slot-stf5-left-a4",
        "artworkId": "art-mar-01",
        "title": "Miles Morales — Brooklyn Rooftop Leap",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Miles_Morales_Marvels_Spider_Man_game_character_0b07a660-89c2-4834-87e3-a122a2e93ec6.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Miles_Morales_Marvels_Spider_Man_game_character_0b07a660-89c2-4834-87e3-a122a2e93ec6.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A4",
        "price": 499
      },
      "slot-stf5-split-1": {
        "slotId": "slot-stf5-split-1",
        "artworkId": "art-mar-13",
        "title": "Spider-Man vs Venom — Symbiote Duality",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_14b9a2cc-0d91-43f3-a299-36b138754a76_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_14b9a2cc-0d91-43f3-a299-36b138754a76_3.webp",
        "splitGroupId": "split-stf5-hero",
        "panelIndex": 0,
        "physicalSize": "CUSTOM",
        "price": 499
      },
      "slot-stf5-split-2": {
        "slotId": "slot-stf5-split-2",
        "artworkId": "art-mar-13",
        "title": "Spider-Man vs Venom — Symbiote Duality",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_14b9a2cc-0d91-43f3-a299-36b138754a76_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_14b9a2cc-0d91-43f3-a299-36b138754a76_3.webp",
        "splitGroupId": "split-stf5-hero",
        "panelIndex": 1,
        "physicalSize": "CUSTOM",
        "price": 499
      },
      "slot-stf5-split-3": {
        "slotId": "slot-stf5-split-3",
        "artworkId": "art-mar-13",
        "title": "Spider-Man vs Venom — Symbiote Duality",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_14b9a2cc-0d91-43f3-a299-36b138754a76_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_14b9a2cc-0d91-43f3-a299-36b138754a76_3.webp",
        "splitGroupId": "split-stf5-hero",
        "panelIndex": 2,
        "physicalSize": "CUSTOM",
        "price": 499
      },
      "slot-stf5-right-a4": {
        "slotId": "slot-stf5-right-a4",
        "artworkId": "art-mar-02",
        "title": "Spider-Gwen — Multiverse Skyline",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_httpss.mj.runL5ssYe0WJpg_Vertical_Spider_Gwen_9503e0a3-bbe1-4d50-a9dc-b37c52c8297b_2.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_httpss.mj.runL5ssYe0WJpg_Vertical_Spider_Gwen_9503e0a3-bbe1-4d50-a9dc-b37c52c8297b_2.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A4",
        "price": 199
      }
    }
  },
  {
    "id": "placement-stepped-apex-velocity",
    "slug": "stepped-apex-velocity-7",
    "title": "Apex Velocity: Stuttgart Motorsport",
    "tagline": "7-Piece Stepped Triptych with 13×19\" Panorama Crown",
    "description": "High-octane motorsport gallery featuring a 3-panel stepped split hypercar, crowned by a grand 13×19\" Porsche 911 GT3 RS track panorama and framed by Ferrari Daytona SP3 and McLaren Senna.",
    "themeSlug": "cars",
    "themeName": "Supercars / Motorsport",
    "layoutId": "hybrid-stepped-triptych-crown-7",
    "layoutSlug": "hybrid-stepped-triptych-crown",
    "physicalPrintCount": 7,
    "coverageLabel": "93 × 87 cm",
    "accentColor": "#FF3366",
    "previewImageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_3d45351d-0d64-4e6c-91eb-a97f774dea00_2.webp",
    "badge": "Crown Showcase",
    "selections": {
      "slot-stc7-crown": {
        "slotId": "slot-stc7-crown",
        "artworkId": "art-car-02",
        "title": "Toyota Supra MK4 — Smoke Drift Horizon",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_3d45351d-0d64-4e6c-91eb-a97f774dea00_2.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_3d45351d-0d64-4e6c-91eb-a97f774dea00_2.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "13x19",
        "price": 499
      },
      "slot-stc7-left-a4": {
        "slotId": "slot-stc7-left-a4",
        "artworkId": "art-car-01",
        "title": "JDM Midnight Expressway",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_2949b909-0642-40a9-aea2-61d433fda437_2.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_2949b909-0642-40a9-aea2-61d433fda437_2.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A4",
        "price": 199
      },
      "slot-stc7-split-1": {
        "slotId": "slot-stc7-split-1",
        "artworkId": "art-car-02",
        "title": "Toyota Supra MK4 — Smoke Drift Horizon",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_3d45351d-0d64-4e6c-91eb-a97f774dea00_2.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_3d45351d-0d64-4e6c-91eb-a97f774dea00_2.webp",
        "splitGroupId": "split-stc7-hero",
        "panelIndex": 0,
        "physicalSize": "CUSTOM",
        "price": 499
      },
      "slot-stc7-split-2": {
        "slotId": "slot-stc7-split-2",
        "artworkId": "art-car-02",
        "title": "Toyota Supra MK4 — Smoke Drift Horizon",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_3d45351d-0d64-4e6c-91eb-a97f774dea00_2.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_3d45351d-0d64-4e6c-91eb-a97f774dea00_2.webp",
        "splitGroupId": "split-stc7-hero",
        "panelIndex": 1,
        "physicalSize": "CUSTOM",
        "price": 499
      },
      "slot-stc7-split-3": {
        "slotId": "slot-stc7-split-3",
        "artworkId": "art-car-02",
        "title": "Toyota Supra MK4 — Smoke Drift Horizon",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_3d45351d-0d64-4e6c-91eb-a97f774dea00_2.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_3d45351d-0d64-4e6c-91eb-a97f774dea00_2.webp",
        "splitGroupId": "split-stc7-hero",
        "panelIndex": 2,
        "physicalSize": "CUSTOM",
        "price": 499
      },
      "slot-stc7-right-a4": {
        "slotId": "slot-stc7-right-a4",
        "artworkId": "art-car-03",
        "title": "Supercar Twin-Turbo Launch",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_4167ceb2-24b6-48a1-bdf9-b808b32589b4_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_4167ceb2-24b6-48a1-bdf9-b808b32589b4_3.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A4",
        "price": 199
      },
      "slot-stc7-bot-a4": {
        "slotId": "slot-stc7-bot-a4",
        "artworkId": "art-car-10",
        "title": "Trackday Precision Apex",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_bf462388-2c3a-42f7-a5a0-3736ddeebd72_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_bf462388-2c3a-42f7-a5a0-3736ddeebd72_3.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A4",
        "price": 199
      }
    }
  },
  {
    "id": "placement-stepped-anime-titan",
    "slug": "stepped-anime-titan-9",
    "title": "Shingeki Vanguard: 5-Panel Stepped Wave",
    "tagline": "9-Piece Stepped Wave Split & Shonen Flank Wings",
    "description": "Immersive anime installation featuring our signature 5-panel stepped wave split (reduced 50%) framed symmetrically by stacked Demon Slayer Hinokami Kagura and Jujutsu Kaisen domain prints.",
    "themeSlug": "anime",
    "themeName": "Anime / Shonen",
    "layoutId": "hybrid-stepped-wave-flank-9",
    "layoutSlug": "hybrid-stepped-wave-flank",
    "physicalPrintCount": 9,
    "coverageLabel": "101 × 31 cm",
    "accentColor": "#FF6B00",
    "previewImageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_19f3439c-b06b-4e11-8fa1-b4ccaa5eb1eb_3.webp",
    "badge": "Stepped Wave Flank",
    "selections": {
      "slot-swf9-left-top": {
        "slotId": "slot-swf9-left-top",
        "artworkId": "art-ani-02",
        "title": "Zenitsu Agatsuma — Thunder Flash Grid",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_19f3439c-b06b-4e11-8fa1-b4ccaa5eb1eb_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_19f3439c-b06b-4e11-8fa1-b4ccaa5eb1eb_3.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A5",
        "price": 499
      },
      "slot-swf9-left-bot": {
        "slotId": "slot-swf9-left-bot",
        "artworkId": "art-ani-04",
        "title": "Son Goku — Ultra Instinct Power Surge Grid",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_2e482216-5195-4826-bbf0-e35c334e56c1_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_2e482216-5195-4826-bbf0-e35c334e56c1_3.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A5",
        "price": 499
      },
      "slot-swf9-split-1": {
        "slotId": "slot-swf9-split-1",
        "artworkId": "art-ani-02",
        "title": "Zenitsu Agatsuma — Thunder Flash Grid",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_19f3439c-b06b-4e11-8fa1-b4ccaa5eb1eb_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_19f3439c-b06b-4e11-8fa1-b4ccaa5eb1eb_3.webp",
        "splitGroupId": "split-swf9-hero",
        "panelIndex": 0,
        "physicalSize": "CUSTOM",
        "price": 499
      },
      "slot-swf9-split-2": {
        "slotId": "slot-swf9-split-2",
        "artworkId": "art-ani-02",
        "title": "Zenitsu Agatsuma — Thunder Flash Grid",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_19f3439c-b06b-4e11-8fa1-b4ccaa5eb1eb_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_19f3439c-b06b-4e11-8fa1-b4ccaa5eb1eb_3.webp",
        "splitGroupId": "split-swf9-hero",
        "panelIndex": 1,
        "physicalSize": "CUSTOM",
        "price": 499
      },
      "slot-swf9-split-3": {
        "slotId": "slot-swf9-split-3",
        "artworkId": "art-ani-02",
        "title": "Zenitsu Agatsuma — Thunder Flash Grid",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_19f3439c-b06b-4e11-8fa1-b4ccaa5eb1eb_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_19f3439c-b06b-4e11-8fa1-b4ccaa5eb1eb_3.webp",
        "splitGroupId": "split-swf9-hero",
        "panelIndex": 2,
        "physicalSize": "CUSTOM",
        "price": 499
      },
      "slot-swf9-split-4": {
        "slotId": "slot-swf9-split-4",
        "artworkId": "art-ani-02",
        "title": "Zenitsu Agatsuma — Thunder Flash Grid",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_19f3439c-b06b-4e11-8fa1-b4ccaa5eb1eb_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_19f3439c-b06b-4e11-8fa1-b4ccaa5eb1eb_3.webp",
        "splitGroupId": "split-swf9-hero",
        "panelIndex": 3,
        "physicalSize": "CUSTOM",
        "price": 499
      },
      "slot-swf9-split-5": {
        "slotId": "slot-swf9-split-5",
        "artworkId": "art-ani-02",
        "title": "Zenitsu Agatsuma — Thunder Flash Grid",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_19f3439c-b06b-4e11-8fa1-b4ccaa5eb1eb_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_19f3439c-b06b-4e11-8fa1-b4ccaa5eb1eb_3.webp",
        "splitGroupId": "split-swf9-hero",
        "panelIndex": 4,
        "physicalSize": "CUSTOM",
        "price": 499
      },
      "slot-swf9-right-top": {
        "slotId": "slot-swf9-right-top",
        "artworkId": "art-ani-05",
        "title": "Katana Slash Horizon",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_69ef2457-73d1-4546-b10d-7473f04557f4_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_69ef2457-73d1-4546-b10d-7473f04557f4_3.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A5",
        "price": 199
      },
      "slot-swf9-right-bot": {
        "slotId": "slot-swf9-right-bot",
        "artworkId": "art-ani-06",
        "title": "Celestial Manga Fury",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_6a8ea070-e841-4bcc-944d-a9a48987dc8a_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_6a8ea070-e841-4bcc-944d-a9a48987dc8a_3.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A5",
        "price": 199
      }
    }
  },
  {
    "id": "placement-stepped-cyberpunk-nightcity",
    "slug": "stepped-cyberpunk-nightcity-9",
    "title": "Night City: Neon Horizon Wave",
    "tagline": "9-Piece Stepped Wave Split & Cyberpunk Megacity",
    "description": "Atmospheric gaming composition with a 5-panel stepped wave split of Call of Duty Warzone Recon, flanked by Red Dead Redemption and cyberpunk character art.",
    "themeSlug": "gamers",
    "themeName": "Gaming / Cyberpunk",
    "layoutId": "hybrid-stepped-wave-flank-9",
    "layoutSlug": "hybrid-stepped-wave-flank",
    "physicalPrintCount": 9,
    "coverageLabel": "101 × 31 cm",
    "accentColor": "#00E5FF",
    "previewImageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_d4b9b6a3-dbf1-444c-8c1d-6435e6a08d01_3.webp",
    "badge": "Stepped Wave Flank",
    "selections": {
      "slot-swf9-left-top": {
        "slotId": "slot-swf9-left-top",
        "artworkId": "art-gam-07",
        "title": "Red Dead Western Sunset",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_65ace32d-6f76-4f1a-9dca-d07645ae382f_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_65ace32d-6f76-4f1a-9dca-d07645ae382f_3.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A5",
        "price": 199
      },
      "slot-swf9-left-bot": {
        "slotId": "slot-swf9-left-bot",
        "artworkId": "art-gam-12",
        "title": "Doom Slayer Hellfire Charge",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_8cf7dc94-2969-40bf-ace4-2bd1fa2e7f3e_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_8cf7dc94-2969-40bf-ace4-2bd1fa2e7f3e_3.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A5",
        "price": 199
      },
      "slot-swf9-split-1": {
        "slotId": "slot-swf9-split-1",
        "artworkId": "art-gam-19",
        "title": "Simon Ghost Riley — Warzone Night Vision Grid",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_d4b9b6a3-dbf1-444c-8c1d-6435e6a08d01_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_d4b9b6a3-dbf1-444c-8c1d-6435e6a08d01_3.webp",
        "splitGroupId": "split-swf9-hero",
        "panelIndex": 0,
        "physicalSize": "CUSTOM",
        "price": 499
      },
      "slot-swf9-split-2": {
        "slotId": "slot-swf9-split-2",
        "artworkId": "art-gam-19",
        "title": "Simon Ghost Riley — Warzone Night Vision Grid",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_d4b9b6a3-dbf1-444c-8c1d-6435e6a08d01_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_d4b9b6a3-dbf1-444c-8c1d-6435e6a08d01_3.webp",
        "splitGroupId": "split-swf9-hero",
        "panelIndex": 1,
        "physicalSize": "CUSTOM",
        "price": 499
      },
      "slot-swf9-split-3": {
        "slotId": "slot-swf9-split-3",
        "artworkId": "art-gam-19",
        "title": "Simon Ghost Riley — Warzone Night Vision Grid",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_d4b9b6a3-dbf1-444c-8c1d-6435e6a08d01_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_d4b9b6a3-dbf1-444c-8c1d-6435e6a08d01_3.webp",
        "splitGroupId": "split-swf9-hero",
        "panelIndex": 2,
        "physicalSize": "CUSTOM",
        "price": 499
      },
      "slot-swf9-split-4": {
        "slotId": "slot-swf9-split-4",
        "artworkId": "art-gam-19",
        "title": "Simon Ghost Riley — Warzone Night Vision Grid",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_d4b9b6a3-dbf1-444c-8c1d-6435e6a08d01_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_d4b9b6a3-dbf1-444c-8c1d-6435e6a08d01_3.webp",
        "splitGroupId": "split-swf9-hero",
        "panelIndex": 3,
        "physicalSize": "CUSTOM",
        "price": 499
      },
      "slot-swf9-split-5": {
        "slotId": "slot-swf9-split-5",
        "artworkId": "art-gam-19",
        "title": "Simon Ghost Riley — Warzone Night Vision Grid",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_d4b9b6a3-dbf1-444c-8c1d-6435e6a08d01_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_d4b9b6a3-dbf1-444c-8c1d-6435e6a08d01_3.webp",
        "splitGroupId": "split-swf9-hero",
        "panelIndex": 4,
        "physicalSize": "CUSTOM",
        "price": 499
      },
      "slot-swf9-right-top": {
        "slotId": "slot-swf9-right-top",
        "artworkId": "art-gam-15",
        "title": "Apex Legends Champion Squad",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_9761e0f3-8c73-4553-be25-3622120e316a_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_9761e0f3-8c73-4553-be25-3622120e316a_3.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A5",
        "price": 199
      },
      "slot-swf9-right-bot": {
        "slotId": "slot-swf9-right-bot",
        "artworkId": "art-gam-21",
        "title": "Simon Ghost Riley — Call of Duty Recon Warfare",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_f0134bff-f4ac-4ae8-89ff-3ce9931423a3_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_f0134bff-f4ac-4ae8-89ff-3ce9931423a3_3.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A5",
        "price": 499
      }
    }
  },
  {
    "id": "placement-stepped-heritage-twin-vigilantes",
    "slug": "stepped-heritage-twin-vigilantes-11",
    "title": "Twin Vigilantes: Gotham & Manhattan Heritage",
    "tagline": "11-Piece Grand Heritage with 13×19\" Monoliths",
    "description": "Monumental 11-print crossover featuring a central 5-panel stepped wave split framed by dual 13×19\" vertical monoliths of Batman and Miles Morales, with 4 A5 horizon frames.",
    "themeSlug": "dc",
    "themeName": "DC & Marvel / Crossover",
    "layoutId": "hybrid-stepped-wave-heritage-11",
    "layoutSlug": "hybrid-stepped-wave-heritage",
    "physicalPrintCount": 11,
    "coverageLabel": "125 × 59 cm",
    "accentColor": "#7C4DFF",
    "previewImageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Miles_Morales_Marvels_Spider_Man_game_character_0b07a660-89c2-4834-87e3-a122a2e93ec6.webp",
    "badge": "Grand Heritage",
    "selections": {
      "slot-swh11-arch-left": {
        "slotId": "slot-swh11-arch-left",
        "artworkId": "art-dc-05",
        "title": "Batman Standing On Gothams Highest Rooftop Duri",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Batman_standing_on_Gothams_highest_rooftop_duri_33c23a87-b982-4d38-a47f-af0c820e944e.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Batman_standing_on_Gothams_highest_rooftop_duri_33c23a87-b982-4d38-a47f-af0c820e944e.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "13x19",
        "price": 199
      },
      "slot-swh11-top-1": {
        "slotId": "slot-swh11-top-1",
        "artworkId": "art-mar-01",
        "title": "Miles Morales — Brooklyn Rooftop Leap",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Miles_Morales_Marvels_Spider_Man_game_character_0b07a660-89c2-4834-87e3-a122a2e93ec6.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Miles_Morales_Marvels_Spider_Man_game_character_0b07a660-89c2-4834-87e3-a122a2e93ec6.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A5",
        "price": 499
      },
      "slot-swh11-top-2": {
        "slotId": "slot-swh11-top-2",
        "artworkId": "art-mar-02",
        "title": "Spider-Gwen — Multiverse Skyline",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_httpss.mj.runL5ssYe0WJpg_Vertical_Spider_Gwen_9503e0a3-bbe1-4d50-a9dc-b37c52c8297b_2.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_httpss.mj.runL5ssYe0WJpg_Vertical_Spider_Gwen_9503e0a3-bbe1-4d50-a9dc-b37c52c8297b_2.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A5",
        "price": 199
      },
      "slot-swh11-split-1": {
        "slotId": "slot-swh11-split-1",
        "artworkId": "art-mar-13",
        "title": "Spider-Man vs Venom — Symbiote Duality",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_14b9a2cc-0d91-43f3-a299-36b138754a76_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_14b9a2cc-0d91-43f3-a299-36b138754a76_3.webp",
        "splitGroupId": "split-swh11-hero",
        "panelIndex": 0,
        "physicalSize": "CUSTOM",
        "price": 499
      },
      "slot-swh11-split-2": {
        "slotId": "slot-swh11-split-2",
        "artworkId": "art-mar-13",
        "title": "Spider-Man vs Venom — Symbiote Duality",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_14b9a2cc-0d91-43f3-a299-36b138754a76_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_14b9a2cc-0d91-43f3-a299-36b138754a76_3.webp",
        "splitGroupId": "split-swh11-hero",
        "panelIndex": 1,
        "physicalSize": "CUSTOM",
        "price": 499
      },
      "slot-swh11-split-3": {
        "slotId": "slot-swh11-split-3",
        "artworkId": "art-mar-13",
        "title": "Spider-Man vs Venom — Symbiote Duality",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_14b9a2cc-0d91-43f3-a299-36b138754a76_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_14b9a2cc-0d91-43f3-a299-36b138754a76_3.webp",
        "splitGroupId": "split-swh11-hero",
        "panelIndex": 2,
        "physicalSize": "CUSTOM",
        "price": 499
      },
      "slot-swh11-split-4": {
        "slotId": "slot-swh11-split-4",
        "artworkId": "art-mar-13",
        "title": "Spider-Man vs Venom — Symbiote Duality",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_14b9a2cc-0d91-43f3-a299-36b138754a76_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_14b9a2cc-0d91-43f3-a299-36b138754a76_3.webp",
        "splitGroupId": "split-swh11-hero",
        "panelIndex": 3,
        "physicalSize": "CUSTOM",
        "price": 499
      },
      "slot-swh11-split-5": {
        "slotId": "slot-swh11-split-5",
        "artworkId": "art-mar-13",
        "title": "Spider-Man vs Venom — Symbiote Duality",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_14b9a2cc-0d91-43f3-a299-36b138754a76_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_14b9a2cc-0d91-43f3-a299-36b138754a76_3.webp",
        "splitGroupId": "split-swh11-hero",
        "panelIndex": 4,
        "physicalSize": "CUSTOM",
        "price": 499
      },
      "slot-swh11-bot-1": {
        "slotId": "slot-swh11-bot-1",
        "artworkId": "art-mar-08",
        "title": "Wolverine — Berserker Rage Claws",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_httpss.mj.runsG5_2I_kgUI_Highly_detailed_vertic_9f8bc212-9164-4563-ba2e-9bc40e8dd4dc.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_httpss.mj.runsG5_2I_kgUI_Highly_detailed_vertic_9f8bc212-9164-4563-ba2e-9bc40e8dd4dc.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A5",
        "price": 199
      },
      "slot-swh11-bot-2": {
        "slotId": "slot-swh11-bot-2",
        "artworkId": "art-dc-33",
        "title": "Superman Flying Above Metropolis At Golden Sunr",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Superman_flying_above_Metropolis_at_golden_sunr_81844379-b5da-47ac-af53-0895a15853fb.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Superman_flying_above_Metropolis_at_golden_sunr_81844379-b5da-47ac-af53-0895a15853fb.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A5",
        "price": 199
      },
      "slot-swh11-arch-right": {
        "slotId": "slot-swh11-arch-right",
        "artworkId": "art-car-17",
        "title": "Cinematic Automotive Poster 1970 Dod",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Horizontal_cinematic_automotive_poster_1970_Dod_1c0fd255-a9c2-456a-b2a3-ecc95ce06d1e.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Horizontal_cinematic_automotive_poster_1970_Dod_1c0fd255-a9c2-456a-b2a3-ecc95ce06d1e.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "13x19",
        "price": 199
      }
    }
  },
  {
    "id": "placement-grid2x2-nordic-minimal",
    "slug": "grid2x2-nordic-minimal-6",
    "title": "Cosmic Horizon: Interstellar 2×2 Salon",
    "tagline": "6-Piece Deep Space Grid & Monumental Anchors",
    "description": "Sublime sci-fi design featuring a 2×2 windowpane grid split of Gargantua Event Horizon flanked by dual flagship 13×19\" deep space exploration prints.",
    "themeSlug": "interstellar",
    "themeName": "Interstellar / Deep Space",
    "layoutId": "hybrid-grid2x2-heritage-6",
    "layoutSlug": "hybrid-grid2x2-heritage",
    "physicalPrintCount": 6,
    "coverageLabel": "100 × 48 cm",
    "accentColor": "#4A90E2",
    "previewImageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/3 Split Poster.webp",
    "badge": "Curated Salon",
    "selections": {
      "slot-g2h6-arch-left": {
        "slotId": "slot-g2h6-arch-left",
        "artworkId": "art-int-02",
        "title": "Sci Fi Collec",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_httpss.mj.rungONWBax6ud8_Vertical_sci_fi_collec_ecdd35b5-819d-43bf-97a0-4108e9f2d2b1.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_httpss.mj.rungONWBax6ud8_Vertical_sci_fi_collec_ecdd35b5-819d-43bf-97a0-4108e9f2d2b1.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "13x19",
        "price": 199
      },
      "slot-g2h6-split-1": {
        "slotId": "slot-g2h6-split-1",
        "artworkId": "art-bik-01",
        "title": "Valentino Rossi VR46 — Monster Energy Yamaha MotoGP",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/3 Split Poster.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/3 Split Poster.webp",
        "splitGroupId": "split-g2h6-hero",
        "panelIndex": 0,
        "physicalSize": "A5",
        "price": 499
      },
      "slot-g2h6-split-2": {
        "slotId": "slot-g2h6-split-2",
        "artworkId": "art-bik-01",
        "title": "Valentino Rossi VR46 — Monster Energy Yamaha MotoGP",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/3 Split Poster.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/3 Split Poster.webp",
        "splitGroupId": "split-g2h6-hero",
        "panelIndex": 1,
        "physicalSize": "A5",
        "price": 499
      },
      "slot-g2h6-split-3": {
        "slotId": "slot-g2h6-split-3",
        "artworkId": "art-bik-01",
        "title": "Valentino Rossi VR46 — Monster Energy Yamaha MotoGP",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/3 Split Poster.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/3 Split Poster.webp",
        "splitGroupId": "split-g2h6-hero",
        "panelIndex": 2,
        "physicalSize": "A5",
        "price": 499
      },
      "slot-g2h6-split-4": {
        "slotId": "slot-g2h6-split-4",
        "artworkId": "art-bik-01",
        "title": "Valentino Rossi VR46 — Monster Energy Yamaha MotoGP",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/3 Split Poster.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/3 Split Poster.webp",
        "splitGroupId": "split-g2h6-hero",
        "panelIndex": 3,
        "physicalSize": "A5",
        "price": 499
      },
      "slot-g2h6-arch-right": {
        "slotId": "slot-g2h6-arch-right",
        "artworkId": "art-int-03",
        "title": "Cinematic Sci",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_httpss.mj.runkds4G4KXSeU_Vertical_cinematic_sci_bf5c658a-25f4-4757-96d8-58bf565fe1ff.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_httpss.mj.runkds4G4KXSeU_Vertical_cinematic_sci_bf5c658a-25f4-4757-96d8-58bf565fe1ff.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "13x19",
        "price": 199
      }
    }
  },
  {
    "id": "placement-grid3x2-neon-nexus",
    "slug": "grid3x2-neon-nexus-10",
    "title": "Neon Nexus: 3×2 Mosaic Grid Enclave",
    "tagline": "10-Piece Continuous Mosaic Grid with Framing A4s",
    "description": "Detailed 6-panel mosaic grid split (A6 panels) framed on all four sides by curated high-definition gaming and concept art.",
    "themeSlug": "gamers",
    "themeName": "Gamers / Concept Art",
    "layoutId": "hybrid-grid3x2-panoramic-10",
    "layoutSlug": "hybrid-grid3x2-panoramic",
    "physicalPrintCount": 10,
    "coverageLabel": "79 × 76 cm",
    "accentColor": "#FF0055",
    "previewImageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_d4b9b6a3-dbf1-444c-8c1d-6435e6a08d01_3.webp",
    "badge": "Mosaic Enclave",
    "selections": {
      "slot-g32-top-a4": {
        "slotId": "slot-g32-top-a4",
        "artworkId": "art-gam-07",
        "title": "Red Dead Western Sunset",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_65ace32d-6f76-4f1a-9dca-d07645ae382f_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_65ace32d-6f76-4f1a-9dca-d07645ae382f_3.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A4",
        "price": 199
      },
      "slot-g32-left-a4": {
        "slotId": "slot-g32-left-a4",
        "artworkId": "art-gam-01",
        "title": "Warzone Tactical Extraction",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_1182bc79-808e-4df6-a867-968d578238aa_2.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_1182bc79-808e-4df6-a867-968d578238aa_2.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A4",
        "price": 199
      },
      "slot-g32-split-1": {
        "slotId": "slot-g32-split-1",
        "artworkId": "art-gam-19",
        "title": "Simon Ghost Riley — Warzone Night Vision Grid",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_d4b9b6a3-dbf1-444c-8c1d-6435e6a08d01_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_d4b9b6a3-dbf1-444c-8c1d-6435e6a08d01_3.webp",
        "splitGroupId": "split-g32-hero",
        "panelIndex": 0,
        "physicalSize": "A6",
        "price": 499
      },
      "slot-g32-split-2": {
        "slotId": "slot-g32-split-2",
        "artworkId": "art-gam-19",
        "title": "Simon Ghost Riley — Warzone Night Vision Grid",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_d4b9b6a3-dbf1-444c-8c1d-6435e6a08d01_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_d4b9b6a3-dbf1-444c-8c1d-6435e6a08d01_3.webp",
        "splitGroupId": "split-g32-hero",
        "panelIndex": 1,
        "physicalSize": "A6",
        "price": 499
      },
      "slot-g32-split-3": {
        "slotId": "slot-g32-split-3",
        "artworkId": "art-gam-19",
        "title": "Simon Ghost Riley — Warzone Night Vision Grid",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_d4b9b6a3-dbf1-444c-8c1d-6435e6a08d01_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_d4b9b6a3-dbf1-444c-8c1d-6435e6a08d01_3.webp",
        "splitGroupId": "split-g32-hero",
        "panelIndex": 2,
        "physicalSize": "A6",
        "price": 499
      },
      "slot-g32-split-4": {
        "slotId": "slot-g32-split-4",
        "artworkId": "art-gam-19",
        "title": "Simon Ghost Riley — Warzone Night Vision Grid",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_d4b9b6a3-dbf1-444c-8c1d-6435e6a08d01_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_d4b9b6a3-dbf1-444c-8c1d-6435e6a08d01_3.webp",
        "splitGroupId": "split-g32-hero",
        "panelIndex": 3,
        "physicalSize": "A6",
        "price": 499
      },
      "slot-g32-split-5": {
        "slotId": "slot-g32-split-5",
        "artworkId": "art-gam-19",
        "title": "Simon Ghost Riley — Warzone Night Vision Grid",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_d4b9b6a3-dbf1-444c-8c1d-6435e6a08d01_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_d4b9b6a3-dbf1-444c-8c1d-6435e6a08d01_3.webp",
        "splitGroupId": "split-g32-hero",
        "panelIndex": 4,
        "physicalSize": "A6",
        "price": 499
      },
      "slot-g32-split-6": {
        "slotId": "slot-g32-split-6",
        "artworkId": "art-gam-19",
        "title": "Simon Ghost Riley — Warzone Night Vision Grid",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_d4b9b6a3-dbf1-444c-8c1d-6435e6a08d01_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_d4b9b6a3-dbf1-444c-8c1d-6435e6a08d01_3.webp",
        "splitGroupId": "split-g32-hero",
        "panelIndex": 5,
        "physicalSize": "A6",
        "price": 499
      },
      "slot-g32-right-a4": {
        "slotId": "slot-g32-right-a4",
        "artworkId": "art-gam-02",
        "title": "Cyberpunk 2077 Night City Edge",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_27e20688-82d0-458c-b807-ddfed14cde0a_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_27e20688-82d0-458c-b807-ddfed14cde0a_3.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A4",
        "price": 199
      },
      "slot-g32-bot-a4": {
        "slotId": "slot-g32-bot-a4",
        "artworkId": "art-gam-12",
        "title": "Doom Slayer Hellfire Charge",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_8cf7dc94-2969-40bf-ace4-2bd1fa2e7f3e_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_8cf7dc94-2969-40bf-ace4-2bd1fa2e7f3e_3.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A4",
        "price": 199
      }
    }
  },
  {
    "id": "placement-grid3x3-gargantua-matrix",
    "slug": "grid3x3-gargantua-matrix-11",
    "title": "Cosmic Matrix: Gargantua Event Horizon",
    "tagline": "11-Piece High-Impact 9-Panel Core with 13×19\" Guardians",
    "description": "Breathtaking 3×3 matrix grid continuous split depicting deep space and gravitational horizons, safeguarded on both wings by towering 13×19\" vertical sci-fi monuments.",
    "themeSlug": "interstellar",
    "themeName": "Cinema & Sci-Fi",
    "layoutId": "hybrid-grid3x3-matrix-11",
    "layoutSlug": "hybrid-grid3x3-matrix",
    "physicalPrintCount": 11,
    "coverageLabel": "103 × 48 cm",
    "accentColor": "#00F0FF",
    "previewImageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/3 Split Poster.webp",
    "badge": "High Impact Matrix",
    "selections": {
      "slot-g33-arch-left": {
        "slotId": "slot-g33-arch-left",
        "artworkId": "art-int-02",
        "title": "Sci Fi Collec",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_httpss.mj.rungONWBax6ud8_Vertical_sci_fi_collec_ecdd35b5-819d-43bf-97a0-4108e9f2d2b1.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_httpss.mj.rungONWBax6ud8_Vertical_sci_fi_collec_ecdd35b5-819d-43bf-97a0-4108e9f2d2b1.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "13x19",
        "price": 199
      },
      "slot-g33-split-1": {
        "slotId": "slot-g33-split-1",
        "artworkId": "art-bik-01",
        "title": "Valentino Rossi VR46 — Monster Energy Yamaha MotoGP",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/3 Split Poster.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/3 Split Poster.webp",
        "splitGroupId": "split-g33-hero",
        "panelIndex": 0,
        "physicalSize": "A6",
        "price": 499
      },
      "slot-g33-split-2": {
        "slotId": "slot-g33-split-2",
        "artworkId": "art-bik-01",
        "title": "Valentino Rossi VR46 — Monster Energy Yamaha MotoGP",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/3 Split Poster.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/3 Split Poster.webp",
        "splitGroupId": "split-g33-hero",
        "panelIndex": 1,
        "physicalSize": "A6",
        "price": 499
      },
      "slot-g33-split-3": {
        "slotId": "slot-g33-split-3",
        "artworkId": "art-bik-01",
        "title": "Valentino Rossi VR46 — Monster Energy Yamaha MotoGP",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/3 Split Poster.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/3 Split Poster.webp",
        "splitGroupId": "split-g33-hero",
        "panelIndex": 2,
        "physicalSize": "A6",
        "price": 499
      },
      "slot-g33-split-4": {
        "slotId": "slot-g33-split-4",
        "artworkId": "art-bik-01",
        "title": "Valentino Rossi VR46 — Monster Energy Yamaha MotoGP",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/3 Split Poster.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/3 Split Poster.webp",
        "splitGroupId": "split-g33-hero",
        "panelIndex": 3,
        "physicalSize": "A6",
        "price": 499
      },
      "slot-g33-split-5": {
        "slotId": "slot-g33-split-5",
        "artworkId": "art-bik-01",
        "title": "Valentino Rossi VR46 — Monster Energy Yamaha MotoGP",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/3 Split Poster.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/3 Split Poster.webp",
        "splitGroupId": "split-g33-hero",
        "panelIndex": 4,
        "physicalSize": "A6",
        "price": 499
      },
      "slot-g33-split-6": {
        "slotId": "slot-g33-split-6",
        "artworkId": "art-bik-01",
        "title": "Valentino Rossi VR46 — Monster Energy Yamaha MotoGP",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/3 Split Poster.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/3 Split Poster.webp",
        "splitGroupId": "split-g33-hero",
        "panelIndex": 5,
        "physicalSize": "A6",
        "price": 499
      },
      "slot-g33-split-7": {
        "slotId": "slot-g33-split-7",
        "artworkId": "art-bik-01",
        "title": "Valentino Rossi VR46 — Monster Energy Yamaha MotoGP",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/3 Split Poster.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/3 Split Poster.webp",
        "splitGroupId": "split-g33-hero",
        "panelIndex": 6,
        "physicalSize": "A6",
        "price": 499
      },
      "slot-g33-split-8": {
        "slotId": "slot-g33-split-8",
        "artworkId": "art-bik-01",
        "title": "Valentino Rossi VR46 — Monster Energy Yamaha MotoGP",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/3 Split Poster.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/3 Split Poster.webp",
        "splitGroupId": "split-g33-hero",
        "panelIndex": 7,
        "physicalSize": "A6",
        "price": 499
      },
      "slot-g33-split-9": {
        "slotId": "slot-g33-split-9",
        "artworkId": "art-bik-01",
        "title": "Valentino Rossi VR46 — Monster Energy Yamaha MotoGP",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/3 Split Poster.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/3 Split Poster.webp",
        "splitGroupId": "split-g33-hero",
        "panelIndex": 8,
        "physicalSize": "A6",
        "price": 499
      },
      "slot-g33-arch-right": {
        "slotId": "slot-g33-arch-right",
        "artworkId": "art-int-03",
        "title": "Cinematic Sci",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_httpss.mj.runkds4G4KXSeU_Vertical_cinematic_sci_bf5c658a-25f4-4757-96d8-58bf565fe1ff.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_httpss.mj.runkds4G4KXSeU_Vertical_cinematic_sci_bf5c658a-25f4-4757-96d8-58bf565fe1ff.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "13x19",
        "price": 199
      }
    }
  },
  {
    "id": "placement-classic3-monaco-sandwich",
    "slug": "classic3-monaco-sandwich-9",
    "title": "Monaco GP: Apex Horizon Sandwich",
    "tagline": "9-Piece Triptych with Symmetrical Companion Rows",
    "description": "Symmetrically aligned motorsport gallery featuring a central 3-panel A4 horizontal split of Circuit de Monaco, sandwiched between top and bottom rows of Formula 1 liveries.",
    "themeSlug": "f1",
    "themeName": "Formula 1 / Racing",
    "layoutId": "hybrid-classic3-horizon-sandwich-9",
    "layoutSlug": "hybrid-classic3-horizon-sandwich",
    "physicalPrintCount": 9,
    "coverageLabel": "66 × 62 cm",
    "accentColor": "#E10600",
    "previewImageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_47766b5f-d39c-4ff9-b07e-3efa6f0d92ca_3.webp",
    "badge": "Architectural Grid",
    "selections": {
      "slot-c3h9-top-1": {
        "slotId": "slot-c3h9-top-1",
        "artworkId": "art-f1-02",
        "title": "Silverstone Maggots & Becketts",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_15337296-fe72-42c3-8a2a-c2e28bda3231_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_15337296-fe72-42c3-8a2a-c2e28bda3231_3.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A5",
        "price": 199
      },
      "slot-c3h9-split-1": {
        "slotId": "slot-c3h9-split-1",
        "artworkId": "art-f1-03",
        "title": "Oscar Piastri #81 — McLaren F1 Papaya Totem",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_47766b5f-d39c-4ff9-b07e-3efa6f0d92ca_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_47766b5f-d39c-4ff9-b07e-3efa6f0d92ca_3.webp",
        "splitGroupId": "split-c3h9-hero",
        "panelIndex": 0,
        "physicalSize": "A4",
        "price": 499
      },
      "slot-c3h9-bot-1": {
        "slotId": "slot-c3h9-bot-1",
        "artworkId": "art-f1-06",
        "title": "Max Verstappen 33 — Oracle Red Bull Racing F1",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_6ab69d04-87e0-44e5-81be-be7a90302496_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_6ab69d04-87e0-44e5-81be-be7a90302496_3.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A5",
        "price": 499
      },
      "slot-c3h9-top-2": {
        "slotId": "slot-c3h9-top-2",
        "artworkId": "art-f1-07",
        "title": "Suzuka Esses Flow",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_6dab3d75-60de-4bc8-a79f-91658a3a01bb_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_6dab3d75-60de-4bc8-a79f-91658a3a01bb_3.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A5",
        "price": 199
      },
      "slot-c3h9-split-2": {
        "slotId": "slot-c3h9-split-2",
        "artworkId": "art-f1-03",
        "title": "Oscar Piastri #81 — McLaren F1 Papaya Totem",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_47766b5f-d39c-4ff9-b07e-3efa6f0d92ca_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_47766b5f-d39c-4ff9-b07e-3efa6f0d92ca_3.webp",
        "splitGroupId": "split-c3h9-hero",
        "panelIndex": 1,
        "physicalSize": "A4",
        "price": 499
      },
      "slot-c3h9-bot-2": {
        "slotId": "slot-c3h9-bot-2",
        "artworkId": "art-f1-08",
        "title": "Pitlane Sub-2s Lightning Stop",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_73bb54f7-e606-488d-8e74-213203786dfc_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_73bb54f7-e606-488d-8e74-213203786dfc_3.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A5",
        "price": 199
      },
      "slot-c3h9-top-3": {
        "slotId": "slot-c3h9-top-3",
        "artworkId": "art-f1-10",
        "title": "Monza Parabolica Velocity",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_9875c703-1af8-432e-87a9-7a65d66ea5bf_2.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_9875c703-1af8-432e-87a9-7a65d66ea5bf_2.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A5",
        "price": 199
      },
      "slot-c3h9-split-3": {
        "slotId": "slot-c3h9-split-3",
        "artworkId": "art-f1-03",
        "title": "Oscar Piastri #81 — McLaren F1 Papaya Totem",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_47766b5f-d39c-4ff9-b07e-3efa6f0d92ca_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_47766b5f-d39c-4ff9-b07e-3efa6f0d92ca_3.webp",
        "splitGroupId": "split-c3h9-hero",
        "panelIndex": 2,
        "physicalSize": "A4",
        "price": 499
      },
      "slot-c3h9-bot-3": {
        "slotId": "slot-c3h9-bot-3",
        "artworkId": "art-f1-15",
        "title": "Telemetry Steering Wheel Apex",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_f6ae585a-c982-400d-9001-60c3d6d2111c_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_f6ae585a-c982-400d-9001-60c3d6d2111c_3.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A5",
        "price": 199
      }
    }
  },
  {
    "id": "placement-classic4-hypercar-cinema",
    "slug": "classic4-hypercar-cinema-8",
    "title": "Cinema-4: Hypercar Sanctuary",
    "tagline": "8-Piece Widescreen 4-Panel Split & Dual Headers",
    "description": "Widescreen 4-panel split horizon crowned by dual horizontal A4 prints of the Porsche 911 GT3 RS and Ferrari SP3 Daytona, framed by vertical pillars.",
    "themeSlug": "cars",
    "themeName": "Supercars / Hypercars",
    "layoutId": "hybrid-classic4-cinema-8",
    "layoutSlug": "hybrid-classic4-cinema",
    "physicalPrintCount": 8,
    "coverageLabel": "109 × 48 cm",
    "accentColor": "#FFB300",
    "previewImageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_3d45351d-0d64-4e6c-91eb-a97f774dea00_2.webp",
    "badge": "Cinema Widescreen",
    "selections": {
      "slot-c4c8-top-1": {
        "slotId": "slot-c4c8-top-1",
        "artworkId": "art-car-02",
        "title": "Toyota Supra MK4 — Smoke Drift Horizon",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_3d45351d-0d64-4e6c-91eb-a97f774dea00_2.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_3d45351d-0d64-4e6c-91eb-a97f774dea00_2.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A4",
        "price": 499
      },
      "slot-c4c8-top-2": {
        "slotId": "slot-c4c8-top-2",
        "artworkId": "art-car-10",
        "title": "Trackday Precision Apex",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_bf462388-2c3a-42f7-a5a0-3736ddeebd72_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_bf462388-2c3a-42f7-a5a0-3736ddeebd72_3.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A4",
        "price": 199
      },
      "slot-c4c8-left-a4": {
        "slotId": "slot-c4c8-left-a4",
        "artworkId": "art-car-01",
        "title": "JDM Midnight Expressway",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_2949b909-0642-40a9-aea2-61d433fda437_2.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_2949b909-0642-40a9-aea2-61d433fda437_2.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A4",
        "price": 199
      },
      "slot-c4c8-split-1": {
        "slotId": "slot-c4c8-split-1",
        "artworkId": "art-car-02",
        "title": "Toyota Supra MK4 — Smoke Drift Horizon",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_3d45351d-0d64-4e6c-91eb-a97f774dea00_2.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_3d45351d-0d64-4e6c-91eb-a97f774dea00_2.webp",
        "splitGroupId": "split-c4c8-hero",
        "panelIndex": 0,
        "physicalSize": "A5",
        "price": 499
      },
      "slot-c4c8-split-2": {
        "slotId": "slot-c4c8-split-2",
        "artworkId": "art-car-02",
        "title": "Toyota Supra MK4 — Smoke Drift Horizon",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_3d45351d-0d64-4e6c-91eb-a97f774dea00_2.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_3d45351d-0d64-4e6c-91eb-a97f774dea00_2.webp",
        "splitGroupId": "split-c4c8-hero",
        "panelIndex": 1,
        "physicalSize": "A5",
        "price": 499
      },
      "slot-c4c8-split-3": {
        "slotId": "slot-c4c8-split-3",
        "artworkId": "art-car-02",
        "title": "Toyota Supra MK4 — Smoke Drift Horizon",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_3d45351d-0d64-4e6c-91eb-a97f774dea00_2.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_3d45351d-0d64-4e6c-91eb-a97f774dea00_2.webp",
        "splitGroupId": "split-c4c8-hero",
        "panelIndex": 2,
        "physicalSize": "A5",
        "price": 499
      },
      "slot-c4c8-split-4": {
        "slotId": "slot-c4c8-split-4",
        "artworkId": "art-car-02",
        "title": "Toyota Supra MK4 — Smoke Drift Horizon",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_3d45351d-0d64-4e6c-91eb-a97f774dea00_2.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_3d45351d-0d64-4e6c-91eb-a97f774dea00_2.webp",
        "splitGroupId": "split-c4c8-hero",
        "panelIndex": 3,
        "physicalSize": "A5",
        "price": 499
      },
      "slot-c4c8-right-a4": {
        "slotId": "slot-c4c8-right-a4",
        "artworkId": "art-car-03",
        "title": "Supercar Twin-Turbo Launch",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_4167ceb2-24b6-48a1-bdf9-b808b32589b4_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_4167ceb2-24b6-48a1-bdf9-b808b32589b4_3.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A4",
        "price": 199
      }
    }
  },
  {
    "id": "placement-classic5-marvel-infinity",
    "slug": "classic5-marvel-infinity-9",
    "title": "Marvel Infinity: Grand 5-Panel Ultrawide",
    "tagline": "9-Piece Grand Ultrawide with 13×19\" Monuments & A3 Headers",
    "description": "Our most expansive Marvel arrangement. A continuous 5-panel split artwork flanked by 13×19\" vertical monoliths of Iron Man and Captain America, crowned by dual A3 horizontal prints.",
    "themeSlug": "marvel",
    "themeName": "Marvel / Infinity Saga",
    "layoutId": "hybrid-classic5-grand-panorama-9",
    "layoutSlug": "hybrid-classic5-grand-panorama",
    "physicalPrintCount": 9,
    "coverageLabel": "155 × 52 cm",
    "accentColor": "#E62429",
    "previewImageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Miles_Morales_Marvels_Spider_Man_game_character_0b07a660-89c2-4834-87e3-a122a2e93ec6.webp",
    "badge": "Epic Ultrawide",
    "selections": {
      "slot-c5g9-arch-left": {
        "slotId": "slot-c5g9-arch-left",
        "artworkId": "art-mar-03",
        "title": "Black Panther — Wakanda Forever Sovereign",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_httpss.mj.runY21KNpPYf1M_Vertical_cinematic_Bla_c3240574-5285-456b-8261-2908e554887f.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_httpss.mj.runY21KNpPYf1M_Vertical_cinematic_Bla_c3240574-5285-456b-8261-2908e554887f.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "13x19",
        "price": 199
      },
      "slot-c5g9-top-1": {
        "slotId": "slot-c5g9-top-1",
        "artworkId": "art-mar-01",
        "title": "Miles Morales — Brooklyn Rooftop Leap",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Miles_Morales_Marvels_Spider_Man_game_character_0b07a660-89c2-4834-87e3-a122a2e93ec6.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Miles_Morales_Marvels_Spider_Man_game_character_0b07a660-89c2-4834-87e3-a122a2e93ec6.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A3",
        "price": 499
      },
      "slot-c5g9-top-2": {
        "slotId": "slot-c5g9-top-2",
        "artworkId": "art-mar-02",
        "title": "Spider-Gwen — Multiverse Skyline",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_httpss.mj.runL5ssYe0WJpg_Vertical_Spider_Gwen_9503e0a3-bbe1-4d50-a9dc-b37c52c8297b_2.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_httpss.mj.runL5ssYe0WJpg_Vertical_Spider_Gwen_9503e0a3-bbe1-4d50-a9dc-b37c52c8297b_2.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A3",
        "price": 199
      },
      "slot-c5g9-split-1": {
        "slotId": "slot-c5g9-split-1",
        "artworkId": "art-mar-01",
        "title": "Miles Morales — Brooklyn Rooftop Leap",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Miles_Morales_Marvels_Spider_Man_game_character_0b07a660-89c2-4834-87e3-a122a2e93ec6.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Miles_Morales_Marvels_Spider_Man_game_character_0b07a660-89c2-4834-87e3-a122a2e93ec6.webp",
        "splitGroupId": "split-c5g9-hero",
        "panelIndex": 0,
        "physicalSize": "A5",
        "price": 499
      },
      "slot-c5g9-split-2": {
        "slotId": "slot-c5g9-split-2",
        "artworkId": "art-mar-01",
        "title": "Miles Morales — Brooklyn Rooftop Leap",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Miles_Morales_Marvels_Spider_Man_game_character_0b07a660-89c2-4834-87e3-a122a2e93ec6.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Miles_Morales_Marvels_Spider_Man_game_character_0b07a660-89c2-4834-87e3-a122a2e93ec6.webp",
        "splitGroupId": "split-c5g9-hero",
        "panelIndex": 1,
        "physicalSize": "A5",
        "price": 499
      },
      "slot-c5g9-split-3": {
        "slotId": "slot-c5g9-split-3",
        "artworkId": "art-mar-01",
        "title": "Miles Morales — Brooklyn Rooftop Leap",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Miles_Morales_Marvels_Spider_Man_game_character_0b07a660-89c2-4834-87e3-a122a2e93ec6.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Miles_Morales_Marvels_Spider_Man_game_character_0b07a660-89c2-4834-87e3-a122a2e93ec6.webp",
        "splitGroupId": "split-c5g9-hero",
        "panelIndex": 2,
        "physicalSize": "A5",
        "price": 499
      },
      "slot-c5g9-split-4": {
        "slotId": "slot-c5g9-split-4",
        "artworkId": "art-mar-01",
        "title": "Miles Morales — Brooklyn Rooftop Leap",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Miles_Morales_Marvels_Spider_Man_game_character_0b07a660-89c2-4834-87e3-a122a2e93ec6.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Miles_Morales_Marvels_Spider_Man_game_character_0b07a660-89c2-4834-87e3-a122a2e93ec6.webp",
        "splitGroupId": "split-c5g9-hero",
        "panelIndex": 3,
        "physicalSize": "A5",
        "price": 499
      },
      "slot-c5g9-split-5": {
        "slotId": "slot-c5g9-split-5",
        "artworkId": "art-mar-01",
        "title": "Miles Morales — Brooklyn Rooftop Leap",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Miles_Morales_Marvels_Spider_Man_game_character_0b07a660-89c2-4834-87e3-a122a2e93ec6.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Miles_Morales_Marvels_Spider_Man_game_character_0b07a660-89c2-4834-87e3-a122a2e93ec6.webp",
        "splitGroupId": "split-c5g9-hero",
        "panelIndex": 4,
        "physicalSize": "A5",
        "price": 499
      },
      "slot-c5g9-arch-right": {
        "slotId": "slot-c5g9-arch-right",
        "artworkId": "art-mar-04",
        "title": "Doctor Doom Latverian Monarch",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_01b218b8-b37f-4427-b7ba-6873d3abeef4_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_01b218b8-b37f-4427-b7ba-6873d3abeef4_3.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "13x19",
        "price": 199
      }
    }
  },
  {
    "id": "placement-vertical3-titan-spire",
    "slug": "vertical3-titan-spire-7",
    "title": "Shonen Spire: Titan Column Totem",
    "tagline": "7-Piece 3-Tier Vertical Split with Dual Flanks",
    "description": "Dramatic vertical column composed of a 3-tier stacked split totem, framed symmetrically by 4 vertical A4 portraits of iconic anime heroes.",
    "themeSlug": "anime",
    "themeName": "Anime / Shonen Heroes",
    "layoutId": "hybrid-vertical3-totem-flank-7",
    "layoutSlug": "hybrid-vertical3-totem-flank",
    "physicalPrintCount": 7,
    "coverageLabel": "75 × 66 cm",
    "accentColor": "#FF5722",
    "previewImageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_19f3439c-b06b-4e11-8fa1-b4ccaa5eb1eb_3.webp",
    "badge": "Vertical Totem",
    "selections": {
      "slot-v3t7-left-top": {
        "slotId": "slot-v3t7-left-top",
        "artworkId": "art-ani-01",
        "title": "Shonen Spirit Awakening",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_03066147-eeb0-4085-83b7-a5a30c6e4f2a_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_03066147-eeb0-4085-83b7-a5a30c6e4f2a_3.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A4",
        "price": 199
      },
      "slot-v3t7-left-bot": {
        "slotId": "slot-v3t7-left-bot",
        "artworkId": "art-ani-03",
        "title": "Tokyo Neon Ronin",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_1a2b6fba-c7bf-4c5d-a62d-1b055f0eaf21_2.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_1a2b6fba-c7bf-4c5d-a62d-1b055f0eaf21_2.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A4",
        "price": 199
      },
      "slot-v3t7-split-1": {
        "slotId": "slot-v3t7-split-1",
        "artworkId": "art-ani-02",
        "title": "Zenitsu Agatsuma — Thunder Flash Grid",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_19f3439c-b06b-4e11-8fa1-b4ccaa5eb1eb_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_19f3439c-b06b-4e11-8fa1-b4ccaa5eb1eb_3.webp",
        "splitGroupId": "split-v3t7-hero",
        "panelIndex": 0,
        "physicalSize": "A4",
        "price": 499
      },
      "slot-v3t7-split-2": {
        "slotId": "slot-v3t7-split-2",
        "artworkId": "art-ani-02",
        "title": "Zenitsu Agatsuma — Thunder Flash Grid",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_19f3439c-b06b-4e11-8fa1-b4ccaa5eb1eb_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_19f3439c-b06b-4e11-8fa1-b4ccaa5eb1eb_3.webp",
        "splitGroupId": "split-v3t7-hero",
        "panelIndex": 1,
        "physicalSize": "A4",
        "price": 499
      },
      "slot-v3t7-split-3": {
        "slotId": "slot-v3t7-split-3",
        "artworkId": "art-ani-02",
        "title": "Zenitsu Agatsuma — Thunder Flash Grid",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_19f3439c-b06b-4e11-8fa1-b4ccaa5eb1eb_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_19f3439c-b06b-4e11-8fa1-b4ccaa5eb1eb_3.webp",
        "splitGroupId": "split-v3t7-hero",
        "panelIndex": 2,
        "physicalSize": "A4",
        "price": 499
      },
      "slot-v3t7-right-top": {
        "slotId": "slot-v3t7-right-top",
        "artworkId": "art-ani-08",
        "title": "Super Saiyan Limit Break",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_74f62b39-2e77-4d7d-9136-00aa22d607ca_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_74f62b39-2e77-4d7d-9136-00aa22d607ca_3.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A4",
        "price": 199
      },
      "slot-v3t7-right-bot": {
        "slotId": "slot-v3t7-right-bot",
        "artworkId": "art-ani-11",
        "title": "Infinite Domain Sorcery",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_b9fbe9fa-d0b1-4847-be06-0c88b6ac01cf_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_b9fbe9fa-d0b1-4847-be06-0c88b6ac01cf_3.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A4",
        "price": 199
      }
    }
  },
  {
    "id": "placement-vertical4-megabuilding-monolith",
    "slug": "vertical4-megabuilding-monolith-8",
    "title": "Night City: Megabuilding Monolith",
    "tagline": "8-Piece 4-Tier Vertical Spire with Flanking Columns",
    "description": "Futuristic gaming composition featuring a 4-tier stacked horizontal continuous split framed by vertical A4 portraits of cybernetic legends.",
    "themeSlug": "gamers",
    "themeName": "Cyberpunk & Gamers",
    "layoutId": "hybrid-vertical4-monolith-8",
    "layoutSlug": "hybrid-vertical4-monolith",
    "physicalPrintCount": 8,
    "coverageLabel": "66 × 64 cm",
    "accentColor": "#00E676",
    "previewImageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_d4b9b6a3-dbf1-444c-8c1d-6435e6a08d01_3.webp",
    "badge": "Vertical Monolith",
    "selections": {
      "slot-v4m8-left-top": {
        "slotId": "slot-v4m8-left-top",
        "artworkId": "art-gam-01",
        "title": "Warzone Tactical Extraction",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_1182bc79-808e-4df6-a867-968d578238aa_2.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_1182bc79-808e-4df6-a867-968d578238aa_2.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A4",
        "price": 199
      },
      "slot-v4m8-left-bot": {
        "slotId": "slot-v4m8-left-bot",
        "artworkId": "art-gam-02",
        "title": "Cyberpunk 2077 Night City Edge",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_27e20688-82d0-458c-b807-ddfed14cde0a_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_27e20688-82d0-458c-b807-ddfed14cde0a_3.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A4",
        "price": 199
      },
      "slot-v4m8-split-1": {
        "slotId": "slot-v4m8-split-1",
        "artworkId": "art-gam-19",
        "title": "Simon Ghost Riley — Warzone Night Vision Grid",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_d4b9b6a3-dbf1-444c-8c1d-6435e6a08d01_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_d4b9b6a3-dbf1-444c-8c1d-6435e6a08d01_3.webp",
        "splitGroupId": "split-v4m8-hero",
        "panelIndex": 0,
        "physicalSize": "A5",
        "price": 499
      },
      "slot-v4m8-split-2": {
        "slotId": "slot-v4m8-split-2",
        "artworkId": "art-gam-19",
        "title": "Simon Ghost Riley — Warzone Night Vision Grid",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_d4b9b6a3-dbf1-444c-8c1d-6435e6a08d01_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_d4b9b6a3-dbf1-444c-8c1d-6435e6a08d01_3.webp",
        "splitGroupId": "split-v4m8-hero",
        "panelIndex": 1,
        "physicalSize": "A5",
        "price": 499
      },
      "slot-v4m8-split-3": {
        "slotId": "slot-v4m8-split-3",
        "artworkId": "art-gam-19",
        "title": "Simon Ghost Riley — Warzone Night Vision Grid",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_d4b9b6a3-dbf1-444c-8c1d-6435e6a08d01_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_d4b9b6a3-dbf1-444c-8c1d-6435e6a08d01_3.webp",
        "splitGroupId": "split-v4m8-hero",
        "panelIndex": 2,
        "physicalSize": "A5",
        "price": 499
      },
      "slot-v4m8-split-4": {
        "slotId": "slot-v4m8-split-4",
        "artworkId": "art-gam-19",
        "title": "Simon Ghost Riley — Warzone Night Vision Grid",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_d4b9b6a3-dbf1-444c-8c1d-6435e6a08d01_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_d4b9b6a3-dbf1-444c-8c1d-6435e6a08d01_3.webp",
        "splitGroupId": "split-v4m8-hero",
        "panelIndex": 3,
        "physicalSize": "A5",
        "price": 499
      },
      "slot-v4m8-right-top": {
        "slotId": "slot-v4m8-right-top",
        "artworkId": "art-gam-03",
        "title": "Elden Ring Erdtree Radiance",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_2f924c16-836d-4729-bd75-ea2f9a585a99_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_2f924c16-836d-4729-bd75-ea2f9a585a99_3.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A4",
        "price": 199
      },
      "slot-v4m8-right-bot": {
        "slotId": "slot-v4m8-right-bot",
        "artworkId": "art-gam-04",
        "title": "The Witcher White Wolf Trail",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_59946b89-9551-40ba-95de-daa715acb06e_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_59946b89-9551-40ba-95de-daa715acb06e_3.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A4",
        "price": 199
      }
    }
  },
  {
    "id": "placement-stepped-gotham-salon-enclave",
    "slug": "stepped-gotham-salon-enclave-9",
    "title": "Gotham Noir: Full Salon Enclave",
    "tagline": "9-Piece Stepped Triptych with 4-Way Symmetrical Enclosure",
    "description": "Masterwork salon arrangement enclosing a central 3-panel stepped split with dual vertical A5 wings and horizontal A4 header/footer anchors.",
    "themeSlug": "dc",
    "themeName": "DC / Gotham Universe",
    "layoutId": "hybrid-stepped-triptych-quadwing-9",
    "layoutSlug": "hybrid-stepped-triptych-quadwing",
    "physicalPrintCount": 9,
    "coverageLabel": "81 × 73 cm",
    "accentColor": "#2979FF",
    "previewImageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_9776c4f2-ec7d-46df-b71b-7b83937385ca_3.webp",
    "badge": "Salon Enclave",
    "selections": {
      "slot-stq9-left-top": {
        "slotId": "slot-stq9-left-top",
        "artworkId": "art-dc-01",
        "title": "Aquaman Arthur Curry Standing On An Ancient Und",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Aquaman_Arthur_Curry_standing_on_an_ancient_und_9702bef8-0b0a-43d5-92d4-7d33104ca1da.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Aquaman_Arthur_Curry_standing_on_an_ancient_und_9702bef8-0b0a-43d5-92d4-7d33104ca1da.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A5",
        "price": 199
      },
      "slot-stq9-left-bot": {
        "slotId": "slot-stq9-left-bot",
        "artworkId": "art-dc-02",
        "title": "Aquaman Arthur Curry Standing On An Ancient Und",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Aquaman_Arthur_Curry_standing_on_an_ancient_und_a69eed75-a95e-4a29-be79-03515df2078f.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Aquaman_Arthur_Curry_standing_on_an_ancient_und_a69eed75-a95e-4a29-be79-03515df2078f.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A5",
        "price": 199
      },
      "slot-stq9-top-a4": {
        "slotId": "slot-stq9-top-a4",
        "artworkId": "art-dc-03",
        "title": "Aquaman Arthur Curry Standing On Ruins Of An En",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Aquaman_Arthur_Curry_standing_on_ruins_of_an_en_f4267bbd-1130-4a7f-89e3-34c8f9ff7cbd.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Aquaman_Arthur_Curry_standing_on_ruins_of_an_en_f4267bbd-1130-4a7f-89e3-34c8f9ff7cbd.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A4",
        "price": 199
      },
      "slot-stq9-split-1": {
        "slotId": "slot-stq9-split-1",
        "artworkId": "art-dc-12",
        "title": "The Batman — Gotham Rain Nocturne Totem",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_9776c4f2-ec7d-46df-b71b-7b83937385ca_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_9776c4f2-ec7d-46df-b71b-7b83937385ca_3.webp",
        "splitGroupId": "split-stq9-hero",
        "panelIndex": 0,
        "physicalSize": "CUSTOM",
        "price": 499
      },
      "slot-stq9-split-2": {
        "slotId": "slot-stq9-split-2",
        "artworkId": "art-dc-12",
        "title": "The Batman — Gotham Rain Nocturne Totem",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_9776c4f2-ec7d-46df-b71b-7b83937385ca_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_9776c4f2-ec7d-46df-b71b-7b83937385ca_3.webp",
        "splitGroupId": "split-stq9-hero",
        "panelIndex": 1,
        "physicalSize": "CUSTOM",
        "price": 499
      },
      "slot-stq9-split-3": {
        "slotId": "slot-stq9-split-3",
        "artworkId": "art-dc-12",
        "title": "The Batman — Gotham Rain Nocturne Totem",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_9776c4f2-ec7d-46df-b71b-7b83937385ca_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_9776c4f2-ec7d-46df-b71b-7b83937385ca_3.webp",
        "splitGroupId": "split-stq9-hero",
        "panelIndex": 2,
        "physicalSize": "CUSTOM",
        "price": 499
      },
      "slot-stq9-bot-a4": {
        "slotId": "slot-stq9-bot-a4",
        "artworkId": "art-dc-05",
        "title": "Batman Standing On Gothams Highest Rooftop Duri",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Batman_standing_on_Gothams_highest_rooftop_duri_33c23a87-b982-4d38-a47f-af0c820e944e.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Batman_standing_on_Gothams_highest_rooftop_duri_33c23a87-b982-4d38-a47f-af0c820e944e.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A4",
        "price": 199
      },
      "slot-stq9-right-top": {
        "slotId": "slot-stq9-right-top",
        "artworkId": "art-dc-04",
        "title": "Batman Standing Alone On A Rain Soaked Gothic R",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Batman_standing_alone_on_a_rain_soaked_gothic_r_c46d574d-e4ce-4dea-abdd-eb59f01017eb.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Batman_standing_alone_on_a_rain_soaked_gothic_r_c46d574d-e4ce-4dea-abdd-eb59f01017eb.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A5",
        "price": 199
      },
      "slot-stq9-right-bot": {
        "slotId": "slot-stq9-right-bot",
        "artworkId": "art-dc-07",
        "title": "Collector Poster Of Dc Batman Standing On A Sle",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Collector_poster_of_DC_Batman_standing_on_a_sle_e0d863b9-e3e4-42e3-a0f8-70893deb0d7e.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Collector_poster_of_DC_Batman_standing_on_a_sle_e0d863b9-e3e4-42e3-a0f8-70893deb0d7e.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A5",
        "price": 199
      }
    }
  },
  {
    "id": "placement-grid2x2-zen-windowpane",
    "slug": "grid2x2-zen-windowpane-8",
    "title": "MotoGP Apex: 2×2 Windowpane Salon",
    "tagline": "8-Piece Landscape Grid Enclosed by Symmetrical Frames",
    "description": "High-adrenaline 2×2 landscape grid split enclosed on all four cardinal directions by MotoGP and superbike gallery frames.",
    "themeSlug": "bikes",
    "themeName": "MotoGP & Superbikes",
    "layoutId": "hybrid-grid2x2-windowpane-8",
    "layoutSlug": "hybrid-grid2x2-windowpane",
    "physicalPrintCount": 8,
    "coverageLabel": "89 × 76 cm",
    "accentColor": "#F0FF00",
    "previewImageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/3 Split Poster.webp",
    "badge": "Surrounded Salon",
    "selections": {
      "slot-g2w8-top-a4": {
        "slotId": "slot-g2w8-top-a4",
        "artworkId": "art-bik-01",
        "title": "Valentino Rossi VR46 — Monster Energy Yamaha MotoGP",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/3 Split Poster.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/3 Split Poster.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A4",
        "price": 499
      },
      "slot-g2w8-left-a4": {
        "slotId": "slot-g2w8-left-a4",
        "artworkId": "art-bik-02",
        "title": "Apex Lean Superbike",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_020f3c8d-2ab8-4204-9f8b-892b2d4e6a86_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_020f3c8d-2ab8-4204-9f8b-892b2d4e6a86_3.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A4",
        "price": 199
      },
      "slot-g2w8-split-1": {
        "slotId": "slot-g2w8-split-1",
        "artworkId": "art-bik-01",
        "title": "Valentino Rossi VR46 — Monster Energy Yamaha MotoGP",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/3 Split Poster.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/3 Split Poster.webp",
        "splitGroupId": "split-g2w8-hero",
        "panelIndex": 0,
        "physicalSize": "A5",
        "price": 499
      },
      "slot-g2w8-split-2": {
        "slotId": "slot-g2w8-split-2",
        "artworkId": "art-bik-01",
        "title": "Valentino Rossi VR46 — Monster Energy Yamaha MotoGP",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/3 Split Poster.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/3 Split Poster.webp",
        "splitGroupId": "split-g2w8-hero",
        "panelIndex": 1,
        "physicalSize": "A5",
        "price": 499
      },
      "slot-g2w8-split-3": {
        "slotId": "slot-g2w8-split-3",
        "artworkId": "art-bik-01",
        "title": "Valentino Rossi VR46 — Monster Energy Yamaha MotoGP",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/3 Split Poster.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/3 Split Poster.webp",
        "splitGroupId": "split-g2w8-hero",
        "panelIndex": 2,
        "physicalSize": "A5",
        "price": 499
      },
      "slot-g2w8-split-4": {
        "slotId": "slot-g2w8-split-4",
        "artworkId": "art-bik-01",
        "title": "Valentino Rossi VR46 — Monster Energy Yamaha MotoGP",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/3 Split Poster.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/3 Split Poster.webp",
        "splitGroupId": "split-g2w8-hero",
        "panelIndex": 3,
        "physicalSize": "A5",
        "price": 499
      },
      "slot-g2w8-right-a4": {
        "slotId": "slot-g2w8-right-a4",
        "artworkId": "art-bik-03",
        "title": "Trackside Apex Symphony",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_2a518b7d-4223-48a5-9663-50e24b345a5c_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_2a518b7d-4223-48a5-9663-50e24b345a5c_3.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A4",
        "price": 199
      },
      "slot-g2w8-bot-a4": {
        "slotId": "slot-g2w8-bot-a4",
        "artworkId": "art-bik-04",
        "title": "Superleggera Crimson Fury",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_3787a4ce-29dc-4929-bb6d-f228feac30b2_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_3787a4ce-29dc-4929-bb6d-f228feac30b2_3.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A4",
        "price": 199
      }
    }
  },
  {
    "id": "placement-classic3-silverstone-triptych",
    "slug": "classic3-silverstone-triptych-7",
    "title": "Silverstone Grand Prix: Copse Apex Triptych",
    "tagline": "7-Piece Large-Format A3 Triptych with Vertical A5 Wings",
    "description": "Commanding A3 triptych split artwork capturing full-speed racing dynamics, balanced on both flanks by curated vertical A5 team emblems.",
    "themeSlug": "f1",
    "themeName": "Formula 1 / Grand Prix",
    "layoutId": "hybrid-classic3-cinema-a3-7",
    "layoutSlug": "hybrid-classic3-cinema-a3",
    "physicalPrintCount": 7,
    "coverageLabel": "125 × 44 cm",
    "accentColor": "#FF1744",
    "previewImageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_47766b5f-d39c-4ff9-b07e-3efa6f0d92ca_3.webp",
    "badge": "Grand Triptych",
    "selections": {
      "slot-c3a7-left-top": {
        "slotId": "slot-c3a7-left-top",
        "artworkId": "art-f1-01",
        "title": "Monaco Swimming Pool Apex",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_050f5402-2073-42ee-929e-02d5f990344c_2.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_050f5402-2073-42ee-929e-02d5f990344c_2.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A5",
        "price": 199
      },
      "slot-c3a7-left-bot": {
        "slotId": "slot-c3a7-left-bot",
        "artworkId": "art-f1-03",
        "title": "Oscar Piastri #81 — McLaren F1 Papaya Totem",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_47766b5f-d39c-4ff9-b07e-3efa6f0d92ca_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_47766b5f-d39c-4ff9-b07e-3efa6f0d92ca_3.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A5",
        "price": 499
      },
      "slot-c3a7-split-1": {
        "slotId": "slot-c3a7-split-1",
        "artworkId": "art-f1-03",
        "title": "Oscar Piastri #81 — McLaren F1 Papaya Totem",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_47766b5f-d39c-4ff9-b07e-3efa6f0d92ca_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_47766b5f-d39c-4ff9-b07e-3efa6f0d92ca_3.webp",
        "splitGroupId": "split-c3a7-hero",
        "panelIndex": 0,
        "physicalSize": "A3",
        "price": 499
      },
      "slot-c3a7-split-2": {
        "slotId": "slot-c3a7-split-2",
        "artworkId": "art-f1-03",
        "title": "Oscar Piastri #81 — McLaren F1 Papaya Totem",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_47766b5f-d39c-4ff9-b07e-3efa6f0d92ca_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_47766b5f-d39c-4ff9-b07e-3efa6f0d92ca_3.webp",
        "splitGroupId": "split-c3a7-hero",
        "panelIndex": 1,
        "physicalSize": "A3",
        "price": 499
      },
      "slot-c3a7-split-3": {
        "slotId": "slot-c3a7-split-3",
        "artworkId": "art-f1-03",
        "title": "Oscar Piastri #81 — McLaren F1 Papaya Totem",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_47766b5f-d39c-4ff9-b07e-3efa6f0d92ca_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_47766b5f-d39c-4ff9-b07e-3efa6f0d92ca_3.webp",
        "splitGroupId": "split-c3a7-hero",
        "panelIndex": 2,
        "physicalSize": "A3",
        "price": 499
      },
      "slot-c3a7-right-top": {
        "slotId": "slot-c3a7-right-top",
        "artworkId": "art-f1-04",
        "title": "Spa-Francorchamps Eau Rouge Crest",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_4dc25727-e30d-4877-ae03-87dffc57ee9d_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_4dc25727-e30d-4877-ae03-87dffc57ee9d_3.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A5",
        "price": 199
      },
      "slot-c3a7-right-bot": {
        "slotId": "slot-c3a7-right-bot",
        "artworkId": "art-f1-05",
        "title": "Formula 1 Monolith — Studio Apex Architecture",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_554cf690-7426-4f50-bffe-662919a384d4_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_554cf690-7426-4f50-bffe-662919a384d4_3.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A5",
        "price": 499
      }
    }
  },
  {
    "id": "placement-vertical5-neotokyo-spire",
    "slug": "vertical5-neotokyo-spire-11",
    "title": "Peaky Blinders & Crime Noir: 5-Tier Spire",
    "tagline": "11-Piece High-Rise Spire with Peaky Blinders & Crime Drama",
    "description": "Architectural vertical statement wall featuring Thomas Shelby and Peaky Blinders crime noir prints framed by towering portrait gallery columns.",
    "themeSlug": "netflix-series",
    "themeName": "Peaky Blinders & Crime Drama",
    "layoutId": "hybrid-vertical5-spire-11",
    "layoutSlug": "hybrid-vertical5-spire",
    "physicalPrintCount": 11,
    "coverageLabel": "47 × 57 cm",
    "accentColor": "#E50914",
    "previewImageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_5ae2ffe7-a3ae-4656-9452-3dd6b7a7347a_3.webp",
    "badge": "High-Rise Spire",
    "selections": {
      "slot-v5s11-left-1": {
        "slotId": "slot-v5s11-left-1",
        "artworkId": "art-net-02",
        "title": "Thomas Shelby Birmingham Smoke",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_859b57d4-c721-4960-afde-7abdfc446640_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_859b57d4-c721-4960-afde-7abdfc446640_3.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A5",
        "price": 199
      },
      "slot-v5s11-left-2": {
        "slotId": "slot-v5s11-left-2",
        "artworkId": "art-net-03",
        "title": "Stranger Things Hawkins Retro Bicycle",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_9b32ff14-f7da-483a-8e03-4d87eda118c2_2.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_9b32ff14-f7da-483a-8e03-4d87eda118c2_2.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A5",
        "price": 199
      },
      "slot-v5s11-left-3": {
        "slotId": "slot-v5s11-left-3",
        "artworkId": "art-net-01",
        "title": "Tommy Shelby — Birmingham Shadows Grid",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_5ae2ffe7-a3ae-4656-9452-3dd6b7a7347a_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_5ae2ffe7-a3ae-4656-9452-3dd6b7a7347a_3.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A6",
        "price": 499
      },
      "slot-v5s11-split-1": {
        "slotId": "slot-v5s11-split-1",
        "artworkId": "art-net-01",
        "title": "Tommy Shelby — Birmingham Shadows Grid",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_5ae2ffe7-a3ae-4656-9452-3dd6b7a7347a_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_5ae2ffe7-a3ae-4656-9452-3dd6b7a7347a_3.webp",
        "splitGroupId": "split-v5s11-hero",
        "panelIndex": 0,
        "physicalSize": "A6",
        "price": 499
      },
      "slot-v5s11-split-2": {
        "slotId": "slot-v5s11-split-2",
        "artworkId": "art-net-01",
        "title": "Tommy Shelby — Birmingham Shadows Grid",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_5ae2ffe7-a3ae-4656-9452-3dd6b7a7347a_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_5ae2ffe7-a3ae-4656-9452-3dd6b7a7347a_3.webp",
        "splitGroupId": "split-v5s11-hero",
        "panelIndex": 1,
        "physicalSize": "A6",
        "price": 499
      },
      "slot-v5s11-split-3": {
        "slotId": "slot-v5s11-split-3",
        "artworkId": "art-net-01",
        "title": "Tommy Shelby — Birmingham Shadows Grid",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_5ae2ffe7-a3ae-4656-9452-3dd6b7a7347a_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_5ae2ffe7-a3ae-4656-9452-3dd6b7a7347a_3.webp",
        "splitGroupId": "split-v5s11-hero",
        "panelIndex": 2,
        "physicalSize": "A6",
        "price": 499
      },
      "slot-v5s11-split-4": {
        "slotId": "slot-v5s11-split-4",
        "artworkId": "art-net-01",
        "title": "Tommy Shelby — Birmingham Shadows Grid",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_5ae2ffe7-a3ae-4656-9452-3dd6b7a7347a_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_5ae2ffe7-a3ae-4656-9452-3dd6b7a7347a_3.webp",
        "splitGroupId": "split-v5s11-hero",
        "panelIndex": 3,
        "physicalSize": "A6",
        "price": 499
      },
      "slot-v5s11-split-5": {
        "slotId": "slot-v5s11-split-5",
        "artworkId": "art-net-01",
        "title": "Tommy Shelby — Birmingham Shadows Grid",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_5ae2ffe7-a3ae-4656-9452-3dd6b7a7347a_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_5ae2ffe7-a3ae-4656-9452-3dd6b7a7347a_3.webp",
        "splitGroupId": "split-v5s11-hero",
        "panelIndex": 4,
        "physicalSize": "A6",
        "price": 499
      },
      "slot-v5s11-right-1": {
        "slotId": "slot-v5s11-right-1",
        "artworkId": "art-net-04",
        "title": "Thomas Shelby — Peaky Blinders Crimson Noir",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_c500f4a2-3ca8-471c-86fb-5b78ea8ecc81_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_c500f4a2-3ca8-471c-86fb-5b78ea8ecc81_3.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A5",
        "price": 499
      },
      "slot-v5s11-right-2": {
        "slotId": "slot-v5s11-right-2",
        "artworkId": "art-net-05",
        "title": "Tommy Shelby — Crimson Cigarette Smoke",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_f6d2b7b4-1da2-42d1-bac5-2995e6d9dfed_3.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_f6d2b7b4-1da2-42d1-bac5-2995e6d9dfed_3.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A5",
        "price": 499
      },
      "slot-v5s11-right-3": {
        "slotId": "slot-v5s11-right-3",
        "artworkId": "art-net-06",
        "title": "Squid Game Red Light Green Light",
        "imageUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_httpss.mj.runhN8HHckwMtM_Horizontal_widescreen__46343113-95ae-4e1d-b187-ef145ae189f7.webp",
        "thumbnailUrl": "https://pub-911817f7f441483a9ef72eecab9dbf49.r2.dev/posters/Fregoro_Studios_httpss.mj.runhN8HHckwMtM_Horizontal_widescreen__46343113-95ae-4e1d-b187-ef145ae189f7.webp",
        "splitGroupId": null,
        "panelIndex": null,
        "physicalSize": "A6",
        "price": 499
      }
    }
  }
];

export function getDesignPlacementById(id: string): DesignPlacement | undefined {
  return FREGORO_DESIGN_PLACEMENTS.find((p) => p.id === id || p.slug === id);
}

export function getPlacementsByLayout(layoutId: string): DesignPlacement[] {
  return FREGORO_DESIGN_PLACEMENTS.filter((p) => p.layoutId === layoutId);
}

export function getPlacementsByTheme(themeSlug: string): DesignPlacement[] {
  if (!themeSlug || themeSlug === 'all') return FREGORO_DESIGN_PLACEMENTS;
  return FREGORO_DESIGN_PLACEMENTS.filter((p) => p.themeSlug === themeSlug);
}
