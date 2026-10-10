import os
import json
import re
from PIL import Image

SRC_BASE = r'C:\Users\gokul\Downloads\TShirts Design\AR 5 7 Posters Chnaged'
POSTERS_DIR = r'd:\Webites\StarBy\public\Posters'
SCRATCH_CATALOG = r'd:\Webites\StarBy\scratch_catalog_raw.json'

with open(SCRATCH_CATALOG, 'r', encoding='utf-8') as f:
    raw_catalog = json.load(f)

# Deduplicate raw catalog by file
unique_files = {}
for r in raw_catalog:
    if r['file'] not in unique_files:
        unique_files[r['file']] = r

print(f"Loaded {len(unique_files)} unique posters from scratch catalog.")

# 52 SPLIT OVERRIDES (themeSlug, title, tags)
SPLIT_OVERRIDES = {
    # 3 Stepped Split Posters (19:11)
    '3 Split Poster.webp': ('bikes', 'Valentino Rossi VR46 — Monster Energy Yamaha MotoGP', ['valentino rossi', 'motogp', 'yamaha', 'racing', 'superbike', 'split']),
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_14b9a2cc-0d91-43f3-a299-36b138754a76_3.webp': ('marvel', 'Spider-Man vs Venom — Symbiote Duality', ['spiderman', 'venom', 'marvel', 'symbiote', 'peter parker', 'split']),
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_6ab69d04-87e0-44e5-81be-be7a90302496_3.webp': ('f1', 'Max Verstappen 33 — Oracle Red Bull Racing F1', ['max verstappen', 'red bull', 'f1', 'formula 1', 'racing', 'split']),
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_ac21a646-6e09-4c8f-a023-2d83dd1a4777_3.webp': ('bikes', 'Yamaha YZF-R1 — Highway Sunset Wheelie', ['yamaha r1', 'superbike', 'motorcycle', 'wheelie', 'street', 'split']),
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_be093dbe-ae15-4afb-97fd-ffcfd78b1cdc_3.webp': ('bikes', 'Brad Binder 33 — Red Bull KTM Factory Racing', ['brad binder', 'ktm', 'motogp', 'racing', 'superbike', 'split']),
    # 5 Stepped Split Posters (44:21)
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_c500f4a2-3ca8-471c-86fb-5b78ea8ecc81_3.webp': ('netflix-series', 'Thomas Shelby — Peaky Blinders Crimson Noir', ['thomas shelby', 'peaky blinders', 'cillian murphy', 'birmingham', 'netflix', 'split']),
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_ef9c2920-e7ec-4d5d-8ef9-638716a339a0_3.webp': ('actress', 'Samantha Ruth Prabhu — Glamour Neon Glow', ['samantha', 'actress', 'tollywood', 'kollywood', 'portrait', 'split']),
    # Vertical Split Totems (4:17 = 33:140)
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_0467d325-ba0b-418b-ab83-3bf9bf5366c3_3.webp': ('kollywood', 'Leo Thalapathy Vijay — Bloody Sweet Totem', ['vijay', 'thalapathy', 'leo', 'kollywood', 'lcu', 'split']),
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_47766b5f-d39c-4ff9-b07e-3efa6f0d92ca_3.webp': ('f1', 'Oscar Piastri #81 — McLaren F1 Papaya Totem', ['oscar piastri', 'mclaren', 'f1', 'formula 1', 'racing', 'split']),
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_554cf690-7426-4f50-bffe-662919a384d4_3.webp': ('f1', 'Formula 1 Monolith — Studio Apex Architecture', ['f1', 'formula 1', 'monolith', 'supercar', 'racing', 'split']),
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_5fdcd808-60a4-4883-8404-e8365a139b7f_3.webp': ('marvel', 'Moon Knight — Crescent Reflection Totem', ['moon knight', 'khonshu', 'marvel', 'oscar isaac', 'split']),
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_9776c4f2-ec7d-46df-b71b-7b83937385ca_3.webp': ('dc', 'The Batman — Gotham Rain Nocturne Totem', ['batman', 'dark knight', 'gotham', 'dc', 'robert pattinson', 'split']),
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_f207d352-eac7-448d-8cbb-316249c59d74_3.webp': ('anime', 'Majin Vegeta — Bones & Ego DBZ Totem', ['vegeta', 'majin vegeta', 'dragon ball', 'dbz', 'anime', 'split']),
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_fae96407-9882-40c4-88f9-4bbd5a06d434_3.webp': ('marvel', 'Avengers Flame — Secret Wars Monolith Totem', ['avengers', 'doctor doom', 'secret wars', 'marvel', 'split']),
    # Classic Horizontal Split (17:8 / 2:1)
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_2097d66e-d042-46a0-a7ac-2fa51c635caf_3.webp': ('marvel', 'Spider-Man vs Venom — Half & Half Symbiote', ['spiderman', 'venom', 'marvel', 'symbiote', 'split']),
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_32ccfd78-8de2-4e97-b388-a36b14513597_3.webp': ('marvel', 'Carnage — Crimson Symphony Chaos', ['carnage', 'symbiote', 'venom', 'marvel', 'split']),
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_3d45351d-0d64-4e6c-91eb-a97f774dea00_2.webp': ('cars', 'Toyota Supra MK4 — Smoke Drift Horizon', ['toyota supra', 'supra mk4', 'drift', 'jdm', 'cars', 'split']),
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_464fc527-9263-4433-a1af-d9667399d90b_3.webp': ('marvel', 'Doctor Doom — Emerald Sanctum Sovereign', ['doctor doom', 'avengers', 'marvel', 'latveria', 'split']),
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_4e9f906e-5ba9-4c0a-8e81-079251a6d5a3_3.webp': ('bikes', 'Yamaha YZF-R1 — Red Horizon Wheelie', ['yamaha r1', 'superbike', 'sunset', 'speed', 'bikes', 'split']),
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_555c7e77-26be-4c91-a2d2-0490194489c4_3.webp': ('music', 'N.W.A — Straight Outta Compton Street Legends', ['nwa', 'eazy e', 'ice cube', 'dr dre', 'hip hop', 'music', 'split']),
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_57b3b9cc-7042-4119-af90-2fc57f8b5a90_3.webp': ('bikes', 'Valentino Rossi 46 — MotoGP Apex Predator', ['valentino rossi', 'motogp', 'yamaha', 'racing', 'bikes', 'split']),
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_5f3cb948-d4cb-464b-8016-3e27715c0d05_3.webp': ('marvel', 'Miles Morales — Neon Cyber Drip Hoodie', ['miles morales', 'spiderman', 'into the spiderverse', 'marvel', 'split']),
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_6c09ca1e-4c3a-40db-8457-33e43905aabd_3.webp': ('anime', 'Cyberpunk Gunner — Neon Red Ronin', ['cyberpunk', 'anime', 'gunner', 'sci-fi', 'split']),
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_7a96d29f-220e-44f0-97d1-cc2a7096708f_3.webp': ('dc', 'The Joker — Throne of Chaos Gotham Arkham', ['joker', 'batman', 'gotham', 'dc', 'chaos', 'split']),
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_a585620d-73c0-4f03-b936-2d5bb1213093_3.webp': ('marvel', 'Spider-Man — Rooftop Crimson Horizon', ['spiderman', 'marvel', 'peter parker', 'queens', 'split']),
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_c054f7e5-5ed5-453d-8f54-8497cff5c7f5_3.webp': ('anime', 'Son Goku — Ultra Instinct Divine Aura', ['goku', 'ultra instinct', 'dragon ball super', 'anime', 'split']),
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_d341b804-8cf4-4e00-8112-a3fbdf7dda49_3.webp': ('marvel', 'Moon Knight — Full Moon Temple of Khonshu', ['moon knight', 'khonshu', 'marvel', 'egypt', 'split']),
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_f0134bff-f4ac-4ae8-89ff-3ce9931423a3_3.webp': ('gamers', 'Simon Ghost Riley — Call of Duty Recon Warfare', ['ghost', 'call of duty', 'warzone', 'modern warfare', 'gamers', 'split']),
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_f0e741c6-5002-4435-82bd-821d0775f64c_3.webp': ('anime', 'Zenitsu Agatsuma — Thunder Breathing First Form', ['zenitsu', 'demon slayer', 'kimetsu no yaiba', 'anime', 'split']),
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_f61f0072-7fe7-4ef3-b41a-d23c864377ab_2.webp': ('dc', 'Justice League United — The Snyder Cut Mosaic', ['justice league', 'superman', 'batman', 'wonder woman', 'dc', 'split']),
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_f6d2b7b4-1da2-42d1-bac5-2995e6d9dfed_3.webp': ('netflix-series', 'Tommy Shelby — Crimson Cigarette Smoke', ['tommy shelby', 'peaky blinders', 'cillian murphy', 'netflix', 'split']),
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_fd4db6f1-8ed7-4564-a0e1-9899e8c1824a_0.webp': ('marvel', 'Doctor Doom & Iron Man — Multiverse Collision', ['doctor doom', 'iron man', 'marvel', 'secret wars', 'split']),
    'Fregoro_Studios_Miles_Morales_Marvels_Spider_Man_game_character_0b07a660-89c2-4834-87e3-a122a2e93ec6.webp': ('marvel', 'Miles Morales — Brooklyn Rooftop Leap', ['miles morales', 'spiderman', 'marvel', 'playstation', 'split']),
    # Grid Horizontal Split (17:16)
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_0055e015-e7af-498e-9ab5-9df129ea9903_3.webp': ('marvel', 'Doctor Doom & Iron Man — Dual Sovereign Matrix', ['doctor doom', 'iron man', 'marvel', 'matrix', 'split']),
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_0bcd7e53-3c88-48c6-a4ab-e33428daba12_3.webp': ('marvel', 'Miles Morales — Cyber Drip Grid Matrix', ['miles morales', 'spiderman', 'marvel', 'grid', 'split']),
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_19f3439c-b06b-4e11-8fa1-b4ccaa5eb1eb_3.webp': ('anime', 'Zenitsu Agatsuma — Thunder Flash Grid', ['zenitsu', 'demon slayer', 'anime', 'grid', 'split']),
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_1e308c45-07b5-430a-922b-10d00800e03e_3.webp': ('marvel', 'Spider-Man — Crimson Sky Grid Matrix', ['spiderman', 'marvel', 'grid', 'split']),
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_2e482216-5195-4826-bbf0-e35c334e56c1_3.webp': ('anime', 'Son Goku — Ultra Instinct Power Surge Grid', ['goku', 'ultra instinct', 'dbz', 'anime', 'grid', 'split']),
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_39003d15-4b4d-4e81-92b2-bc69e2ba9518_3.webp': ('bikes', 'Yamaha YZF-R1 — Midnight Throttle Grid', ['yamaha r1', 'superbike', 'bikes', 'grid', 'split']),
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_5899a9ef-29d2-4340-8649-c0426f0a0739_3.webp': ('marvel', 'Carnage — Bloodfire Chaos Grid Matrix', ['carnage', 'symbiote', 'marvel', 'grid', 'split']),
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_5ae2ffe7-a3ae-4656-9452-3dd6b7a7347a_3.webp': ('netflix-series', 'Tommy Shelby — Birmingham Shadows Grid', ['tommy shelby', 'peaky blinders', 'netflix', 'grid', 'split']),
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_739fcda2-456a-4fbe-b140-9018138b2f5a_3.webp': ('marvel', 'Doctor Doom — Latverian Throne Grid', ['doctor doom', 'marvel', 'grid', 'split']),
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_87b422a5-0502-4254-a066-f733dc0af620_3.webp': ('marvel', 'Spider-Man & Venom — Split Face Grid Matrix', ['spiderman', 'venom', 'marvel', 'grid', 'split']),
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_a94469bc-11fa-4c89-bbcb-48f8dfaec9e7_1.webp': ('dc', 'Justice League United — Snyder Cut Grid', ['justice league', 'dc', 'grid', 'split']),
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_b21b5b01-3d39-4567-bd5d-5e4c9527da8c_3.webp': ('music', 'N.W.A — Compton Street Syndicate Grid', ['nwa', 'hip hop', 'music', 'grid', 'split']),
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_bc263fe9-879b-4dc1-9784-1ad565dc07b0_3.webp': ('bikes', 'Valentino Rossi — 46 MotoGP Grid Matrix', ['valentino rossi', 'motogp', 'bikes', 'grid', 'split']),
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_c184aa54-cafc-4c89-9e27-f2018bd55fed_3.webp': ('marvel', 'Moon Knight — Lunar Shrine Grid', ['moon knight', 'marvel', 'grid', 'split']),
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_d4b9b6a3-dbf1-444c-8c1d-6435e6a08d01_3.webp': ('gamers', 'Simon Ghost Riley — Warzone Night Vision Grid', ['ghost', 'call of duty', 'gamers', 'grid', 'split']),
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_e3c3d4af-921f-4639-a653-f4759c6485a7_3.webp': ('anime', 'Cyberpunk Gunner — Neon Assassin Grid', ['cyberpunk', 'anime', 'grid', 'split']),
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_e69997dd-3599-471a-ae39-34d73389a95c_1.webp': ('marvel', 'Miles Morales — Web Slinger Grid Matrix', ['miles morales', 'spiderman', 'marvel', 'grid', 'split']),
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_ea843d67-c173-4556-bfe9-fe34fcc25182_3.webp': ('dc', 'The Joker — Arkham Chaos Grid Matrix', ['joker', 'batman', 'dc', 'grid', 'split']),
    'Fregoro_Studios_Extend_the_existing_background_into_the_empty_ecff18b4-fb76-4237-9b23-996bfdfef59f_3.webp': ('cars', 'Toyota Supra — JDM Drift Master Grid', ['toyota supra', 'drift', 'cars', 'grid', 'split'])
}

