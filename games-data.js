const translations = {
  sv: {
    intro: "Vi har ett brett utbud av sällskapsspel här på Pinchos Linnégatan (eller vi aspirerar i alla fall att ha det). Om du ser något du gillar, prata med vår personal så tar vi fram det åt dig! (Det är 16+ som gäller för alla spelutlåningar då vi är väldigt rädda om dem, och vi behöver ett ID i pant)",
    categories: {
      all: "Alla Spel",
      party: "Partyspel",
      strategy: "Strategispel",
      social: "Sociala Spel",
      "2p": "För 2 Spelare",
      family: "Familjevänliga"
    },
    ui: {
      categoryTitle: "Kategorier",
      players: "Spelare",
      time: "Tid",
      age: "Ålder"
    }
  },
  en: {
    intro: "We have a wide range of board games here at Pinchos Linnégatan (or at least we aspire to). If you see something you like, talk to our staff and we'll bring it to you! (A 16+ age limit applies to all board games and we require an ID as a deposit during the play time)",
    categories: {
      all: "All Games",
      party: "Party Games",
      strategy: "Strategy",
      social: "Social Deduction",
      "2p": "2 Player Friendly",
      family: "Family Friendly"
    },
    ui: {
      categoryTitle: "Categories",
      players: "Players",
      time: "Play time",
      age: "Age"
    }
  }
};
const games = [
  {
    title: { sv: "Kortlek", en: "Deck of cards" },
    description: {
      sv: "Varför göra det komplicerat? Självklart har vi även kortlekar.",
      en: "Why make it complicated?"
    },
    players: "1-?",
    time: "? min",
    age: "6+",
    tags: ["2p", "strategy", "family", "party"],
    img: "img/cards-pxl.webp",
    rules: "https://blogs.glowscotland.org.uk/re/public/west/uploads/sites/2327/2019/02/Card-Games.pdf"
  },
  {
    title: { sv: "The Resistance", en: "The Resistance" },
    description: {
      sv: "Ett socialt bluffspel där du aldrig kan lita på någon.",
      en: "A social deduction game of trust and betrayal."
    },
    players: "5–10",
    time: "30 min",
    age: "13+",
    tags: ["social", "party"],
    img: "img/the-resistance-pxl.webp",
    rules: "The Resistance Rulebook.pdf"
  },
  {
    title: { sv: "Equinox", en: "Equinox" },
    description: {
      sv: "Ett fantasifullt kortspel där mystiska varelser tävlar om att gå till historien.",
      en: "A whimsical game of mythical creatures competing for survival in legends."
    },
    players: "2–5",
    time: "45 min",
    age: "10+",
    tags: ["strategy", "family", "2p"],
    img: "img/equinox-pxl.webp",
    rules: "https://cdn.1j1ju.com/medias/2b/62/72-equinox-rulebook.pdf"
  },
{
  "title": { "sv": "Munchkin", "en": "Munchkin" },
  "description": {
    "sv": "Ett humoristiskt kortspel där du dödar monster och stjäl skatter.",
    "en": "A humorous card game where you kill monsters and steal treasures."
  },
  "players": "3–6",
  "time": "60–90 min",
  "age": "10+",
  "tags": ["humor", "fantasy", "card game"],
  "img": "img/munchkin-pxl.webp",
  "rules": "https://munchkin.game/site-munchkin/assets/files/1138/munchkin_rules-1.pdf"
},
{
  "title": { "sv": "The Resistance: Avalon", "en": "The Resistance: Avalon" },
  "description": {
    "sv": "Ett socialt bluffspel i Arthur-legenden där goda och onda kämpar om framtiden.",
    "en": "A social deduction game set in Arthurian legend where good and evil battle for the future."
  },
  "players": "5–10",
  "time": "30 min",
  "age": "13+",
  "tags": ["social", "deduction", "party"],
  "img": "img/avalon-pxl.webp",
  "rules": "https://avalon.fun/pdfs/rules.pdf"
},
{
  "title": { "sv": "Coup", "en": "Coup" },
  "description": {
    "sv": "Ett snabbt bluffspel där du försöker eliminera dina motståndare genom att manipulera och bedra.",
    "en": "A fast-paced bluffing game where you aim to eliminate opponents through manipulation and deceit."
  },
  "players": "2–6",
  "time": "15 min",
  "age": "14+",
  "tags": ["bluff", "strategy", "card game"],
  "img": "img/coup-pxl.webp",
  "rules": "https://boardgame.bg/coup%20rules%20pdf.pdf"
},
{
  "title": { "sv": "Exploding Kittens", "en": "Exploding Kittens" },
  "description": {
    "sv": "Ett snabbt och humoristiskt kortspel där du försöker undvika exploderande kattungar.",
    "en": "A fast and humorous card game where you try to avoid exploding kittens."
  },
  "players": "2–5",
  "time": "15 min",
  "age": "7+",
  "tags": ["party", "humor", "card game"],
  "img": "img/exploding-kittens-pxl.webp",
  "rules": "https://www.explodingkittens.com/pages/rules-kittens"
},
{
  "title": { "sv": "Exploding Kittens: Party Pack", "en": "Exploding Kittens: Party Pack" },
  "description": {
    "sv": "En utökad version av det populära spelet med plats för fler spelare.",
    "en": "An expanded version of the popular game accommodating more players."
  },
  "players": "2–10",
  "time": "15 min",
  "age": "7+",
  "tags": ["party", "humor", "card game"],
  "img": "img/exploding-kittens-party-pack-pxl.webp",
  "rules": "https://www.explodingkittens.com/pages/rules-kittens-party"
},
{
  "title": { "sv": "Exploding Kittens: NSFW Edition", "en": "Exploding Kittens: NSFW Edition" },
  "description": {
    "sv": "En vuxenversion av det populära spelet med olämpligt innehåll.",
    "en": "An adult version of the popular game with inappropriate content."
  },
  "players": "2–5",
  "time": "15 min",
  "age": "17+",
  "tags": ["party", "humor", "card game", "adult"],
  "img": "img/exploding-kittens-nsfw-pxl.webp",
  "rules": "https://www.explodingkittens.com/pages/rules-kittens"
},
{
  "title": { "sv": "Dead of Winter", "en": "Dead of Winter" },
  "description": {
    "sv": "Ett semi-kooperativt överlevnadsspel i en zombieapokalyps.",
    "en": "A semi-cooperative survival game set in a zombie apocalypse."
  },
  "players": "2–5",
  "time": "60–120 min",
  "age": "13+",
  "tags": ["strategy", "cooperative", "zombie"],
  "img": "img/dead-of-winter-pxl.webp",
  "rules": "https://images.plaidhatgames.com/filer_public/7b/70/7b703bbc-0c6f-44c1-8a45-5a317c1b8bd2/dead_of_winter_rulebook.pdf"
},
{
  "title": { "sv": "Alhambra", "en": "Alhambra" },
  "description": {
    "sv": "Ett strategiskt byggspel där du konstruerar din egen Alhambra.",
    "en": "A strategic building game where you construct your own Alhambra."
  },
  "players": "2–6",
  "time": "45–60 min",
  "age": "8+",
  "tags": ["strategy", "tile placement", "family"],
  "img": "img/alhambra-pxl.webp",
  "rules": "https://www.qworksgames.com/uploads/4/9/5/3/4953747/alhambra_rulebook.pdf"
},
{
  "title": { "sv": "Cards Against Muggles", "en": "Cards Against Muggles" },
  "description": {
    "sv": "Ett vuxet kortspel med Harry Potter-tema, fyllt med humor och referenser. (olicenserat, så inga pengar har gått till J.K. Rowling🏳️‍⚧️)",
    "en": "An adult card game with a Harry Potter theme, filled with humor and references. (unlicensed, no money went to J.K. Rowling making this🏳️‍⚧️)"
  },
  "players": "4–20",
  "time": "30–90 min",
  "age": "17+",
  "tags": ["party", "humor", "adult"],
  "img": "img/cards-against-muggles-pxl.webp",
  "rules": "https://familygameshelf.com/2023/08/22/how-to-play-cards-against-muggles/"
},
{
  "title": { "sv": "Fungi", "en": "Fungi" },
  "description": {
    "sv": "Ett tvåspelarspel där du samlar svampar i skogen för att laga läckra rätter.",
    "en": "A two-player game where you collect mushrooms in the forest to cook delicious meals."
  },
  "players": "2",
  "time": "30 min",
  "age": "10+",
  "tags": ["strategy", "card game", "nature"],
  "img": "img/fungi-pxl.webp",
  "rules": "https://lookout-spiele.de/media/pdf/49/f0/e2/fungi_en.pdf"
},
{
  "title": { "sv": "Codenames: Duet", "en": "Codenames Duet" },
  "description": {
    "sv": "Ett kooperativt ordspel där ni tillsammans försöker hitta alla agenter.",
    "en": "A cooperative word game where you work together to find all the agents."
  },
  "players": "2",
  "time": "15–30 min",
  "age": "11+",
  "tags": ["word game", "cooperative", "puzzle"],
  "img": "img/codenames-duet-pxl.webp",
  "rules": "https://czechgames.com/files/rules/codenames-duet-rules-en.pdf"
},
{
  "title": { "sv": "Love Letter", "en": "Love Letter" },
  "description": {
    "sv": "Ett snabbt kortspel där du försöker leverera ditt kärleksbrev till prinsessan.",
    "en": "A quick card game where you try to deliver your love letter to the princess."
  },
  "players": "2–4",
  "time": "20 min",
  "age": "10+",
  "tags": ["strategy", "card game", "romance"],
  "img": "img/love-letter-pxl.webp",
  "rules": "https://www.zmangames.com/en/products/love-letter/"
},
{
  "title": { "sv": "Scout", "en": "Scout" },
  "description": {
    "sv": "Ett smart kortspel där du inte kan byta ordning på din hand och måste fatta taktiska beslut.",
    "en": "A clever card game where you can't reorder your hand and must make tactical decisions."
  },
  "players": "2–5",
  "time": "20 min",
  "age": "9+",
  "tags": ["card game", "strategy", "tactical"],
  "img": "img/scout-pxl.webp",
  "rules": "https://boardgamegeek.com/filepage/226090/scout-english-rules"
},
{
  "title": { "sv": "Sriracha: Spelet", "en": "Sriracha: The Game" },
  "description": {
    "sv": "Ett snabbt kortspel inspirerat av den berömda heta såsen.",
    "en": "A fast-paced card game inspired by the famous hot sauce."
  },
  "players": "2–4",
  "time": "10–15 min",
  "age": "7+",
  "tags": ["party", "quick", "card game"],
  "img": "img/sriracha-pxl.webp",
  "rules": "https://www.srirachathegame.com/rules"
},
{
  "title": { "sv": "Zombie Fluxx", "en": "Zombie Fluxx" },
  "description": {
    "sv": "Ett kaotiskt kortspel där reglerna och målet ständigt förändras – nu med zombies!",
    "en": "A chaotic card game where the rules and goals constantly change – now with zombies!"
  },
  "players": "2–6",
  "time": "10–40 min",
  "age": "8+",
  "tags": ["party", "zombie", "chaotic"],
  "img": "img/zombie-fluxx-pxl.webp",
  "rules": "https://www.looneylabs.com/sites/default/files/literature/ZombieFluxx-Rules_0.pdf"
},
{
  "title": { "sv": "Nepo Babies", "en": "Nepo Babies" },
  "description": {
    "sv": "Ett satiriskt partyspel om kändisbarn och privilegier.",
    "en": "A satirical party game about celebrity kids and privilege."
  },
  "players": "3–6",
  "time": "20–45 min",
  "age": "17+",
  "tags": ["party", "humor", "adult", "satire"],
  "img": "img/nepo-babies-pxl.webp",
  "rules": "https://nepobabiesgame.com/pages/how-to-play"
},
{
  "title": { "sv": "Backgammon", "en": "Backgammon" },
  "description": {
    "sv": "Ett klassiskt strategispel för två spelare med rötter som sträcker sig tusentals år bakåt.",
    "en": "A classic strategy game for two players with roots going back thousands of years."
  },
  "players": "2",
  "time": "30–60 min",
  "age": "8+",
  "tags": ["classic", "strategy", "abstract"],
  "img": "img/backgammon-pxl.webp",
  "rules": "https://bkgm.com/rules.html"
},


];
