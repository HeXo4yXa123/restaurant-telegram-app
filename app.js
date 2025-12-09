// Telegram Web App SDK
let tg = null;
let userData = null;

// Конфигурация сервера
const SERVER_URL = "https://ВАШ_ЛОГИН.pythonanywhere.com";

// Режим приложения
let appMode = 'customer'; // 'customer' или 'manager'
const MANAGER_PASSWORD = "admin123"; // Пароль для входа менеджера

// База данных продуктов
const products = [
    // ... (ваши продукты без изменений)
];

// Корзина
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Инициализация приложения
function initApp() {
    // Инициализируем Telegram Web App
    initTelegramWebApp();
    
    // Проверяем, не в режиме ли менеджера
    const savedMode = localStorage.getItem('appMode');
    if (savedMode === 'manager') {
        appMode = 'manager';
        showManagerPanel();
    } else {
        showCustomerPanel();
    }
    
    setupEventListeners();
}

// Показать панель клиента
function showCustomerPanel() {
    document.getElementById('customerPanel').style.display = 'block';
    document.getElementById('managerPanel').style.display = 'none';
    document.getElementById('loginPanel').style.display = 'none';
    
    renderProducts();
    updateCartCount();
}

// Показать панель менеджера
function showManagerPanel() {
    document.getElementById('customerPanel').style.display = 'none';
    document.getElementById('managerPanel').style.display = 'block';
    document.getElementById('loginPanel').style.display = 'none';
    
    // Загружаем заказы
    loadManagerOrders();
}

// Показать панель входа
function showLoginPanel() {
    document.getElementById('customerPanel').style.display = 'none';
    document.getElementById('managerPanel').style.display = 'none';
    document.getElementById('loginPanel').style.display = 'block';
}

// Загрузка заказов для менеджера
async function loadManagerOrders() {
    try {
        showNotification("📊 Загружаю заказы...");
        
        const response = await fetch(`${SERVER_URL}/get_orders`);
        const result = await response.json();
        
        if (result.success) {
            renderManagerOrders(result.orders);
        } else {
            showNotification("❌ Ошибка загрузки заказов");
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showNotification("❌ Нет связи с сервером");
    }
}

// Рендеринг заказов для менеджера
function renderManagerOrders(orders) {
    const ordersGrid = document.getElementById('managerOrdersGrid');
    if (!ordersGrid) return;
    
    if (!orders || orders.length === 0) {
        ordersGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <p>Нет заказов</p>
            </div>
        `;
        return;
    }
    
    // Сортируем по дате (новые сверху)
    orders.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    ordersGrid.innerHTML = orders.map(order => {
        // Определяем цвет статуса
        let statusColor = '#ff6b6b';
        let statusIcon = '⏳';
        
        switch(order.status) {
            case 'new':
                statusColor = '#ff6b6b';
                statusIcon = '🆕';
                break;
            case 'accepted':
                statusColor = '#4ecdc4';
                statusIcon = '👨‍🍳';
                break;
            case 'cooking':
                statusColor = '#ffd166';
                statusIcon = '🍳';
                break;
            case 'ready':
                statusColor = '#06d6a0';
                statusIcon = '✅';
                break;
            case 'delivering':
                statusColor = '#118ab2';
                statusIcon = '🛵';
                break;
            case 'completed':
                statusColor = '#6c757d';
                statusIcon = '📦';
                break;
        }
        
        return `
            <div class="order-card" data-id="${order.id}">
                <div class="order-header">
                    <div class="order-id">${statusIcon} Заказ ${order.id}</div>
                    <div class="order-time">${formatTime(order.date)}</div>
                </div>
                
                <div class="order-customer">
                    <i class="fas fa-user"></i>
                    <span>${order.customer}</span>
                    <a href="tel:${order.phone}" class="phone-link">
                        <i class="fas fa-phone"></i> ${order.phone}
                    </a>
                </div>
                
                <div class="order-address">
                    <i class="fas fa-map-marker-alt"></i>
                    ${order.address}
                </div>
                
                <div class="order-items">
                    <strong>Заказ:</strong> ${order.items}
                </div>
                
                <div class="order-footer">
                    <div class="order-total">${order.total} ₽</div>
                    <div class="order-status" style="background: ${statusColor}">
                        ${getStatusText(order.status)}
                    </div>
                </div>
                
                <div class="order-actions">
                    ${order.status === 'new' ? `
                        <button class="action-btn accept-btn" onclick="updateOrderStatus('${order.id}', 'accepted')">
                            <i class="fas fa-check"></i> Принять
                        </button>
                        <button class="action-btn reject-btn" onclick="updateOrderStatus('${order.id}', 'rejected')">
                            <i class="fas fa-times"></i> Отклонить
                        </button>
                    ` : ''}
                    
                    ${order.status === 'accepted' ? `
                        <button class="action-btn cooking-btn" onclick="updateOrderStatus('${order.id}', 'cooking')">
                            <i class="fas fa-utensils"></i> Готовить
                        </button>
                    ` : ''}
                    
                    ${order.status === 'cooking' ? `
                        <button class="action-btn ready-btn" onclick="updateOrderStatus('${order.id}', 'ready')">
                            <i class="fas fa-check-circle"></i> Готово
                        </button>
                    ` : ''}
                    
                    ${order.status === 'ready' ? `
                        <button class="action-btn delivering-btn" onclick="updateOrderStatus('${order.id}', 'delivering')">
                            <i class="fas fa-motorcycle"></i> В доставку
                        </button>
                    ` : ''}
                    
                    ${order.status === 'delivering' ? `
                        <button class="action-btn complete-btn" onclick="updateOrderStatus('${order.id}', 'completed')">
                            <i class="fas fa-flag-checkered"></i> Доставлен
                        </button>
                    ` : ''}
                    
                    <button class="action-btn call-btn" onclick="callCustomer('${order.phone}')">
                        <i class="fas fa-phone"></i> Позвонить
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Обновление статуса заказа
async function updateOrderStatus(orderId, newStatus) {
    try {
        showNotification("🔄 Обновляю статус...");
        
        const response = await fetch(`${SERVER_URL}/update_order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                order_id: orderId,
                status: newStatus
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification("✅ Статус обновлен");
            loadManagerOrders(); // Перезагружаем список
        } else {
            showNotification("❌ Ошибка обновления");
        }
    } catch (error) {
        showNotification("❌ Ошибка сети");
    }
}

// Звонок клиенту
function callCustomer(phone) {
    window.open(`tel:${phone}`);
}

// Вход менеджера
function loginAsManager() {
    const passwordInput = document.getElementById('managerPassword');
    const password = passwordInput.value.trim();
    
    if (password === MANAGER_PASSWORD) {
        appMode = 'manager';
        localStorage.setItem('appMode', 'manager');
        showManagerPanel();
        showNotification("👨‍💼 Режим менеджера активирован");
    } else {
        showNotification("❌ Неверный пароль");
        passwordInput.value = '';
        passwordInput.focus();
    }
}

// Выход менеджера
function logoutManager() {
    appMode = 'customer';
    localStorage.removeItem('appMode');
    showCustomerPanel();
    showNotification("👋 Вышел из режима менеджера");
}

// Вспомогательные функции
function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

function getStatusText(status) {
    const statuses = {
        'new': 'Новый',
        'accepted': 'Принят',
        'cooking': 'Готовится',
        'ready': 'Готов',
        'delivering': 'В пути',
        'completed': 'Завершен',
        'rejected': 'Отклонен'
    };
    return statuses[status] || status;
}

// Остальной код (addToCart, updateCart и т.д.) остается без изменений
// ...