FOLDER_TO_THEME = {
    'Actress': 'actress',
    'Anime': 'anime',
    'Ben 10': 'ben-10',
    'Bikes': 'bikes',
    'Breaking Bad': 'breaking-bad',
    'Cars': 'cars',
    'Criecket': 'cricket',
    'Cricket': 'cricket',
    'Cute Photos': 'cute-photos',
    'DC': 'dc',
    'Disney': 'disney',
    'F1': 'f1',
    'Football': 'football',
    'Game Of Thrones': 'game-of-thrones',
    'Gamers': 'gamers',
    'Interstellar': 'interstellar',
    'Kollywood': 'kollywood',
    'Marvel': 'marvel',
    'Music': 'music',
    'Netflix Series': 'netflix-series',
    'Scooby Doo': 'scooby-doo',
}

THEME_NAMES = {
    'actress': 'Actress',
    'anime': 'Anime',
    'ben-10': 'Ben 10',
    'bikes': 'Bikes',
    'breaking-bad': 'Breaking Bad',
    'cars': 'Cars',
    'cricket': 'Cricket',
    'cute-photos': 'Cute Photos',
    'dc': 'DC',
    'disney': 'Disney',
    'f1': 'F1',
    'football': 'Football',
    'game-of-thrones': 'Game Of Thrones',
    'gamers': 'Gamers',
    'interstellar': 'Interstellar',
    'kollywood': 'Kollywood',
    'marvel': 'Marvel',
    'music': 'Music',
    'netflix-series': 'Netflix Series',
    'scooby-doo': 'Scooby Doo',
}

