  document.addEventListener("DOMContentLoaded", () => {
    initPixelNav();
    updateNotificationIcon();

    const notifIcon = document.getElementById('notificationIcon');
    if (notifIcon) {
      notifIcon.addEventListener('click', () => {
        const modal = document.getElementById('notificationModal');
        if (modal) {
          modal.style.display = modal.style.display === 'none' ? 'block' : 'none';
          fetchNotifications();
        }
      });
    }

    document.getElementById('closeNotificationBtn')?.addEventListener('click', () => {
      document.getElementById('notificationModal').style.display = 'none';
    });
  });
