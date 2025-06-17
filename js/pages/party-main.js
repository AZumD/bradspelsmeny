import { initPixelNav, updateNotificationIcon } from '../shared/shared-ui.js';
import { fetchPartyData, fetchPartyMembers, fetchMessages, loadAllGames, fetchPartySessions } from '../modules/party-api.js';
import { updatePartyUI, renderMemberList, renderActiveSession } from '../modules/party-ui.js';
import { setAllGames, renderMessage, clearChat } from '../modules/party-chat.js';
import { setupMessageInput, setupInviteModal, setupGameModals, setupAutocomplete } from '../modules/party-events.js';

function getPartyIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

async function initPartyPage() {
  const partyId = getPartyIdFromURL();
  if (!partyId) {
    console.error('No party ID in URL');
    return;
  }

  try {
    // Load games for @mentions
    const games = await loadAllGames();
    setAllGames(games);

    // Load party data
    const partyData = await fetchPartyData(partyId);
    updatePartyUI(partyData);

    // Load members
    const members = await fetchPartyMembers(partyId);
    renderMemberList(members);

    // Load messages
    const messages = await fetchMessages(partyId);
    clearChat();
    messages.forEach(renderMessage);

    // Load active session
    const sessions = await fetchPartySessions(partyId);
    renderActiveSession(sessions.active);

    // Setup event handlers
    setupMessageInput(partyId);
    setupInviteModal(partyId);
    setupGameModals();
    setupAutocomplete();

  } catch (err) {
    console.error('Error initializing party page:', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initPixelNav();
  updateNotificationIcon();
  initPartyPage();
}); 