# Thematic title generators for unnamed files
THEMATIC_TITLES = {
    'actress': [
        "Editorial Glow Portrait", "Golden Hour Noir", "Haute Couture Silhouette", "Cinematic Radiance",
        "Vogue Studio Serenade", "Timeless Elegance", "Midnight Satin Muse", "Sun-Drenched Gaze",
        "Classic Celluloid Diva", "Emerald Velvet Radiance", "Monochrome Allure", "Crimson Petal Reverie",
        "Ethereal Sunset Glow", "Studio Starlight Muse", "Poised in Noir", "Grace & Luminescence",
        "Gilded Glamour Muse"
    ],
    'anime': [
        "Shonen Spirit Awakening", "Tokyo Neon Ronin", "Katana Slash Horizon", "Celestial Manga Fury",
        "Super Saiyan Limit Break", "Demon Hunter Nightfall", "Titan Wall Standoff", "Infinite Domain Sorcery",
        "Crimson Shinobi Echo", "Cyberpunk Megalopolis Edge", "Spirit Dragon Summon", "Astral Blade Resonance"
    ],
    'ben-10': [
        "Omnitrix Emerald Core", "Heatblast Pyronite Inferno", "Diamondhead Crystal Bulwark", "XLR8 Kineceleran Velocity",
        "Four Arms Tetramand Might", "Upgrade Galvanic Nanite", "Ghostfreak Ectonurite Shroud", "Cannonbolt Arburian Charge",
        "Alien Force Sovereign", "Ultimate Alien Vanguard", "Omniverse Hero Nexus"
    ],
    'bikes': [
        "Apex Lean Superbike", "Trackside Apex Symphony", "Superleggera Crimson Fury", "Highway Nocturne Throttle",
        "Motocross Dust & Thunder", "Neon Circuit Isle of Man", "Ducati Redline Majesty", "Carbon Fiber Beast",
        "Turbocharged Asphalt Drift", "Midnight Superbike Ghost", "Thunderous Exhaust Roar"
    ],
    'breaking-bad': [
        "Walter White — The Danger", "Heisenberg Golden Desert Empire", "Jesse Pinkman — Science & Regret"
    ],
    'cars': [
        "JDM Midnight Expressway", "Supercar Twin-Turbo Launch", "Classic Muscle Rumble", "Nürburgring Apex Strike",
        "Monaco Grand Boulevard", "Matte Carbon Aerodynamics", "Hypercar Butterfly Wings", "Neon Wet Tarmac Stance",
        "Trackday Precision Apex", "Widebody Horizon Stance", "Tachometer Redline Scream", "Stuttgart Flat-Six Heritage",
        "V12 Italian Stallion", "Drift Cloud Apex Entry", "Retro 80s Turbo Coupe", "Aggressive Diffuser Stance",
        "Midnight Skyline GT-R", "Silver Arrow Aerodynamics", "Matte Stealth Supercar", "Speedway Sunset Burnout",
        "Pure Velocity Horizon", "Apex Predator Hypercar"
    ],
    'cricket': [
        "Master Blaster Century Strike", "Yorker at 150kmph Stumps", "Cover Drive Symphony",
        "World Cup Champions Roar", "Lord’s Balcony Reverie"
    ],
    'cute-photos': [
        "Golden Retriever & Doberman Playtime", "Cozy Polaroid Kitten Moments", "Sassy Tabby Cat Garden Stroll",
        "Puppy Eyes Golden Slumber", "Playful Furry Companions"
    ],
    'dc': [
        "Gotham Rooftop Sentinel", "Metropolis Solar Guardian", "Themysciran Golden Lasso", "Speed Force Lightning Streak",
        "Arkham Asylum Shadows", "Atlantis Ocean Sovereign", "Cybernetic Core Victor", "Blüdhaven Acrobat Strike",
        "Emerald Willpower Construct", "Dark Knight Batmobile Charge", "Krypton Son of Light", "Gargoyle Rain Watch",
        "Joker Acid Flower Smile", "Wayne Manor Manor Nocturne", "Justice Hall Council", "Apokolips Anti-Life Defiance",
        "Shadow of Gotham Alley", "Man of Tomorrow Sunrise", "Batman Detective Noir", "Red Hood Outlaw Vengeance",
        "Deathstroke Lethal Contract", "Harley Quinn Mallet Chaos", "Bane Venom Surge", "Riddler Question Mark Maze",
        "Scarecrow Fear Toxin Mist", "Catwoman Diamond Heist", "Batgirl Clocktower Defense", "Robin Boy Wonder Leap",
        "Constantine Hellblazer Flame", "Zatanna Stage Illusion", "Doctor Fate Golden Ankh", "Shazam Lightning Roar",
        "Martian Manhunter Telepathy", "Hawkman Thanagarian Mace", "Black Canary Sonic Cry", "Green Arrow Star City Bow",
        "Supergirl Kara Zor-El Flight", "Lex Luthor Power Suit", "Sinestro Yellow Ring Fear", "Brainiac Ship Nexus",
        "Darkseid Omega Beams", "Doomsday Unstoppable Rage", "Flash Cosmic Treadmill", "Batman Cape Glider",
        "Superman Fortress of Solitude", "Joker Playing Card Trick", "Wonder Woman Battle Armor", "Gotham City Skyline Flare",
        "Dark Multiverse Batman"
    ],
    'disney': [
        "Cinderella Castle Midnight Starlight", "Mickey Mouse Steamboat Whistle", "Lion King Pride Rock Sunrise",
        "Pixar Cosmic Space Ranger", "Enchanted Forest Tale"
    ],
    'f1': [
        "Monaco Swimming Pool Apex", "Silverstone Maggots & Becketts", "Spa-Francorchamps Eau Rouge Crest",
        "Suzuka Esses Flow", "Pitlane Sub-2s Lightning Stop", "Rainy Interlagos Drift", "Monza Parabolica Velocity",
        "Night Race Marina Bay Flare", "Pole Position Q3 Glory", "Checkered Flag Victory Burnout",
        "V6 Turbo Hybrid Whine", "Telemetry Steering Wheel Apex", "Podium Champagne Shower",
        "Carbon Fiber Front Wing Flow", "Red Bull Downforce Mastery"
    ],
    'football': [
        "Cristiano Ronaldo — Iconic CR7 Stance", "Overhead Bicycle Kick Wonder", "Champions League Final Stoppage",
        "Stadium Floodlights Roar", "Samba Dribble Magic", "World Cup Golden Trophy Kiss", "Top Corner Free Kick Curl",
        "Derby Day Passion Flare", "Goalkeeper Flying Tip-Over", "Pitch Turf Mud & Glory"
    ],
    'game-of-thrones': [
        "Iron Throne Blades & Fire", "Drogon Dragon Flame Flight", "Winterfell Snow Bastion",
        "Night King Blue Ice Gaze", "House Stark Direwolf Vigil", "Daenerys Mother of Dragons"
    ],
    'gamers': [
        "Warzone Tactical Extraction", "Cyberpunk 2077 Night City Edge", "Elden Ring Erdtree Radiance",
        "The Witcher White Wolf Trail", "God of War Leviathan Axe", "Halo Master Chief Spartan Armor",
        "Red Dead Western Sunset", "Valorant Spike Rush Clutch", "Dark Souls Bonfire Warmth",
        "Destiny 2 Guardian Super", "BioShock Rapture Underwater Deco", "Doom Slayer Hellfire Charge",
        "Assassin Creed Eagle Leap", "Skyrim Dragonborn Cry", "Apex Legends Champion Squad",
        "Half-Life Crowbar Portal", "Fallout Vault Boy Wasteland", "Resident Evil Biohazard Shadows",
        "Metal Gear Stealth Solid", "Ghost of Tsushima Sakai Blade", "Horizon Zero Dawn Tallneck",
        "Bloodborne Yharnam Hunt", "Mass Effect Normandy Orbit", "Sekiro Shadows Die Twice",
        "Final Fantasy Buster Sword"
    ],
    'interstellar': [
        "Gargantua Black Hole Singularity", "Endurance Spacecraft Orbital Spin", "Miller’s Planet Giant Tidal Wave",
        "TARS Quantum Tesseract Nexus"
    ],
    'kollywood': [
        "Thalapathy Vijay — Leo Bloody Sweet", "Superstar Rajinikanth — Hukum Jailer", "Thala Ajith — Mankatha Billa Swag",
        "Ulaganayagan Kamal Haasan — Vikram Rolex", "Kollywood Mass Cinema Hero Stance", "Anirudh Musical Beat Symphony",
        "Vintage Tamil Cinema Gold", "Madras Retro Celluloid", "Cinema Theatre First Day First Show",
        "Iconic K-Town Mass Silhouette", "Chennai Street Champion"
    ],
    'marvel': [
        "Iron Man Mark LXXXV Repulsor Surge", "Spider-Man Manhattan Web Swing", "Doctor Doom Latverian Monarch",
        "Thor Mjolnir Thunder Strike", "Captain America Vibranium Shield", "Wolverine Adamantium Claws",
        "Deadpool Chimichanga Crosshairs", "Doctor Strange Mirror Dimension", "Black Panther Wakanda Forever",
        "Thanos Infinity Gauntlet Snap", "Hulkbuster Heavy Armor Deploy", "Scarlet Witch Chaos Magic Hex",
        "Loki God of Stories Crown", "Daredevil Hell’s Kitchen Rooftop", "Punisher Skull Tactical Recon",
        "Silver Surfer Cosmic Glider", "Ghost Rider Hellfire Cycle", "Carnage Crimson Tendrils",
        "Magneto Magnetic Levitation", "Gambit Kinetic Ace of Spades", "Nightcrawler Teleport Smoke",
        "Cyclops Ruby Quartz Blast", "Jean Grey Phoenix Force Rebirth", "Cable Time-Travel Arsenal",
        "Winter Soldier Bionic Arm", "Falcon Vibranium Wings", "War Machine Heavy Artillery",
        "Ant-Man Quantum Realm Descent", "Hawkeye Ronin Katana Shadow", "Black Widow Red Room Sting",
        "Shang-Chi Ten Rings Momentum", "Blade Daywalker Vampire Hunter", "Moon Knight Fist of Khonshu",
        "Star-Lord Elemental Blaster", "Gamora Deadliest Assassin", "Rocket & Groot Firepower Duo",
        "Adam Warlock Sovereign Golden Glow", "Nova Centurion Helmet", "Galactus World Devourer",
        "Venom We Are Lethal Protector", "Miles Morales Electric Venom Blast", "Spider-Man 2099 Cyberweb",
        "Green Goblin Pumpkin Bomb Glide", "Doctor Octopus Adamantium Tentacles", "Mysterio Holographic Illusion",
        "Kraven The Hunter Savage Jungle", "Sandman Golden Dune Form", "Electro High-Voltage Surge",
        "Kingpin Fisk Hell’s Kitchen Grip", "Bullseye Deadly Precision", "Spider-Gwen Multiverse Leap",
        "Iron Spider Golden Spider-Legs", "Thor Stormbreaker Bifrost Strike", "Captain Marvel Binary Star",
        "Sentry Golden Sun Flare", "Hercules Olympian Might", "Namor Talokan Feathered Serpent",
        "Doctor Doom Iron Mask Throne", "Spider-Man Rain Tears Silhouette", "Avenger Endgame Portal Charge",
        "Marvel Multiverse Cosmic Rift", "Iron Man Arc Reactor Heart", "Wolverine Berserker Rage",
        "Deadpool Katana Dual Slash", "Groot I Am Cosmic Branch", "Infinity Stones Cosmic Halo",
        "Wakanda Golden City Sunset", "Asgard Rainbow Bridge Glade", "Sanctum Sanctorum Window Eye",
        "Stark Tower New York Peak", "Baxter Building Fantastic 4", "X-Mansion Danger Room Protocol",
        "X-Men 97 Animated Strike", "Wolverine Brown & Yellow Classic", "Cyclops To Me My X-Men",
        "Magneto Was Right Manifesto", "Colossus Organic Steel Wall", "Juggernaut Unstoppable Charge",
        "Apocalypse Ancient Pharaoh God", "Mister Sinister Mutant DNA Helix", "Sabretooth Savage Fangs",
        "Deadpool & Wolverine Best Bubs", "Spider-Man Peter Parker Backpack", "Miles Morales Jordan Sneakers",
        "Symbiote Suit Secret Wars 1984", "Cosmic Ghost Rider Space Chain", "World War Hulk Gladiator Armor",
        "Immortal Hulk Emerald Terror", "Superior Spider-Man Otto Octavius", "Spider-Punk Anarchy Riff",
        "Gwenpool Fourth Wall Breach", "Silk Cindy Moon Web Weaver", "Spider-Noir trench Coat Fedora"
    ],
    'music': [
        "N.W.A Compton Hip-Hop Pioneers", "Vinyl Record Groove & Needle", "Retro Cassette Tape Synthwave",
        "Analog Synthesizer Waveform", "Electric Guitar Distortion Tube"
    ],
    'netflix-series': [
        "Thomas Shelby Birmingham Smoke", "Stranger Things Hawkins Retro Bicycle", "Squid Game Red Light Green Light",
        "Money Heist Dalí Mask & Red Jumpsuit"
    ],
    'scooby-doo': [
        "Scooby-Doo — Mystery Inc Hero", "Shaggy Rogers — Zoinks! Detective", "The Mystery Machine Road Trip",
        "Fred Jones — Trap Master Leader", "Daphne Blake — Clue Finder Sleuth", "Velma Dinkley — Jinkies! Intellect"
    ]
}

