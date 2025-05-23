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
    img: "https://smartpress.imgix.net/resources/offering_images/playing_cards_3qtr_resting_front_cp_grandier-20240226_135448636.jpg",
    rules: "https://blogs.glowscotland.org.uk/re/public/west/uploads/sites/2327/2019/02/Card-Games.pdf"
  },
  {
    title: { sv: "Motståndsrörelsen", en: "The Resistance" },
    description: {
      sv: "Ett socialt bluffspel där du aldrig kan lita på någon.",
      en: "A social deduction game of trust and betrayal."
    },
    players: "5–10",
    time: "30 min",
    age: "13+",
    tags: ["social", "party"],
    img: "https://www.worldofboardgames.com/product_images/11041-1-L.jpg",
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
    img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFjZG9j6DfeHVOeSi2AhTakJuyTLzgCox4TQ&s",
    rules: "https://cdn.1j1ju.com/medias/2b/62/72-equinox-rulebook.pdf"
  }
];
