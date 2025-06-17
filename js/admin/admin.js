import { checkAuth, getAccessToken } from '../modules/auth.js';
import { fetchStats } from '../modules/stats.js';
import { fetchOrders, completeOrder, clearAllOrders } from '../modules/orders.js';
import { initPixelNav, updateNotificationIcon, goTo } from '../shared/shared-ui.js';

// Initialize the admin dashboard
(async function () {
    if (!await checkAuth()) return;
})();

// Initialize the dashboard when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    // Initialize shared UI components
    initPixelNav();
    updateNotificationIcon();
    setInterval(updateNotificationIcon, 60000);
    
    // Initialize dashboard data
    fetchStats();
    fetchOrders();
    setInterval(fetchOrders, 5000);
    
    // Modal click-to-close functionality
    window.addEventListener('click', (e) => {
        document.querySelectorAll('.modal').forEach((modal) => {
            if (e.target === modal && getComputedStyle(modal).display !== 'none') {
                modal.style.display = 'none';
            }
        });
    });
});

// Make functions available globally for onclick handlers
window.completeOrder = completeOrder;
window.clearAllOrders = clearAllOrders;
window.goTo = goTo; 