def get_color_info(file_path):
    try:
        with Image.open(file_path) as img:
            small = img.resize((40, 40)).convert('RGB')
            colors = small.getcolors(maxcolors=1600)
            if not colors:
                return '#181A20', '#3B82F6', 'dark', 'cinematic'
            colors.sort(key=lambda x: x[0], reverse=True)
            dom_r, dom_g, dom_b = colors[0][1]
            sec_r, sec_g, sec_b = colors[min(1, len(colors)-1)][1]
            for count, (r, g, b) in colors:
                if abs(r - g) > 25 or abs(r - b) > 25 or abs(g - b) > 25:
                    sec_r, sec_g, sec_b = r, g, b
                    break
            brightness = 0.299 * dom_r + 0.587 * dom_g + 0.114 * dom_b
            b_label = 'dark' if brightness < 85 else ('bright' if brightness > 170 else 'mid')
            dom_hex = f'#{dom_r:02x}{dom_g:02x}{dom_b:02x}'.upper()
            sec_hex = f'#{sec_r:02x}{sec_g:02x}{sec_b:02x}'.upper()
            return dom_hex, sec_hex, b_label, 'cinematic'
    except Exception:
        return '#181A20', '#3B82F6', 'dark', 'cinematic'

# Clean filename title extractor
def clean_filename_title(fn):
    s = fn.replace('.webp', '').replace('.png', '')
    s = re.sub(r'_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(_[0-9])?', '', s, flags=re.I)
    s = re.sub(r'-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(_[0-9])?', '', s, flags=re.I)
    s = re.sub(r'Fregoro_Studios_httpss\.mj\.run[A-Za-z0-9]+_', '', s)
    s = s.replace('Fregoro_Studios_', '').replace('Vertical_', '').replace('Horizontal_', '').replace('Cinematic_', '').replace('widescreen__', '').replace('widescreen_', '')
    s = s.replace('_', ' ').replace('-', ' ').strip()
    s = re.sub(r'\s+', ' ', s)
    return s.title()

