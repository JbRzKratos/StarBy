import fs from 'fs';
import path from 'path';
import type {
  ClothingDesignEntry,
  ClothingDesignManifest,
  DesignArtworkOption,
  DesignPlacementTarget,
} from '../lib/clothing-designs/types';

const SOURCE_DIR = path.resolve(process.cwd(), 'public', 't_shirt_designs');
const OUTPUT_FILE = path.resolve(process.cwd(), 'lib', 'clothing-designs', 'design-manifest.json');

// Visual classification dictionary for all 96 designs
const DESIGN_METADATA: Record<number, {
  name: string;
  themeCategory: string;
  tags: string[];
  description: string;
}> = {
  1: {
    name: 'Ben 10: Omnitrix Evolution',
    themeCategory: 'marvel',
    tags: ['ben-10', 'cartoons', 'pop-culture', 'nostalgia', 'cartoon-network'],
    description: 'Nostalgic Ben 10 emblem with green Omnitrix transformation alien silhouette graphics.',
  },
  2: {
    name: 'Not Rich Yet (Loading...)',
    themeCategory: 'streetwear',
    tags: ['streetwear', 'chibi', 'typography', 'urban', 'hustle', 'relatable'],
    description: 'Chibi streetwear character in oversized hoodie with loading progress bar typography.',
  },
  3: {
    name: 'Tom & Jerry: Big Trouble',
    themeCategory: 'humor',
    tags: ['tom-and-jerry', 'cartoons', 'retro', 'cheese', 'nostalgia', 'comedy'],
    description: 'Classic Tom & Jerry cartoon showdown with bold retro lettering and cheese chase art.',
  },
  4: {
    name: 'Zenitsu: Thunder Blade',
    themeCategory: 'anime',
    tags: ['demon-slayer', 'kimetsu-no-yaiba', 'zenitsu', 'thunder-breathing', 'anime', 'katana'],
    description: 'Zenitsu Agatsuma in golden lightning Thunder Breathing form with Nichirin Katana.',
  },
  5: {
    name: 'LUCK Jackpot Cylinder',
    themeCategory: 'streetwear',
    tags: ['luck', 'jackpot', 'slot-machine', 'cyberpunk', 'graphic-art', 'streetwear'],
    description: 'Mechanical slot machine cylinder tumbler with embossed metallic LUCK typography.',
  },
  6: {
    name: 'Think Outside The Box',
    themeCategory: 'typography',
    tags: ['minimalist', 'typography', 'graffiti', 'creativity', 'chalk', 'street-art'],
    description: 'Graffiti chalk typography breaking outside the grid with tic-tac-toe arrow motif.',
  },
  7: {
    name: 'MOVE Streetwear Silhouette',
    themeCategory: 'streetwear',
    tags: ['streetwear', 'urban', 'oversized', 'fashion', 'bucket-hat', 'orange'],
    description: 'Oversized streetwear boy silhouette with vibrant safety-orange vertical MOVE lettering.',
  },
  8: {
    name: 'Four Seasons Panorama',
    themeCategory: 'aesthetic',
    tags: ['nature', 'aesthetic', 'minimalist', 'landscape', 'seasons', 'serene'],
    description: 'Minimalist 4-panel vertical panorama capturing the essence of seasons and atmospheric tranquility.',
  },
  9: {
    name: 'Lone Samurai Under Moon',
    themeCategory: 'anime',
    tags: ['samurai', 'japanese', 'full-moon', 'bushido', 'ronin', 'calligraphy'],
    description: 'Lone wandering Samurai standing atop a cliff overlooking a misty mountain moonscape.',
  },
  10: {
    name: 'Pro Controller Matrix',
    themeCategory: 'gaming',
    tags: ['gaming', 'controller', 'playstation', 'xbox', 'tech', 'gamer'],
    description: 'Exploded blueprint and stacked ergonomic gamepad controllers for hardcore gamers.',
  },
  11: {
    name: 'SM Monogram Minimalist',
    themeCategory: 'typography',
    tags: ['monogram', 'geometric', 'minimalist', 'luxury', 'brand-mark'],
    description: 'Architectural geometric monogram emblem precision-crafted with clean negative space.',
  },
  12: {
    name: 'GTA VI Vice Neon',
    themeCategory: 'gaming',
    tags: ['gta-6', 'grand-theft-auto', 'gaming', 'vice-city', 'neon', 'rockstar'],
    description: 'Iconic Grand Theft Auto VI sunset palm-tree neon gradient logo inspired by Vice City.',
  },
  13: {
    name: 'Human After All Emo Anime',
    themeCategory: 'anime',
    tags: ['anime', 'emo', 'streetwear', 'aesthetic', 'sad-boy', 'relatable'],
    description: 'Moody anime streetwear boy illustration with distressed "Human After All" grunge lettering.',
  },
  14: {
    name: 'MONEY Stack Ribbon',
    themeCategory: 'streetwear',
    tags: ['money', 'typography', 'dollar', 'streetwear', 'hustle', 'urban'],
    description: 'Currency banknote wrapped with metallic typography ribbon celebrating ambition.',
  },
  15: {
    name: 'Luffy: Most Wanted Pirate',
    themeCategory: 'anime',
    tags: ['one-piece', 'luffy', 'straw-hat', 'anime', 'manga', 'bounty', 'shonen'],
    description: 'Monkey D. Luffy in Gear pose framed by bold "MOST WANTED" One Piece collage art.',
  },
  16: {
    name: 'CHILL Bubblegum Wave',
    themeCategory: 'typography',
    tags: ['chill', 'typography', 'bubblegum', 'retro', 'liquid', 'groovy', 'pink'],
    description: 'Wavy melting bubblegum typography with retro 70s psychedelic curves and highlights.',
  },
  17: {
    name: 'Kawaii Kittens Stack',
    themeCategory: 'aesthetic',
    tags: ['cats', 'cute', 'kawaii', 'animals', 'kittens', 'playful'],
    description: 'Adorably stacked kawaii kittens with sweet winks, paws, and playful energy.',
  },
  18: {
    name: 'ROSES Dark Romance',
    themeCategory: 'aesthetic',
    tags: ['roses', 'botanical', 'floral', 'dark-romance', 'nature', 'elegance'],
    description: 'High-contrast botanical dark romance art featuring a blooming crimson rose intertwined with modern serif type.',
  },
  19: {
    name: 'Please Do Not Disturb Cat',
    themeCategory: 'humor',
    tags: ['cat', 'humor', 'coffee', 'sarcasm', 'relatable', 'introvert', 'funny'],
    description: 'Cranky cartoon cat guarding coffee: "Please Do Not Disturb, I am disturbed enough already."',
  },
  20: {
    name: 'McLaren Speedmark Supercar',
    themeCategory: 'automotive',
    tags: ['mclaren', 'supercars', 'racing', 'f1', 'speed', 'automotive'],
    description: 'Official typography and papaya aerodynamic speedmark emblem of McLaren Automotive.',
  },
  21: {
    name: 'Good vs Bad Dual Contrast',
    themeCategory: 'typography',
    tags: ['minimalist', 'typography', 'contrast', 'philosophy', 'dark-mode'],
    description: 'Minimalist vertical typographic balance exploring the duality of Good and Bad in clean typography.',
  },
  22: {
    name: 'You Might Be Drunk Kinetic',
    themeCategory: 'humor',
    tags: ['humor', 'kinetic', 'party', 'typography', 'motion-blur', 'funny'],
    description: 'Kinetic motion-blurred typographic illusion playfully reading "You Might Be Drunk."',
  },
  23: {
    name: 'Break Da Rules Ripped Art',
    themeCategory: 'streetwear',
    tags: ['streetwear', 'grunge', 'graffiti', 'break-rules', 'urban', 'rebel'],
    description: 'Ripped parchment effect with gripping hands bursting through "Break Da Rules" street typography.',
  },
  24: {
    name: 'Trust The Process Heavy Metal',
    themeCategory: 'typography',
    tags: ['gym', 'motivational', 'fitness', 'hardcore', 'metal', 'discipline'],
    description: 'Distressed heavy-metal brutalist lettering: "Trust The Process / Stay Rare / Discipline Today."',
  },
  25: {
    name: 'Fill In The Blanks Crossword',
    themeCategory: 'humor',
    tags: ['humor', 'puzzle', 'sarcasm', 'crossword', 'playful', 'comedy'],
    description: 'Clever crossword puzzle poking fun at customer minds: "Like the way you\'re thinking!"',
  },
  26: {
    name: 'Focus On Purpose Mindset',
    themeCategory: 'typography',
    tags: ['mindset', 'motivational', 'discipline', 'focus', 'typography', 'gym'],
    description: 'Refined typographic statement on purpose, discipline, and daily ambition for 2026.',
  },
  27: {
    name: 'The Camera Sutra',
    themeCategory: 'humor',
    tags: ['photography', 'camera', 'photographer', 'humor', 'dslr', 'funny'],
    description: 'Hilarious illustrated guide to photographer acrobatics and shooting positions.',
  },
  28: {
    name: 'TVS Ronin Scrambler Moto',
    themeCategory: 'automotive',
    tags: ['motorcycle', 'scrambler', 'biker', 'ronin', 'moto', 'dark-aesthetic'],
    description: 'Stealth black TVS Ronin modern retro scrambler motorcycle with rugged typography.',
  },
  29: {
    name: 'Continental GT 650 Cafe Racer',
    themeCategory: 'automotive',
    tags: ['royal-enfield', 'gt650', 'motorcycle', 'cafe-racer', 'biker', 'twin'],
    description: 'Royal Enfield Continental GT 650 in racing red chrome with aggressive twin exhausts.',
  },
  30: {
    name: 'DISOBEY Stand Out Sheep',
    themeCategory: 'streetwear',
    tags: ['disobey', 'minimalist', 'individuality', 'black-sheep', 'rebel'],
    description: 'Clean graphic featuring a solitary black sheep among a herd of white sheep with bold DISOBEY type.',
  },
  31: {
    name: 'Equation Clock Matrix',
    themeCategory: 'typography',
    tags: ['math', 'science', 'geek', 'nerd', 'calculus', 'physics'],
    description: 'Clever analog clock face where each hour 1 through 12 is calculated via mathematical equations.',
  },
  32: {
    name: 'Skulls & Roses Skate Decks',
    themeCategory: 'streetwear',
    tags: ['skate', 'gothic', 'tattoo', 'roses', 'skulls', 'snakes', 'streetwear'],
    description: 'Triptych skateboard deck graphics featuring serpent, anatomical skulls, and lush red roses.',
  },
  33: {
    name: "I'm Fine Drowning Thumbs Up",
    themeCategory: 'humor',
    tags: ['dark-humor', 'sarcasm', 'relatable', 'im-fine', 'funny', 'minimalist'],
    description: 'Relatable dark humor stick figure hand giving a thumbs up while submerged in deep water.',
  },
  34: {
    name: 'Disturbed Cat Coffee Club',
    themeCategory: 'humor',
    tags: ['cat', 'humor', 'animals', 'coffee', 'attitude', 'sarcastic'],
    description: 'Grumpy feline glaring over spilled coffee with emphatic warning to leave alone.',
  },
  35: {
    name: 'Porsche Wordmark Heritage',
    themeCategory: 'automotive',
    tags: ['porsche', 'automotive', 'supercars', 'luxury', 'german-engineering'],
    description: 'Timeless wide-spaced Porsche typography embodying precision Stuttgart motorsport engineering.',
  },
  36: {
    name: 'Barely Managing Grocery Shopper',
    themeCategory: 'humor',
    tags: ['relatable', 'humor', 'lifestyle', 'funny', 'groceries', 'adulting'],
    description: 'Exhausted adult staggering with an overflowing paper grocery sack: "Barely Managing."',
  },
  37: {
    name: 'Perspective Lunar Alignment',
    themeCategory: 'aesthetic',
    tags: ['moon', 'astronomy', 'perspective', 'minimalist', 'lunar', 'sacred'],
    description: 'Vertical celestial alignment charting lunar phases with minimalist linear PERSPECTIVE typography.',
  },
  38: {
    name: 'FOCUS Chrome Red Mirror',
    themeCategory: 'typography',
    tags: ['focus', 'typography', 'chrome', 'streetwear', 'reflection', 'red'],
    description: 'Mirror-reflected red metallic liquid typography radiating motivational energy.',
  },
  39: {
    name: 'Toyota GR Supra Racing Edition',
    themeCategory: 'automotive',
    tags: ['supra', 'toyota', 'jdm', 'racing', 'gr-supra', 'drift', 'turbo'],
    description: 'Toyota GR Supra sports coupe top-down perspective paired with official Toyota Supra chest logo.',
  },
  40: {
    name: 'Spider-Man Metallic Chrome',
    themeCategory: 'marvel',
    tags: ['spider-man', 'marvel', 'superhero', 'chrome', 'insignia', 'peter-parker'],
    description: 'Liquid chrome Spider-Man chest spider insignia flanked by menacing glowing white eyes.',
  },
  41: {
    name: 'Monday to Friday Evolution',
    themeCategory: 'humor',
    tags: ['weekend', 'beer', 'humor', 'workplace', 'friday', 'evolution'],
    description: 'Evolution of the working human from crawling Monday corpse to Friday beer cheer celebration.',
  },
  42: {
    name: 'Green Heart Acid Chrome',
    themeCategory: 'streetwear',
    tags: ['cyberpunk', 'acid-graphics', 'y2k', 'streetwear', 'chrome', 'green'],
    description: 'Y2K cyber-acid balloon chrome lettering with green orbital rings and futuristic badges.',
  },
  43: {
    name: 'Dodge Challenger SRT Racing Stripes',
    themeCategory: 'automotive',
    tags: ['dodge', 'challenger', 'srt', 'muscle-car', 'automotive', 'hemi', 'racing', 'v8', 'stripes'],
    description: 'Dodge Challenger muscle car aerial perspective with dual orange racing stripes on back, paired with official Dodge wordmark on front.',
  },
  44: {
    name: 'The Weeknd XO Glow Signature',
    themeCategory: 'streetwear',
    tags: ['the-weeknd', 'xo', 'music', 'pop-culture', 'neon', 'after-hours'],
    description: 'The Weeknd signature neon XO logo lettering blazing in electric yellow concert aesthetic.',
  },
  45: {
    name: 'Crimson Spider Symbiote',
    themeCategory: 'marvel',
    tags: ['spider-man', 'carnage', 'marvel', 'insignia', 'symbiote', 'crimson'],
    description: 'Fierce metallic ruby spider emblem evoking the ferocity of Carnage and the Iron Spider.',
  },
  46: {
    name: 'PLZ USE IT Brain Offering',
    themeCategory: 'humor',
    tags: ['sarcasm', 'humor', 'funny', 'stickman', 'brain', 'logic'],
    description: 'Deadpan stick figure extending a human brain with a simple plea: "PLZ USE IT."',
  },
  47: {
    name: 'F*CK Breakdown Pie Chart',
    themeCategory: 'humor',
    tags: ['humor', 'attitude', 'sarcasm', 'streetwear', 'pie-chart', 'grunge'],
    description: 'Industrial pie chart breakdown calculating exactly where frustration is distributed.',
  },
  48: {
    name: 'BLURRED Liquid Metal Ring',
    themeCategory: 'typography',
    tags: ['chrome', 'cyberpunk', 'y2k', 'typography', 'blurred', 'liquid-metal'],
    description: 'Distorted circular liquid metal chrome typography with high-tech coordinates.',
  },
  49: {
    name: 'God Is A Designer Creative',
    themeCategory: 'typography',
    tags: ['designer', 'creative', 'artist', 'typography', 'graphic-design'],
    description: 'Playful bold lettering celebrating the craft of visual design: "God Is A Designer, So Am I."',
  },
  50: {
    name: 'DISCIPLINE Minimalist Cross',
    themeCategory: 'typography',
    tags: ['discipline', 'minimalist', 'gym', 'focus', 'clean', 'subtle'],
    description: 'Understated ultra-minimalist DISCIPLINE centered on an architectural crosshair axis.',
  },
  51: {
    name: 'Thalapathy Vijay Blockbuster',
    themeCategory: 'indian-cinema',
    tags: ['thalapathy', 'vijay', 'kollywood', 'cinema', 'leo', 'master', 'star'],
    description: 'Action-packed cinematic collage of Thalapathy Vijay in iconic motorcycle and brawl poses.',
  },
  52: {
    name: "What's Up Danger (Spider-Verse)",
    themeCategory: 'marvel',
    tags: ['miles-morales', 'spider-verse', 'marvel', 'danger', 'spider-man'],
    description: 'Miles Morales inverted leap silhouette with stylized "WHAT\'S UP DANGER" spider mask graphic.',
  },
  53: {
    name: 'Heisenberg: Breaking Bad',
    themeCategory: 'cinema',
    tags: ['breaking-bad', 'heisenberg', 'walter-white', 'series', 'chemistry'],
    description: 'High-contrast monochrome silhouette of Walter White in porkpie hat and sunglasses.',
  },
  54: {
    name: 'Another F*cking Day 3D',
    themeCategory: 'humor',
    tags: ['humor', 'relatable', 'streetwear', 'graffiti', '3d-type', 'daily-grind'],
    description: 'Vibrant 3D extrusion graffiti lettering greeting the daily hustle with cheeky honesty.',
  },
  55: {
    name: 'Spotify Vibes Music Walk',
    themeCategory: 'aesthetic',
    tags: ['music', 'spotify', 'aesthetic', 'playlist', 'vibes', 'lo-fi'],
    description: 'Lo-fi aesthetic walking characters immersed in favorite floating Spotify music track players.',
  },
  56: {
    name: 'Forever Ethereal Smoke Lovers',
    themeCategory: 'aesthetic',
    tags: ['couple', 'romance', 'love', 'aesthetic', 'smoke-art', 'forever'],
    description: 'Ethereal ribbons of crimson and silver smoke curling together to form embracing lovers.',
  },
  57: {
    name: 'Meiyazhagan Cinema Heritage',
    themeCategory: 'indian-cinema',
    tags: ['meiyazhagan', 'karthi', 'cinema', 'tamil', 'heritage', 'kollywood'],
    description: 'Refined serif typography commemorating the heartwarming cinematic world of Meiyazhagan.',
  },
  58: {
    name: 'IMPROVE IT Kinetic Slash',
    themeCategory: 'typography',
    tags: ['motivational', 'improve', 'fitness', 'typography', 'kinetic', 'speed'],
    description: 'Kinetic slashed horizontal lettering driving continuous self-improvement and progress.',
  },
  59: {
    name: 'When Life Hurts... Thoongu!',
    themeCategory: 'humor',
    tags: ['tamil-meme', 'thoongu', 'humor', 'relatable', 'sleep', 'stress-relief'],
    description: 'Beloved regional humor graphic showing a peacefully sleeping man: "When Life Hurts... thoongu!"',
  },
  60: {
    name: 'Spring In Action Liquid Type',
    themeCategory: 'typography',
    tags: ['spring', 'liquid', 'typography', 'bold', 'orange', 'warped'],
    description: 'Liquid warped orange and white typographic explosion celebrating vibrant kinetic movement.',
  },
  61: {
    name: 'Sweetheart Chibi Couple Set',
    themeCategory: 'aesthetic',
    tags: ['couple', 'chibi', 'love', 'cute', 'sweetheart', 'boy-girl'],
    description: 'Matching companion boy and girl chibi sweetheart designs holding radiant glowing hearts.',
  },
  62: {
    name: 'Anime Flora & Gaze',
    themeCategory: 'anime',
    tags: ['anime', 'eyes', 'lilies', 'aesthetic', 'manga-gaze', 'butterflies'],
    description: 'Intense anime gaze framed by delicate white lilies and shimmering butterflies.',
  },
  63: {
    name: "Sorry But I Don't Care",
    themeCategory: 'humor',
    tags: ['attitude', 'humor', 'sarcasm', 'smiley', 'unbothered', 'streetwear'],
    description: 'Playful bubbly typography with carefree wink: "Sorry But I Don\'t Care What You Think."',
  },
  64: {
    name: 'Ghost Rider Flaming Inferno',
    themeCategory: 'marvel',
    tags: ['ghost-rider', 'marvel', 'flames', 'comics', 'hellfire', 'antihero'],
    description: 'Blazing hellfire typographic logo of Marvel\'s Spirit of Vengeance, Ghost Rider.',
  },
  65: {
    name: 'Spider-Man Angular Red Crest',
    themeCategory: 'marvel',
    tags: ['spider-man', 'marvel', 'insignia', 'superhero', 'geometric', 'red'],
    description: 'Razor-sharp modern angular red Spider-Man emblem with chest, back, and sleeve options.',
  },
  66: {
    name: 'IT IS ME Red Statement',
    themeCategory: 'typography',
    tags: ['statement', 'minimalist', 'typography', 'bold', 'confidence'],
    description: 'Towering stark white "IT IS ME" typography anchored by an intense vertical red bar.',
  },
  67: {
    name: 'Make Things Happen Orbit',
    themeCategory: 'typography',
    tags: ['space', 'astronomy', 'orbit', 'motivational', 'planetary', 'cosmos'],
    description: 'Astronomical celestial rings and planet spheres orbiting "Make Things Happen" lettering.',
  },
  68: {
    name: 'Formula 1 Racing Speed',
    themeCategory: 'automotive',
    tags: ['f1', 'formula-1', 'racing', 'motorsport', 'speed', 'grand-prix'],
    description: 'The iconic crimson red Formula 1 speedmark celebrating world championship pinnacle racing.',
  },
  69: {
    name: 'The Incredible HULK Green Fury',
    themeCategory: 'marvel',
    tags: ['hulk', 'marvel', 'comics', 'superhero', 'avengers', 'green-fury'],
    description: 'Expressive comic book portrait of Bruce Banner\'s alter ego, The Incredible Hulk.',
  },
  70: {
    name: 'Roronoa Zoro: Three Swords',
    themeCategory: 'anime',
    tags: ['zoro', 'one-piece', 'anime', 'samurai', 'swordsman', 'bamboo'],
    description: 'Roronoa Zoro in traditional green robes standing resolute before a bamboo grove with Santoryu blades.',
  },
  71: {
    name: 'Spider-Man Web Frequency',
    themeCategory: 'marvel',
    tags: ['spider-man', 'marvel', 'mandala', 'sacred-geometry', 'superhero'],
    description: 'Spider-Man poised in attack stance against an intricate geometric sacred-geometry web frequency.',
  },
  72: {
    name: 'Venom: Dual Nature Neon',
    themeCategory: 'marvel',
    tags: ['venom', 'marvel', 'symbiote', 'neon', 'antihero', 'spider-man'],
    description: 'Electrifying neon pink and violet Venom symbiote with razor teeth and serpentine tongue.',
  },
  73: {
    name: 'I AM DOPE Positive Energy',
    themeCategory: 'streetwear',
    tags: ['dope', 'streetwear', 'typography', 'urban', 'positive-energy'],
    description: 'Streetwear typography: "I AM DOPE - Different Original Peaceful Energy."',
  },
  74: {
    name: 'LIF@ Social Connected',
    themeCategory: 'humor',
    tags: ['social-media', 'life', 'digital', 'concept', 'whatsapp', 'instagram'],
    description: 'Satirical digital age life collage fusing major social app icons into the word LIFE.',
  },
  75: {
    name: 'La Casa De Papel Heist',
    themeCategory: 'cinema',
    tags: ['money-heist', 'netflix', 'series', 'dali', 'professor', 'bella-ciao'],
    description: 'Stark black-and-red typography of Netflix global hit thriller La Casa De Papel.',
  },
  76: {
    name: 'Miles Morales: Glitch Hero',
    themeCategory: 'marvel',
    tags: ['miles-morales', 'spider-man', 'marvel', 'glitch', 'spider-verse', 'neon'],
    description: 'Miles Morales Spider-Man dissolving into kinetic golden-amber glitch particle trails.',
  },
  77: {
    name: 'One Piece Straw Hat Banner',
    themeCategory: 'anime',
    tags: ['one-piece', 'luffy', 'anime', 'pirates', 'straw-hat', 'jolly-roger'],
    description: 'Official Straw Hat pirate jolly roger emblem and vibrant cyan ONE PIECE title banner.',
  },
  78: {
    name: 'Tony Stark / RDJ Signature',
    themeCategory: 'marvel',
    tags: ['iron-man', 'rdj', 'marvel', 'signature', 'avengers', 'tony-stark'],
    description: 'Robert Downey Jr. personal signature paired with legendary Iron Man Marvel typography.',
  },
  79: {
    name: 'Do It With Love Ribbon',
    themeCategory: 'typography',
    tags: ['love', 'calligraphy', 'typography', 'metallic', 'pink', 'cursive'],
    description: 'Interlaced 3D metallic ruby pink ribbon sculpture spelling "Do It With Love."',
  },
  80: {
    name: 'Doctor Doom Latverian Green',
    themeCategory: 'marvel',
    tags: ['dr-doom', 'marvel', 'villain', 'comics', 'fantastic-four', 'latveria'],
    description: 'Monolithic Latverian green box typography of Marvel supreme sovereign Doctor Doom.',
  },
  81: {
    name: 'Kratos: God of War PS5',
    themeCategory: 'gaming',
    tags: ['god-of-war', 'kratos', 'gaming', 'playstation', 'norse', 'sparta'],
    description: 'Grizzled Spartan warrior Kratos crowned by iconic PlayStation controller shape glyphs.',
  },
  82: {
    name: 'Uchiha Clan Sharingan Crest',
    themeCategory: 'anime',
    tags: ['naruto', 'uchiha', 'sasuke', 'anime', 'itachi', 'sharingan'],
    description: 'Distressed crimson fan emblem of the legendary Uchiha shinobi clan from Naruto.',
  },
  83: {
    name: 'ARISE: Solo Leveling Monarch',
    themeCategory: 'anime',
    tags: ['solo-leveling', 'sung-jin-woo', 'arise', 'anime', 'shadow-monarch'],
    description: 'Sung Jin-woo\'s thunderous battle cry "ARISE" rendered in dark smoky shadow essence.',
  },
  84: {
    name: 'Flame Kanji Crimson Blaze',
    themeCategory: 'anime',
    tags: ['kanji', 'fire', 'japanese', 'anime', 'calligraphy', 'blaze'],
    description: 'Dynamic Japanese brush calligraphy of Fire (Hi) with crimson ink splatter and gold accents.',
  },
  85: {
    name: 'Jujutsu Kaisen Cursed Energy',
    themeCategory: 'anime',
    tags: ['jujutsu-kaisen', 'jjk', 'gojo', 'sukuna', 'anime', 'curse'],
    description: 'Stylized brush typography of Jujutsu Kaisen infused with dripping cursed energy.',
  },
  86: {
    name: 'Cyber Samurai Tokyo Ronin',
    themeCategory: 'anime',
    tags: ['cyber-samurai', 'cyberpunk', 'katana', 'tokyo', 'armor', 'samurai'],
    description: 'Cybernetically armored Samurai warrior clutching a crimson plasma blade in neo-Tokyo.',
  },
  87: {
    name: 'Straw Hat Crew Vintage Manga',
    themeCategory: 'anime',
    tags: ['one-piece', 'straw-hat', 'luffy', 'vintage-manga', 'retro-anime'],
    description: 'Vintage woodblock manga aesthetic depicting Monkey D. Luffy drawing his Katana sword.',
  },
  88: {
    name: 'Zoro Santoryu Katana Crest',
    themeCategory: 'anime',
    tags: ['zoro', 'santoryu', 'one-piece', 'swordsman', 'three-swords'],
    description: 'Intricate golden crest honoring Roronoa Zoro and his legendary three swords.',
  },
  89: {
    name: 'Zoro Fierce Gaze Box',
    themeCategory: 'anime',
    tags: ['zoro', 'anime-eyes', 'one-piece', 'manga', 'gaze', 'katana'],
    description: 'Panoramic manga eye panel capturing Zoro\'s piercing battle-ready gaze and bandana.',
  },
  90: {
    name: 'Red Dead Redemption II Outlaw',
    themeCategory: 'gaming',
    tags: ['rdr2', 'rockstar', 'arthur-morgan', 'gaming', 'outlaw', 'western'],
    description: 'Distressed crimson and white typography from Rockstar Games\' masterpiece Red Dead Redemption II.',
  },
  91: {
    name: 'Manual Transmission H-Pattern',
    themeCategory: 'automotive',
    tags: ['manual-transmission', 'stick-shift', 'cars', 'jdm', 'gearbox', 'petrolhead'],
    description: 'High-performance manual 6-speed gear shifter gate pattern for true automotive purists.',
  },
  92: {
    name: 'Angry Birds Feathered Fury',
    themeCategory: 'gaming',
    tags: ['angry-birds', 'mobile-gaming', 'cartoons', 'nostalgia', 'birds'],
    description: 'Chunky white cartoon lettering from the world-famous Angry Birds mobile phenomenon.',
  },
  93: {
    name: 'C. Joseph Vijay Leader Edition',
    themeCategory: 'indian-cinema',
    tags: ['vijay', 'thalapathy', 'tvk', 'kollywood', 'leader', 'tamil-nadu'],
    description: 'Regal political leader portrait of Thalapathy C. Joseph Vijay in sharp black suit and gold aura.',
  },
  94: {
    name: 'Protect Your Peace Urban',
    themeCategory: 'streetwear',
    tags: ['protect-your-peace', 'streetwear', 'urban', 'portrait', 'red-slash'],
    description: 'Contemporary streetwear portrait veiled by a bold crimson brushstroke: "Protect Your Peace."',
  },
  95: {
    name: 'Thalaivar Nirandharam Gold',
    themeCategory: 'indian-cinema',
    tags: ['rajinikanth', 'thalaivar', 'superstar', 'kollywood', 'gold-typography'],
    description: 'Gleaming 3D gold cinematic typography commemorating Superstar Rajinikanth: "Thalaivar Nirandharam."',
  },
  96: {
    name: 'Canon EOS Pro Optics Rig',
    themeCategory: 'creative',
    tags: ['canon', 'camera', 'photography', 'lens', 'optics', 'dslr'],
    description: 'Detailed mechanical illustration of a professional Canon EOS DSLR camera body with strap and red ring lens.',
  },
};

