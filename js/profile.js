//Loads profile data and handles errors.=======================================================

async function initProfile() {
  try {
    await fetchProfile();
  } catch (err) {
    console.error("❌ Error during initial load:", err);
  }
}

//Handles friend add/remove logic.=============================================================

function initFriendActions() {
  const myId = getUserIdFromToken();
  const viewedId = getUserIdFromUrl() || myId;
  const profileUserId = viewedId;

  checkFriendStatus(profileUserId);

  document.getElementById('removeFriendBtn')?.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to remove this friend?')) return;

    try {
      const res = await fetchWithAuth(`${API_BASE}/friends/remove/${profileUserId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        alert('Friend removed');
        location.reload();
      } else {
        const err = await res.json();
        alert('Failed: ' + err.error);
      }
    } catch (err) {
      console.error('❌ Error removing friend:', err);
      alert('Something went wrong.');
    }
  });

  // Manual friend request
  if (String(myId) === String(profileUserId)) {
    const modal = document.getElementById("addFriendModal");
    const closeBtn = document.getElementById("closeModalBtn");
    const submitBtn = document.getElementById("submitFriendRequest");

    closeBtn?.addEventListener('click', () => modal.style.display = "none");

    submitBtn?.addEventListener('click', async () => {
      const input = document.getElementById("manualFriendId");
      const friendId = input.value.trim();

      if (!friendId || isNaN(friendId) || friendId === String(myId)) {
        alert("Please enter a valid user ID.");
        return;
      }

      try {
        const res = await fetchWithAuth(`${API_BASE}/friends/${friendId}`, {
          method: 'POST',
        });

        if (res.ok) {
          alert("✅ Friend added!");
          modal.style.display = "none";
          input.value = "";
          loadFriends();
        } else {
          const err = await res.json();
          alert("❌ Failed: " + err.error);
        }
      } catch (err) {
        console.error('❌ Failed to send manual friend request:', err);
        alert("Something went wrong.");
      }
    });
  }
}

//Handles open/close/submit for party creation.================================================

function initPartyUI() {
  document.getElementById("createPartyBtn")?.addEventListener('click', openCreatePartyModal);
  document.getElementById("closeCreatePartyModal")?.addEventListener('click', closeCreatePartyModal);
  document.getElementById("submitCreatePartyBtn")?.addEventListener('click', submitCreateParty);
}