# Track counters per theme
theme_counters = {}
thematic_indices = {}

artworks = []
all_keys = sorted(list(unique_files.keys()))

for idx, file_name in enumerate(all_keys):
    item = unique_files[file_name]
    full_path = os.path.join(POSTERS_DIR, file_name)
    
    clean_rel = item['rel_path'].replace('\\\\', '/').replace('\\', '/')
    root_folder = clean_rel.split('/')[0]
    
    # 1. Determine themeSlug
    if file_name in SPLIT_OVERRIDES:
        theme_slug, override_title, override_tags = SPLIT_OVERRIDES[file_name]
        is_split = True
    else:
        theme_slug = FOLDER_TO_THEME.get(root_folder, 'marvel')
        override_title = None
        override_tags = None
        is_split = 'Split' in clean_rel or item['ratio'] > 1.6 or item['ratio'] < 0.35
    
    # 2. Orientation & split compatibility
    ratio = item['ratio']
    if ratio < 0.85:
        orientation = 'portrait'
    else:
        orientation = 'landscape'
        
    is_split_compatible = is_split or (ratio > 1.6) or (ratio < 0.35) or (1.0 < ratio < 1.15)
    product_type = 'split' if is_split_compatible else 'poster'
    
    # 3. Title & Tags
    theme_name = THEME_NAMES.get(theme_slug, theme_slug.title())
    theme_counters[theme_slug] = theme_counters.get(theme_slug, 0) + 1
    cnt = theme_counters[theme_slug]
    
    if override_title:
        title = override_title
        tags = override_tags
    else:
        # Check if descriptive filename
        if not file_name.startswith('Fregoro_Studios_Extend_the_existing_background_into_the_empty_'):
            cleaned = clean_filename_title(file_name)
            if len(cleaned) >= 4 and cleaned.lower() not in ['vertical', 'horizontal', 'cinematic']:
                title = f"{cleaned}"
                tags = [w.lower() for w in re.split(r'\s+', cleaned) if len(w) > 2] + [theme_slug, 'poster', 'wall art']
            else:
                idx_th = thematic_indices.get(theme_slug, 0)
                thematic_indices[theme_slug] = idx_th + 1
                pool = THEMATIC_TITLES.get(theme_slug, [f"{theme_name} Artwork"])
                title = pool[idx_th % len(pool)]
                tags = [theme_slug, 'wall art', 'poster', 'cinematic']
        else:
            idx_th = thematic_indices.get(theme_slug, 0)
            thematic_indices[theme_slug] = idx_th + 1
            pool = THEMATIC_TITLES.get(theme_slug, [f"{theme_name} Artwork"])
            title = pool[idx_th % len(pool)]
            tags = [theme_slug, 'wall art', 'poster', 'cinematic', 'fine art']

    # Slug
    clean_slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-') + f"-{cnt:02d}"
    art_id = f"art-{theme_slug[:3]}-{cnt:02d}"
    
    # Dominant color
    dom_color, sec_color, brightness, mood = get_color_info(full_path)
    
    # Prices
    price = 499 if is_split_compatible else 199
    
    artworks.append({
        'id': art_id,
        'slug': clean_slug,
        'title': title,
        'themeSlug': theme_slug,
        'category': 'split' if is_split_compatible else ('character' if theme_slug in ['marvel', 'dc', 'anime', 'actress', 'ben-10'] else 'scene'),
        'tags': list(set(tags + [theme_slug])),
        'orientation': orientation,
        'availableSizes': ['A3', 'A4', 'A5', 'A6', '13x19'],
        'productType': product_type,
        'isSplitCompatible': is_split_compatible,
        'heroCompatible': True,
        'supportCompatible': not is_split_compatible,
        'dominantColor': dom_color,
        'secondaryColor': sec_color,
        'brightness': brightness,
        'mood': mood,
        'imageUrl': f"/Posters/{file_name}",
        'thumbnailUrl': f"/Posters/{file_name}",
        'price': price,
        'featured': cnt <= 3,
    })