function cleanArtworkLabel(fileName: string): string {
  const base = fileName.replace(/\.[^/.]+$/, '').trim();
  if (/^Front \( Left Chest\)$/i.test(base)) return 'Front (Left Chest)';
  if (/^Back \( From collor to full back\)$/i.test(base) || /^Back \( From Collor to full back\)$/i.test(base) || /^Back full back$/i.test(base)) {
    return 'Back (Collar to Full Back)';
  }
  if (/^Sleeve \(on any side bottom\)$/i.test(base)) return 'Sleeve Graphic';
  if (/^Front \( full front only for black tees\)$/i.test(base) || /^Front \( Black tees\)$/i.test(base) || /^Front \(Black Tees\)$/i.test(base)) {
    return 'Front (Black Tees)';
  }
  if (/^Front \( full front only for white tees\)$/i.test(base) || /^Front \( White tees\)$/i.test(base) || /^Front \(White Tees\)$/i.test(base)) {
    return 'Front (White Tees)';
  }
  if (/^Back \( Black tees\)$/i.test(base) || /^Back \(black tees\)$/i.test(base)) return 'Back (Black Tees)';
  if (/^Back \( white tees\)$/i.test(base) || /^Back \(White tees\)$/i.test(base)) return 'Back (White Tees)';
  if (/^Sleeve \( Black Tees\)$/i.test(base)) return 'Sleeve (Black Tees)';
  if (/^Sleeve \( White Tees\)$/i.test(base)) return 'Sleeve (White Tees)';
  if (/^Boy tees front$/i.test(base)) return 'Boy Tee (Front)';
  if (/^Girl Tees Front$/i.test(base)) return 'Girl Tee (Front)';
  if (/^Front bottom$/i.test(base)) return 'Front Hem Graphic';
  if (/^Back bottom$/i.test(base)) return 'Back Hem Graphic';
  if (/^Toyota-Supra-Logo$/i.test(base)) return 'Supra Chest Badge';
  if (/^Vintage Straw Hat Crew Logo$/i.test(base)) return 'Straw Hat Chest Badge';
  if (/^Straw Hat Crew_ One Piece Manga Print$/i.test(base)) return 'Straw Hat Manga Back Print';
  if (/^Luffy_ King of Pirates Graphic$/i.test(base)) return 'Luffy King of Pirates Back Print';
  if (/^Iron Tees Design$/i.test(base)) return 'Iron Man Hero Back Print';
  if (/^Cyber Samurai_ Walk Your Own Path$/i.test(base)) return 'Cyber Samurai Graphic';
  if (/^Spiderman Miles tees Design$/i.test(base)) return 'Spider-Man Miles Morales Graphic';
  if (/^Make Things Happen Orbital Typography$/i.test(base)) return 'Make Things Happen Orbital Graphic';
  if (/^Do It With Love Typographic Design$/i.test(base)) return 'Do It With Love Graphic';
  if (/^Both Front and Back$/i.test(base)) return 'Full Front & Back';
  if (/^Front$/i.test(base) || /^front$/i.test(base)) return 'Front Graphic';
  if (/^Back$/i.test(base) || /^BAck$/i.test(base)) return 'Back Graphic';
  if (/^Sleeve$/i.test(base)) return 'Sleeve Graphic';

  return base.replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function deducePlacement(fileName: string, folderName?: string): DesignPlacementTarget {
  const lower = fileName.toLowerCase();
  if (lower.includes('left chest')) return 'left-chest';
  if (lower.includes('right chest')) return 'right-chest';
  if (lower.includes('sleeve')) return 'left-sleeve';
  if (lower.includes('collar') || lower.includes('collor')) return 'back-center';
  if (lower.includes('bottom') || lower.includes('hem')) return 'bottom-hem';
  if (lower.includes('toyota') || lower.includes('supra') || lower.includes('vintage straw hat')) return 'left-chest';
  if (lower.includes('straw hat crew') && lower.includes('manga')) return 'back-center';
  if (folderName === 'Design 77' && lower.includes('luffy')) return 'back-center';
  if (folderName === 'Design 78' && lower.includes('iron')) return 'back-center';
  if (lower.includes('back')) return 'back-center';
  if (lower.includes('front')) return 'front-center';
  return 'front-center';
}

function deduceColorHint(fileName: string): 'black' | 'white' | 'any' {
  const lower = fileName.toLowerCase();
  if (lower.includes('black tee') || lower.includes('black tees')) return 'black';
  if (lower.includes('white tee') || lower.includes('white tees')) return 'white';
  return 'any';
}

async function run() {
  const folders = fs.readdirSync(SOURCE_DIR).filter((f) => {
    return fs.statSync(path.join(SOURCE_DIR, f)).isDirectory();
  });

  // Sort folders 1 to 96
  folders.sort((a, b) => {
    const numA = parseInt(a.replace('Design ', ''), 10) || 0;
    const numB = parseInt(b.replace('Design ', ''), 10) || 0;
    return numA - numB;
  });

  const designs: ClothingDesignEntry[] = [];
  let totalArtworks = 0;

  for (const folder of folders) {
    const folderPath = path.join(SOURCE_DIR, folder);
    const num = parseInt(folder.replace('Design ', ''), 10) || 0;
    const designId = `design-${num.toString().padStart(3, '0')}`;

    const files = fs
      .readdirSync(folderPath)
      .filter((file) => {
        const ext = path.extname(file).toLowerCase();
        if (!['.png', '.webp', '.jpg', '.jpeg', '.jfif'].includes(ext)) return false;
        if (/mockup|preview|manifest|status|readme/i.test(file)) return false;
        return true;
      })
      .sort();

    if (files.length === 0) continue;

    const meta = DESIGN_METADATA[num] || {
      name: `Design ${num.toString().padStart(2, '0')}`,
      themeCategory: 'streetwear',
      tags: ['apparel', 'graphic-tees', 'customizable'],
      description: 'Exclusive streetwear apparel design from Fregoro Studios.',
    };

    const artworks: DesignArtworkOption[] = files.map((file, idx) => {
      const artId = `art-${idx + 1}`;
      totalArtworks++;

      return {
        id: artId,
        fileName: file,
        name: cleanArtworkLabel(file),
        suggestedPlacement: deducePlacement(file, folder),
        colorHint: deduceColorHint(file),
        originalPath: file,
        originalObjectKey: `clothing-designs/${designId}/original/${file}`,
        thumbnailObjectKey: `clothing-designs/${designId}/previews/thumb_${artId}.webp`,
        previewObjectKey: `clothing-designs/${designId}/previews/studio_${artId}.webp`,
        previewUrl: `/api/clothing-designs/${designId}/preview?artId=${artId}&type=thumbnail&v=v2`,
        studioPreviewUrl: `/api/clothing-designs/${designId}/preview?artId=${artId}&type=studio&v=v2`,
      };
    });

    const defaultArt =
      artworks.find((a) => a.fileName.toLowerCase().includes('front')) ||
      artworks[0];

    const surfaces = Array.from(
      new Set(
        artworks.map((a) => {
          if (a.suggestedPlacement.includes('back')) return 'back';
          if (a.suggestedPlacement.includes('sleeve')) return 'sleeve';
          return 'front';
        })
      )
    );

    designs.push({
      id: designId,
      folder,
      name: meta.name,
      category: 'tees',
      tags: [meta.themeCategory, ...meta.tags, 'apparel', 'clothing-design'],
      artworks,
      defaultArtworkId: defaultArt.id,
      defaultSurface: (defaultArt.suggestedPlacement.includes('back') ? 'back' : 'front') as 'front' | 'back',
      availableSurfaces: surfaces as ('front' | 'back' | 'sleeve')[],
      previewUrl: defaultArt.previewUrl,
      studioPreviewUrl: defaultArt.studioPreviewUrl,
      status: 'active',
      compatibleGarments: ['regular-t-shirt', 'oversized-t-shirt', 'acid-wash-t-shirt', 'hoodie'],
      createdAt: new Date().toISOString(),
    });
  }

  const manifest: ClothingDesignManifest = {
    version: '3.0.0',
    generatedAt: new Date().toISOString(),
    totalDesigns: designs.length,
    totalArtworks,
    designs,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`Rebuilt manifest with ${designs.length} designs and ${totalArtworks} artworks.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
