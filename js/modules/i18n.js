// Language and translation management
export const translations = {
  sv: {
    intro:
      "Vi har ett brett utbud av sällskapsspel här på Pinchos Linnégatan (eller vi aspirerar i alla fall att ha det). Om du ser något du gillar så beställ det till bordet i appen eller prata med vår personal så tar vi fram det åt dig!",
    ui: {
      players: "Spelare",
      play_time: "Tid",
      age: "Ålder"
    },
    categories: {
      all: "Alla",
      strategy: "Strategi",
      family: "Familj",
      party: "Party",
      social: "Socialt",
      humor: "Humor",
      card: "Kortspel",
      "2p": "2 spelare",
      quick: "Medan du väntar på maten"
    }
  },
  en: {
    intro:
      "We have a wide range of board games here at Pinchos Linnégatan (or at least we aspire to). If you see something you like, order it to the table in the app or talk to our staff and we'll bring it to you!",
    ui: {
      players: "Players",
      play_time: "Time",
      age: "Age"
    },
    categories: {
      all: "All",
      strategy: "Strategy",
      family: "Family",
      party: "Party",
      social: "Social",
      humor: "Humor",
      card: "Card game",
      "2p": "2 players",      
      quick: "While you wait for your food"
    }
  }
};

let currentLang = 'en';
let currentCategory = 'all';

export function setLanguage(lang) {
  currentLang = lang;
  currentCategory = 'all';
  return currentLang;
}

// Alias for setLanguage to maintain compatibility
export const setCurrentLang = setLanguage;

export function getCurrentLang() {
  return currentLang;
}

export function getCurrentCategory() {
  return currentCategory;
}

export function setCurrentCategory(category) {
  currentCategory = category;
}

export function getTranslation(key) {
  const keys = key.split('.');
  let value = translations[currentLang];
  for (const k of keys) {
    value = value[k];
    if (!value) return key;
  }
  return value;
} 