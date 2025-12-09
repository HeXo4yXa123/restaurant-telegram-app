// ===== КОНФИГУРАЦИЯ =====
const CONFIG = {
    SERVER_URL: "https://ВАШ_ЛОГИН.pythonanywhere.com", // ← ЗАМЕНИТЕ НА ВАШ URL!
    MANAGER_PASSWORD: "admin123",
    APP_VERSION: "1.0.0"
};

// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====
let tg = null;
let userData = null;
let appMode = 'customer';
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentStatusFilter = 'all';

// ===== ТЕСТОВЫЕ ТОВАРЫ =====
const PRODUCTS = [
    {id: 1, name: "Black Pizza", description: "Черное тесто, сыр, грибы", price: 590, category: "pizza", icon: "fas fa-pizza-slice"},
    {id: 2, name: "Green Pizza", description: "Авокадо, шпинат, козий сыр", price: 650, category: "pizza", icon: "fas fa-pizza-slice"},
    {id: 3, name: "Black Burger", description: "Черная булка, говядина", price: 450, category: "burger", icon: "fas fa-hamburger"},
    {id: 4, name: "Green Burger", description: "Курица, авокадо, салат", price: 420, category: "burger", icon: "fas fa-hamburger"},
    {id: 5, name: "Matcha Latte", description: "Зеленый чай матча", price: 280, category: "drink", icon: "fas fa-glass-whiskey"},
    {id: 6, name: "Black Coffee", description: "Эспрессо премиум", price: 220, category: "drink", icon: "fas fa-glass-whiskey"},
    {id: 7, name: "Black Forest", description: "Шоколадный торт", price: 320, category: "dessert", icon: "fas fa-ice-cream"},
    {id: 8, name: "Green Tea Cake", description: "Чизкейк с матчей", price: 290, category: "dessert", icon: "fas fa-ice-cream"}
];

// ===== ЗАГРУЗКА =====
document.addEventListener('DOMContentLoaded', function() {
    console.log(`🍽️ Black Green v${CONFIG.APP_VERSION}`);
    initApp();
});

function initApp() {
    initTelegram();
    setupEventListeners();
    checkSavedMode();
    renderProducts();
    updateCart();
    checkServer();
}

function initTelegram() {
    tg = window.Telegram?.WebApp;
    
    if (tg) {
        tg.ready();
        tg.expand();
        
        const user = tg.initDataUnsafe?.user;
        if (user) {
            userData = {
                id: user.id,
                name: user.first_name || user.username || 'Гость'
            };
            updateUserInfo(user);
        }
    } else {
        userData = {id: 999999, name: 'Гость'};
        console.log('⚠️ Режим тестирования (не в Telegram)');
    }
}

function updateUserInfo(user) {
    const welcome = document.getElementById('userWelcome');
    if (welcome) {
        welcome.innerHTML = `<i class="fas fa-user-circle"></i><span>Привет, ${user.first_name || 'Гость'}!</span>`;
    }
}

function checkSavedMode() {
    const saved = localStorage.getItem('appMode');
    if (saved === 'manager') {
        showManagerPanel();
    } else {
        showCustomerPanel();
    }
}

// ===== СОБЫТИЯ =====
function setupEventListeners() {
    // Кнопки режимов
    document.getElementById('managerSwitchBtn')?.addEventListener('click', showLoginPanel);
    document.getElementById('customerSwitchBtn')?.addEventListener('click', switchToCustomer);
    
    // Корзина
    document.getElementById('cartBtn')?.addEventListener('click', toggleCart);
    document.getElementById('closeCart')?.addEventListener('click', toggleCart);
    
    // Заказ
    document.getElementById('checkoutBtn')?.addEventListener('click', openOrderModal);
    document.getElementById('closeModal')?.addEventListener('click', closeOrderModal);
    document.getElementById('cancelOrder')?.addEventListener('click', closeOrderModal);
    document.getElementById('confirmOrder')?.addEventListener('click', confirmOrder);
    
    // Менеджер
    document.getElementById('refreshOrdersBtn')?.addEventListener('click', loadManagerOrders);
    
    // Фильтры
    document.querySelectorAll('.status-filter').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.status-filter').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentStatusFilter = this.dataset.status;
            loadManagerOrders();
        });
    });
    
    // Категории
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            renderProducts(this.dataset.category);
        });
    });
    
    // Фон
    document.getElementById('overlay')?.addEventListener('click', closeAll);
    
    // Динамические кнопки
    document.addEventListener('click', function(e) {
        // Добавить в корзину
        if (e.target.closest('.add-to-cart')) {
            const btn = e.target.closest('.add-to-cart');
            addToCart(parseInt(btn.dataset.id));
            btn.classList.add('add-animation');
            setTimeout(() => btn.classList.remove('add-animation'), 500);
        }
        
        // Удалить из корзины
        if (e.target.closest('.remove-item')) {
            const btn = e.target.closest('.remove-item');
            removeFromCart(parseInt(btn.dataset.id));
        }
        
        // Количество
        if (e.target.closest('.quantity-btn.decrease')) {
            const btn = e.target.closest('.quantity-btn');
            updateQuantity(parseInt(btn.dataset.id), -1);
        }
        
        if (e.target.closest('.quantity-btn.increase')) {
            const btn = e.target.closest('.quantity-btn');
            updateQuantity(parseInt(btn.dataset.id), 1);
        }
        
        // Действия менеджера
        if (e.target.closest('.action-btn.accept')) {
            const btn = e.target.closest('.action-btn');
            updateOrderStatus(btn.dataset.orderId, 'accepted');
        }
        
        if (e.target.closest('.action-btn.cooking')) {
            const btn = e.target.closest('.action-btn');
            updateOrderStatus(btn.dataset.orderId, 'cooking');
        }
        
        if (e.target.closest('.action-btn.ready')) {
            const btn = e.target.closest('.action-btn');
            updateOrderStatus(btn.dataset.orderId, 'ready');
        }
        
        if (e.target.closest('.action-btn.delivering')) {
            const btn = e.target.closest('.action-btn');
            updateOrderStatus(btn.dataset.orderId, 'delivering');
        }
    });
}