print(f"Generated {len(artworks)} rich PosterArtworkData entries!")

# Build TypeScript for lib/wall-studio/artworks-data.ts
ts_artworks = f"""import type {{ PosterArtworkData }} from './types';

/**
 * 369 CURATED HIGH-DEFINITION POSTER ARTWORKS & SPLIT PANELS
 *
 * Sourced directly from local high-resolution print masters in /Posters/.
 * Categorized across 20 definitive customer themes:
 * 1. Actress, 2. Anime, 3. Ben 10, 4. Bikes, 5. Breaking Bad, 6. Cars,
 * 7. Cricket, 8. Cute Photos, 9. DC, 10. Disney, 11. F1, 12. Football,
 * 13. Game Of Thrones, 14. Gamers, 15. Interstellar, 16. Kollywood,
 * 17. Marvel, 18. Music, 19. Netflix Series, 20. Scooby Doo.
 *
 * Full support for 5:7 (vertical), 7:5 (horizontal), 19:11 (3-stepped split),
 * 44:21 (5-stepped split), 17:8 / 2:1 (classic split), 4:17 (vertical split),
 * 17:16 (grid split), and A3, A4, A5, A6, 13x19 single prints.
 */

export const FREGORO_ARTWORKS: PosterArtworkData[] = {json.dumps(artworks, indent=2)};

export function getArtworkById(idOrSlug: string): PosterArtworkData | undefined {{
  return FREGORO_ARTWORKS.find((a) => a.id === idOrSlug || a.slug === idOrSlug);
}}

export function getArtworksByTheme(themeSlug: string): PosterArtworkData[] {{
  if (!themeSlug || themeSlug === 'all') return FREGORO_ARTWORKS;
  return FREGORO_ARTWORKS.filter((a) => a.themeSlug === themeSlug);
}}

export function getSplitCompatibleArtworks(): PosterArtworkData[] {{
  return FREGORO_ARTWORKS.filter((a) => a.isSplitCompatible);
}}

export function searchArtworks(query: string, themeSlug?: string): PosterArtworkData[] {{
  let list = [...FREGORO_ARTWORKS];
  if (themeSlug && themeSlug !== 'all') {{
    list = list.filter((a) => a.themeSlug === themeSlug);
  }}
  if (!query) return list;
  const q = query.toLowerCase().trim();
  return list.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.tags.some((t) => t.toLowerCase().includes(q)) ||
      a.category.toLowerCase().includes(q) ||
      a.themeSlug.toLowerCase().includes(q),
  );
}}
"""

with open(r'd:\Webites\StarBy\lib\wall-studio\artworks-data.ts', 'w', encoding='utf-8') as f:
    f.write(ts_artworks)

print("[OK] Successfully written lib/wall-studio/artworks-data.ts")

