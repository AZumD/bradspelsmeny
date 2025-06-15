//Handles pixelnav and notification refresh.====================================================

function initSharedUI() {
  initPixelNav();
  updateNotificationIcon();
  setInterval(updateNotificationIcon, 60000);
}

//Close buttons for both badge popups.==========================================================

function initBadgeModals() {
  document.getElementById("closeBadgePopup")?.addEventListener('click', () => {
    document.getElementById("badgePopup").style.display = "none";
  });

  document.getElementById("closeBadgeInfoBtn")?.addEventListener('click', () => {
    const modal = document.getElementById("badgeInfoModal");
    if (modal) modal.style.display = "none";
  });
}

//Notification modal open/close toggle.=========================================================

function initNotificationModal() {
  const notifBtn = document.getElementById("notificationIcon");
  const notifModal = document.getElementById("notificationModal");
  const closeNotifBtn = document.getElementById("closeNotificationBtn");

  if (notifBtn && notifModal && closeNotifBtn) {
    notifBtn.addEventListener('click', () => {
      notifModal.style.display = notifModal.style.display === 'flex' ? 'none' : 'flex';
      fetchNotifications();
    });

    closeNotifBtn.addEventListener('click', () => {
      notifModal.style.display = 'none';
    });
  }
}