// ===== РЕЖИМЫ =====
function showCustomerPanel() {
    appMode = 'customer';
    localStorage.setItem('appMode', 'customer');
    
    document.getElementById('customerPanel').style.display = 'block';
    document.getElementById('managerPanel').style.display = 'none';
    document.getElementById('loginPanel').style.display = 'none';
    
    renderProducts();
    updateCart();
}

function showLoginPanel() {
    document.getElementById('customerPanel').style.display = 'none';
    document.getElementById('managerPanel').style.display = 'none';
    document.getElementById('loginPanel').style.display = 'block';
    
    setTimeout(() => {
        document.getElementById('managerPassword')?.focus();
    }, 100);
}

async function loginAsManager() {
    const input = document.getElementById('managerPassword');
    const password = input?.value.trim();
    
    if (password === CONFIG.MANAGER_PASSWORD) {
        showManagerPanel();
        showNotification('Панель управления', 'success');
        if (input) input.value = '';
    } else {
        showNotification('Неверный пароль', 'error');
        if (input) {
            input.value = '';
            input.focus();
        }
    }
}

function showManagerPanel() {
    appMode = 'manager';
    localStorage.setItem('appMode', 'manager');
    
    document.getElementById('customerPanel').style.display = 'none';
    document.getElementById('managerPanel').style.display = 'block';
    document.getElementById('loginPanel').style.display = 'none';
    
    loadManagerOrders();
    loadManagerStats();
}

// ===== КОРЗИНА =====
function addToCart(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;
    
    const existing = cart.find(item => item.id === productId);
    
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({...product, quantity: 1});
    }
    
    updateCart();
    showNotification(`${product.name} добавлен`, 'success');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCart();
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;
    
    item.quantity += change;
    
    if (item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        updateCart();
    }
}

function updateCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Счетчик
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cartCount').textContent = total;
    
    // Товары
    renderCartItems();
    
    // Сумма
    updateTotal();
}

function renderCartItems() {
    const container = document.getElementById('cartItems');
    const empty = document.getElementById('emptyCart');
    
    if (!container) return;
    
    if (cart.length === 0) {
        if (empty) empty.style.display = 'block';
        container.innerHTML = '';
        return;
    }
    
    if (empty) empty.style.display = 'none';
    
    container.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-image">
                <i class="${item.icon}"></i>
            </div>
            <div class="cart-item-info">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">${item.price * item.quantity} ₽</div>
            </div>
            <div class="cart-item-controls">
                <button class="quantity-btn decrease" data-id="${item.id}">-</button>
                <span class="cart-item-quantity">${item.quantity}</span>
                <button class="quantity-btn increase" data-id="${item.id}">+</button>
                <button class="remove-item" data-id="${item.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function updateTotal() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const totalEl = document.getElementById('totalPrice');
    const finalEl = document.getElementById('finalTotal');
    
    if (totalEl) totalEl.textContent = `${total} ₽`;
    if (finalEl) finalEl.textContent = `${total} ₽`;
}

function toggleCart() {
    const panel = document.getElementById('cartPanel');
    const overlay = document.getElementById('overlay');
    
    if (panel) {
        panel.classList.toggle('active');
        if (overlay) overlay.classList.toggle('active');
    }
}