# 20 THEMES SPECIFICATION
THEMES = [
    {
        'id': 'theme-actress',
        'slug': 'actress',
        'name': 'Actress',
        'tagline': 'Cinematic radiance & timeless portraits.',
        'description': 'Editorial glamour, high-fashion captures, and iconic celebrity fine-art photography.',
        'accentColor': '#EC4899',
        'gradient': 'linear-gradient(135deg, #1C0814 0%, #EC4899 100%)',
        'previewImage': '/Posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_ef9c2920-e7ec-4d5d-8ef9-638716a339a0_3.webp',
        'featured': True,
        'sortOrder': 1,
    },
    {
        'id': 'theme-anime',
        'slug': 'anime',
        'name': 'Anime',
        'tagline': 'Shonen fury & Tokyo nocturnal aesthetics.',
        'description': 'Katana choreography, stylized manga ink, Saiyan power auras, and Demon Slayer elements.',
        'accentColor': '#FF3366',
        'gradient': 'linear-gradient(135deg, #1C0A14 0%, #FF3366 100%)',
        'previewImage': '/Posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_c054f7e5-5ed5-453d-8f54-8497cff5c7f5_3.webp',
        'featured': True,
        'sortOrder': 2,
    },
    {
        'id': 'theme-ben-10',
        'slug': 'ben-10',
        'name': 'Ben 10',
        'tagline': 'Omnitrix extraterrestrial heroics.',
        'description': 'Alien Force evolutions, Galvanic nanites, and classic Heatblast & Diamondhead transformations.',
        'accentColor': '#00FF66',
        'gradient': 'linear-gradient(135deg, #051A0B 0%, #00FF66 100%)',
        'previewImage': '/Posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_0ed50979-4868-430c-a342-82ab9cf1965e_3.webp',
        'featured': True,
        'sortOrder': 3,
    },
    {
        'id': 'theme-bikes',
        'slug': 'bikes',
        'name': 'Bikes',
        'tagline': 'Apex lean, MotoGP legends & velocity.',
        'description': 'Valentino Rossi 46, Brad Binder KTM, Yamaha YZF-R1 wheelies, and track day apex machines.',
        'accentColor': '#FF6600',
        'gradient': 'linear-gradient(135deg, #1A0D04 0%, #FF6600 100%)',
        'previewImage': '/Posters/3 Split Poster.webp',
        'featured': True,
        'sortOrder': 4,
    },
    {
        'id': 'theme-breaking-bad',
        'slug': 'breaking-bad',
        'name': 'Breaking Bad',
        'tagline': 'Albuquerque blue & the Heisenberg empire.',
        'description': 'Cinematic 4K Heisenberg silhouettes, chemical periodic typography, and iconic desert scenes.',
        'accentColor': '#00A86B',
        'gradient': 'linear-gradient(135deg, #04140D 0%, #00A86B 100%)',
        'previewImage': '/Posters/Fregoro_Studios_Breaking_bad_poster__Heisenberg_4k__cinematic_04f519ad-fef4-4a0a-89f3-fbd338b6a00f_0.webp',
        'featured': True,
        'sortOrder': 5,
    },
    {
        'id': 'theme-cars',
        'slug': 'cars',
        'name': 'Cars',
        'tagline': 'Pure automotive sculpture & smoke drifts.',
        'description': 'Toyota Supra MK4, JDM legends, American muscle, and track-focused supercar aerodynamics.',
        'accentColor': '#E10600',
        'gradient': 'linear-gradient(135deg, #1A0D0D 0%, #E10600 100%)',
        'previewImage': '/Posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_3d45351d-0d64-4e6c-91eb-a97f774dea00_2.webp',
        'featured': True,
        'sortOrder': 6,
    },
    {
        'id': 'theme-cricket',
        'slug': 'cricket',
        'name': 'Cricket',
        'tagline': 'Cover drives, yorkers & stadium roar.',
        'description': 'Classic willow strikes, roaring stadium floodlights, and timeless captaincy triumphs.',
        'accentColor': '#1E88E5',
        'gradient': 'linear-gradient(135deg, #08111A 0%, #1E88E5 100%)',
        'previewImage': '/Posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_7611c4e0-5e52-41da-b574-13e5d5494c5a_3.webp',
        'featured': True,
        'sortOrder': 7,
    },
    {
        'id': 'theme-cute-photos',
        'slug': 'cute-photos',
        'name': 'Cute Photos',
        'tagline': 'Heartwarming moments & playful companions.',
        'description': 'Golden retrievers, cozy kittens, candid polaroids, and warm uplifting animal portraiture.',
        'accentColor': '#F472B6',
        'gradient': 'linear-gradient(135deg, #1A0D15 0%, #F472B6 100%)',
        'previewImage': '/Posters/Fregoro_Studios_Cute_golden_retriever_and_doberman_playing_toge_02929b18-72f6-420d-926c-27494867aed6.webp',
        'featured': False,
        'sortOrder': 8,
    },
    {
        'id': 'theme-dc',
        'slug': 'dc',
        'name': 'DC',
        'tagline': 'Shadows, titans & Gotham noir.',
        'description': 'Dark Knight silhouettes, Snyder Cut mosaics, Metropolis sunrises, and Arkham asylum chaos.',
        'accentColor': '#0047BA',
        'gradient': 'linear-gradient(135deg, #050A14 0%, #0047BA 100%)',
        'previewImage': '/Posters/Fregoro_Studios_Hyper_realistic_live_action_Batman_in_a_grounde_bf178dca-168c-46e9-8095-9a28417bb7d0.webp',
        'featured': True,
        'sortOrder': 9,
    },
    {
        'id': 'theme-disney',
        'slug': 'disney',
        'name': 'Disney',
        'tagline': 'Timeless animation & enchanted worlds.',
        'description': 'Classic fairytale starlight, Cinderella castles, and cherished vintage animation nostalgia.',
        'accentColor': '#3B82F6',
        'gradient': 'linear-gradient(135deg, #070F1A 0%, #3B82F6 100%)',
        'previewImage': '/Posters/Fregoro_Studios_httpss.mj.run2nxmw9ehuZw_Vertical_playful_selfi_59c30736-4344-42fd-955b-7d6dd9c510f6.webp',
        'featured': False,
        'sortOrder': 10,
    },
    {
        'id': 'theme-f1',
        'slug': 'f1',
        'name': 'Formula 1',
        'tagline': 'Velocity, telemetry & world champions.',
        'description': 'Max Verstappen 33, McLaren papaya apexes, Monaco street sweeps, and monolith aero sculpture.',
        'accentColor': '#FF1801',
        'gradient': 'linear-gradient(135deg, #140505 0%, #FF1801 100%)',
        'previewImage': '/Posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_6ab69d04-87e0-44e5-81be-be7a90302496_3.webp',
        'featured': True,
        'sortOrder': 11,
    },
    {
        'id': 'theme-football',
        'slug': 'football',
        'name': 'Football',
        'tagline': 'The beautiful game under stadium lights.',
        'description': 'Cristiano Ronaldo, Neymar Jr, Champions League scissor kicks, and stadium floodlight roars.',
        'accentColor': '#10B981',
        'gradient': 'linear-gradient(135deg, #04140D 0%, #10B981 100%)',
        'previewImage': '/Posters/Ronaldo_ The Iconic Football Legend.webp',
        'featured': True,
        'sortOrder': 12,
    },
    {
        'id': 'theme-game-of-thrones',
        'slug': 'game-of-thrones',
        'name': 'Game Of Thrones',
        'tagline': 'Fire, blood & the Iron Throne.',
        'description': 'Drogon dragon fire, Winterfell direwolves, House Targaryen sigils, and Night King blizzards.',
        'accentColor': '#D97706',
        'gradient': 'linear-gradient(135deg, #170E04 0%, #D97706 100%)',
        'previewImage': '/Posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_589b1ee8-6839-46cf-85e0-d063de25f709_3.webp',
        'featured': False,
        'sortOrder': 13,
    },
    {
        'id': 'theme-gamers',
        'slug': 'gamers',
        'name': 'Gamers',
        'tagline': 'Immersive sagas & cybernetic battlegrounds.',
        'description': 'Simon Ghost Riley, Arthur Morgan, Night City netrunners, Elden Ring, and Valorant aces.',
        'accentColor': '#8B5CF6',
        'gradient': 'linear-gradient(135deg, #110B1F 0%, #8B5CF6 100%)',
        'previewImage': '/Posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_f0134bff-f4ac-4ae8-89ff-3ce9931423a3_3.webp',
        'featured': True,
        'sortOrder': 14,
    },
    {
        'id': 'theme-interstellar',
        'slug': 'interstellar',
        'name': 'Interstellar',
        'tagline': 'Gargantua horizons & cosmic relativity.',
        'description': 'Singularity accretion disks, Endurance spacecraft orbits, and deep-space quantum tesseracts.',
        'accentColor': '#6366F1',
        'gradient': 'linear-gradient(135deg, #0C0D21 0%, #6366F1 100%)',
        'previewImage': '/Posters/Fregoro_Studios_httpss.mj.runEjNnDUIpLVc_Horizontal_widescreen__6d115fe0-69c6-4498-ad71-192034c6dada.webp',
        'featured': True,
        'sortOrder': 15,
    },
    {
        'id': 'theme-kollywood',
        'slug': 'kollywood',
        'name': 'Kollywood',
        'tagline': 'Mass cinema & heroic silhouettes.',
        'description': 'Thalapathy Vijay Leo, Superstar Rajinikanth Jailer, Kamal Haasan Vikram, and K-town mass aura.',
        'accentColor': '#F59E0B',
        'gradient': 'linear-gradient(135deg, #1A1205 0%, #F59E0B 100%)',
        'previewImage': '/Posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_0467d325-ba0b-418b-ab83-3bf9bf5366c3_3.webp',
        'featured': True,
        'sortOrder': 16,
    },
    {
        'id': 'theme-marvel',
        'slug': 'marvel',
        'name': 'Marvel',
        'tagline': 'Earth’s mightiest cinematic & multiverse heroes.',
        'description': 'Spider-Man, Venom symbiotes, Doctor Doom Secret Wars, Iron Man Mark LXXXV, and Moon Knight.',
        'accentColor': '#E62429',
        'gradient': 'linear-gradient(135deg, #1C0A0A 0%, #E62429 100%)',
        'previewImage': '/Posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_14b9a2cc-0d91-43f3-a299-36b138754a76_3.webp',
        'featured': True,
        'sortOrder': 17,
    },
    {
        'id': 'theme-music',
        'slug': 'music',
        'name': 'Music',
        'tagline': 'Vinyl, stage smoke & sonic legends.',
        'description': 'N.W.A Straight Outta Compton, analog synthesizer waveforms, and timeless rock & hip-hop vinyl art.',
        'accentColor': '#A855F7',
        'gradient': 'linear-gradient(135deg, #140717 0%, #A855F7 100%)',
        'previewImage': '/Posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_555c7e77-26be-4c91-a2d2-0490194489c4_3.webp',
        'featured': True,
        'sortOrder': 18,
    },
    {
        'id': 'theme-netflix-series',
        'slug': 'netflix-series',
        'name': 'Netflix Series',
        'tagline': 'Binge-worthy sagas & gritty prestige noir.',
        'description': 'Thomas Shelby Peaky Blinders, crimson cigarette smoke, dystopian backdrops, and binge icons.',
        'accentColor': '#E50914',
        'gradient': 'linear-gradient(135deg, #1A0405 0%, #E50914 100%)',
        'previewImage': '/Posters/Fregoro_Studios_Extend_the_existing_background_into_the_empty_c500f4a2-3ca8-471c-86fb-5b78ea8ecc81_3.webp',
        'featured': True,
        'sortOrder': 19,
    },
    {
        'id': 'theme-scooby-doo',
        'slug': 'scooby-doo',
        'name': 'Scooby Doo',
        'tagline': 'Mystery Inc, Scooby Snacks & spooky sleuths.',
        'description': 'Scooby-Doo, Shaggy, Velma, Fred, Daphne, and the iconic Mystery Machine vintage illustrations.',
        'accentColor': '#06B6D4',
        'gradient': 'linear-gradient(135deg, #051417 0%, #06B6D4 100%)',
        'previewImage': '/Posters/Fregoro_Studios_Vertical_full_body_portrait_Scooby_Doo_and_yout_210dfc1f-5099-44c8-9dc8-e09f924c1498.webp',
        'featured': True,
        'sortOrder': 20,
    },
]

ts_themes = f"""import type {{ WallThemeData }} from './types';

/**
 * 20 CURATED FREGORO WALL THEMES
 *
 * Exactly aligned with print catalog categories:
 * 1. Actress, 2. Anime, 3. Ben 10, 4. Bikes, 5. Breaking Bad, 6. Cars,
 * 7. Cricket, 8. Cute Photos, 9. DC, 10. Disney, 11. F1, 12. Football,
 * 13. Game Of Thrones, 14. Gamers, 15. Interstellar, 16. Kollywood,
 * 17. Marvel, 18. Music, 19. Netflix Series, 20. Scooby Doo.
 */

export const FREGORO_THEMES: WallThemeData[] = {json.dumps(THEMES, indent=2)};

export function getThemeBySlug(slug: string): WallThemeData | undefined {{
  return FREGORO_THEMES.find((t) => t.slug === slug);
}}

export function getFeaturedThemes(): WallThemeData[] {{
  return FREGORO_THEMES.filter((t) => t.featured);
}}
"""

with open(r'd:\Webites\StarBy\lib\wall-studio\themes-data.ts', 'w', encoding='utf-8') as f:
    f.write(ts_themes)

print("[OK] Successfully written lib/wall-studio/themes-data.ts")