// ===== ТОВАРЫ =====
function renderProducts(category = 'all') {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    
    let filtered = PRODUCTS;
    if (category !== 'all') {
        filtered = PRODUCTS.filter(p => p.category === category);
    }
    
    grid.innerHTML = filtered.map(product => `
        <div class="product-card">
            <div class="product-image">
                <i class="${product.icon}"></i>
            </div>
            <div class="product-content">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-footer">
                    <div class="product-price">${product.price} ₽</div>
                    <button class="add-to-cart" data-id="${product.id}">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// ===== ЗАКАЗ =====
function openOrderModal() {
    if (cart.length === 0) {
        showNotification('Добавьте товары', 'error');
        return;
    }
    
    const modal = document.getElementById('orderModal');
    const overlay = document.getElementById('overlay');
    const summary = document.getElementById('orderSummary');
    
    if (!modal || !overlay || !summary) return;
    
    // Детали заказа
    summary.innerHTML = cart.map(item => `
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>${item.name} × ${item.quantity}</span>
            <span>${item.price * item.quantity} ₽</span>
        </div>
    `).join('');
    
    modal.classList.add('active');
    overlay.classList.add('active');
}

function closeOrderModal() {
    const modal = document.getElementById('orderModal');
    const overlay = document.getElementById('overlay');
    
    if (modal) modal.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
}

async function confirmOrder() {
    const address = document.getElementById('address');
    const phone = document.getElementById('phone');
    
    if (!address || !phone) return;
    
    const addressVal = address.value.trim();
    const phoneVal = phone.value.trim();
    const comment = document.getElementById('comment')?.value.trim() || '';
    
    if (!addressVal) {
        showNotification('Введите адрес', 'error');
        return;
    }
    
    if (!phoneVal) {
        showNotification('Введите телефон', 'error');
        return;
    }
    
    if (!userData) {
        userData = {id: 999999, name: 'Гость'};
    }
    
    // Данные заказа
    const orderData = {
        user_id: userData.id,
        user_name: userData.name,
        phone: phoneVal,
        address: addressVal,
        comment: comment,
        items: cart.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price
        })),
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };
    
    try {
        showNotification('Отправляю заказ...', 'info');
        
        const response = await fetch(CONFIG.SERVER_URL + '/create_order', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Очистка
            cart = [];
            updateCart();
            localStorage.removeItem('cart');
            
            // Закрыть
            closeOrderModal();
            
            // Успех
            showNotification(`Заказ ${result.order_id} принят!`, 'success');
            
            // Выход
            setTimeout(() => {
                if (tg && tg.close) {
                    tg.close();
                }
            }, 3000);
        } else {
            throw new Error(result.error || 'Ошибка');
        }
    } catch (error) {
        showNotification('Ошибка создания заказа', 'error');
        console.error('Ошибка:', error);
    }
}

// ===== МЕНЕДЖЕР =====
async function loadManagerOrders() {
    try {
        showNotification('Загружаю...', 'info');
        
        const response = await fetch(CONFIG.SERVER_URL + '/get_orders');
        const result = await response.json();
        
        if (result.success) {
            renderManagerOrders(result.orders);
        } else {
            throw new Error('Ошибка сервера');
        }
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        renderTestOrders();
    }
}

function renderManagerOrders(orders) {
    const container = document.getElementById('ordersList');
    const empty = document.getElementById('emptyOrders');
    
    if (!container) return;
    
    if (!orders || orders.length === 0) {
        if (empty) empty.style.display = 'block';
        container.innerHTML = '';
        return;
    }
    
    if (empty) empty.style.display = 'none';
    
    // Фильтрация
    let filtered = orders;
    if (currentStatusFilter !== 'all') {
        filtered = orders.filter(o => o.status === currentStatusFilter);
    }
    
    // Сортировка
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    container.innerHTML = filtered.map(order => {
        const statusInfo = getStatusInfo(order.status);
        
        return `
            <div class="order-card">
                <div class="order-header">
                    <div class="order-id">${order.id}</div>
                    <div class="order-time">${formatTime(order.date)}</div>
                </div>
                
                <div class="order-customer">
                    <i class="fas fa-user"></i>
                    <span>${order.customer}</span>
                    <a href="tel:${order.phone}" class="order-phone">
                        <i class="fas fa-phone"></i> ${order.phone}
                    </a>
                </div>
                
                <div class="order-address">
                    <i class="fas fa-map-marker-alt"></i>
                    ${order.address}
                </div>
                
                <div class="order-items">
                    ${order.items}
                </div>
                
                <div class="order-footer">
                    <div class="order-total">${order.total} ₽</div>
                    <div class="order-status ${order.status}">${statusInfo.text}</div>
                </div>
                
                <div class="order-actions">
                    ${getOrderActions(order.id, order.status)}
                </div>
            </div>
        `;
    }).join('');
}

function getOrderActions(orderId, status) {
    let actions = '';
    
    if (status === 'new') {
        actions += `
            <button class="action-btn accept" data-order-id="${orderId}">
                <i class="fas fa-check"></i> Принять
            </button>
            <button class="action-btn reject" data-order-id="${orderId}">
                <i class="fas fa-times"></i> Отклонить
            </button>
        `;
    } else if (status === 'accepted') {
        actions += `
            <button class="action-btn cooking" data-order-id="${orderId}">
                <i class="fas fa-utensils"></i> Готовить
            </button>
        `;
    } else if (status === 'cooking') {
        actions += `
            <button class="action-btn ready" data-order-id="${orderId}">
                <i class="fas fa-check-circle"></i> Готово
            </button>
        `;
    } else if (status === 'ready') {
        actions += `
            <button class="action-btn delivering" data-order-id="${orderId}">
                <i class="fas fa-motorcycle"></i> В доставку
            </button>
        `;
    }
    
    return actions;
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        showNotification('Обновляю...', 'info');
        
        const response = await fetch(CONFIG.SERVER_URL + '/update_order', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                order_id: orderId,
                status: newStatus
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Статус обновлен', 'success');
            loadManagerOrders();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        showNotification('Ошибка обновления', 'error');
        console.error('Ошибка:', error);
    }
}

function loadManagerStats() {
    // Заглушка статистики
    document.getElementById('statNew').textContent = '3';
    document.getElementById('statToday').textContent = '12';
    document.getElementById('statTotal').textContent = '47';
    document.getElementById('statRevenue').textContent = '28460 ₽';
}

// ===== ВСПОМОГАТЕЛЬНЫЕ =====
function showNotification(message, type = 'info') {
    const el = document.getElementById('notification');
    const text = document.getElementById('notificationText');
    
    if (!el || !text) {
        console.log(message);
        return;
    }
    
    text.textContent = message;
    el.className = `notification ${type}`;
    el.classList.add('show');
    
    setTimeout(() => {
        el.classList.remove('show');
    }, 3000);
}

function closeAll() {
    document.querySelectorAll('.modal.active').forEach(el => {
        el.classList.remove('active');
    });
    
    document.querySelectorAll('.cart-panel.active').forEach(el => {
        el.classList.remove('active');
    });
    
    const overlay = document.getElementById('overlay');
    if (overlay) overlay.classList.remove('active');
}

function formatTime(dateStr) {
    try {
        const date = new Date(dateStr);
        return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    } catch {
        return dateStr;
    }
}

function getStatusInfo(status) {
    const map = {
        'new': {text: 'Новый', color: '#FF6B6B'},
        'accepted': {text: 'Принят', color: '#4ECDC4'},
        'cooking': {text: 'Готовится', color: '#FFD166'},
        'ready': {text: 'Готов', color: '#06D6A0'},
        'delivering': {text: 'В пути', color: '#118AB2'},
        'delivered': {text: 'Доставлен', color: '#6C757D'}
    };
    return map[status] || map['new'];
}

async function checkServer() {
    try {
        await fetch(CONFIG.SERVER_URL + '/health');
        console.log('✅ Сервер доступен');
    } catch {
        console.log('⚠️ Сервер не отвечает');
    }
}

// ===== ТЕСТОВЫЕ ДАННЫЕ =====
function renderTestOrders() {
    const container = document.getElementById('ordersList');
    if (!container) return;
    
    const testOrders = [
        {
            id: '#1001',
            date: new Date().toISOString(),
            customer: 'Иван Иванов',
            phone: '+79991234567',
            address: 'ул. Ленина, 15',
            items: 'Black Pizza ×1, Matcha Latte ×2',
            total: '1150',
            status: 'new'
        },
        {
            id: '#1002',
            date: new Date(Date.now() - 3600000).toISOString(),
            customer: 'Мария Петрова',
            phone: '+79987654321',
            address: 'ул. Мира, 42',
            items: 'Green Burger ×1, Black Coffee ×1',
            total: '640',
            status: 'accepted'
        }
    ];
    
    renderManagerOrders(testOrders);
}

// Автообновление заказов
if (appMode === 'manager') {
    setInterval(() => {
        loadManagerOrders();
        loadManagerStats();
    }, 30000);
}

// Автосохранение корзины
setInterval(() => {
    if (cart.length > 0) {
        localStorage.setItem('cart', JSON.stringify(cart));
    }
}, 60000);
