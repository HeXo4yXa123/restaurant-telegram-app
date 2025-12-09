// ===== КОНФИГУРАЦИЯ =====
const CONFIG = {
    SERVER_URL: "https://HeX04yXa.pythonanywhere.com",
    MANAGER_PASSWORD: "admin123",
    APP_VERSION: "1.0.0"
};

// ===== ГОЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====
let tg = null;
let userData = null;
let appMode = 'customer'; // 'customer' или 'manager'
let currentStatusFilter = 'all';

// База данных продуктов
const PRODUCTS = [
    {
        id: 1,
        name: "Пицца Black Edition",
        description: "Черное тесто, моцарелла, трюфель",
        price: 690,
        category: "pizza",
        icon: "fas fa-pizza-slice"
    },
    {
        id: 2,
        name: "Пицца Green Energy",
        description: "С авокадо, шпинатом, козьим сыром",
        price: 590,
        category: "pizza",
        icon: "fas fa-pizza-slice"
    },
    {
        id: 3,
        name: "Black Burger",
        description: "Черная булка, говядина, сыр чеддер",
        price: 450,
        category: "burger",
        icon: "fas fa-hamburger"
    },
    {
        id: 4,
        name: "Green Burger",
        description: "С авокадо, курицей, салатом",
        price: 420,
        category: "burger",
        icon: "fas fa-hamburger"
    },
    {
        id: 5,
        name: "Matcha Latte",
        description: "Зеленый чай матча с молоком",
        price: 280,
        category: "drink",
        icon: "fas fa-glass-whiskey"
    },
    {
        id: 6,
        name: "Black Coffee",
        description: "Эспрессо премиум класса",
        price: 220,
        category: "drink",
        icon: "fas fa-glass-whiskey"
    },
    {
        id: 7,
        name: "Black Forest",
        description: "Шоколадный торт с вишней",
        price: 320,
        category: "dessert",
        icon: "fas fa-ice-cream"
    },
    {
        id: 8,
        name: "Green Tea Cheesecake",
        description: "Чизкейк с зеленым чаем",
        price: 290,
        category: "dessert",
        icon: "fas fa-ice-cream"
    }
];

// Корзина
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', function() {
    console.log(`🍽️ BLACK | GREEN v${CONFIG.APP_VERSION}`);
    
    initTelegram();
    setupEventListeners();
    initApp();
});

// Инициализация Telegram
function initTelegram() {
    tg = window.Telegram?.WebApp;
    
    if (!tg) {
        console.warn('Telegram Web App SDK не загружен');
        showNotification('Откройте приложение через Telegram бота', 'error');
        return;
    }
    
    tg.ready();
    tg.expand();
    
    // Получаем данные пользователя
    const initData = tg.initDataUnsafe || {};
    userData = initData.user;
    
    if (userData) {
        updateUserInfo(userData);
    } else {
        // Тестовый режим
        userData = {
            id: 999999,
            first_name: 'Гость',
            username: 'guest'
        };
        showNotification('Режим тестирования', 'info');
    }
}

// Обновление информации о пользователе
function updateUserInfo(user) {
    const userName = user.first_name || user.username || 'Гость';
    
    const userWelcome = document.getElementById('userWelcome');
    if (userWelcome) {
        userWelcome.innerHTML = `
            <i class="fas fa-user-circle"></i>
            <span>Привет, ${userName}!</span>
        `;
    }
    
    // Сохраняем данные для заказов
    window.userData = {
        id: user.id || 999999,
        name: userName,
        username: user.username || ''
    };
}

// Инициализация приложения
function initApp() {
    // Проверяем сохраненный режим
    const savedMode = localStorage.getItem('appMode');
    if (savedMode === 'manager') {
        switchToManager();
    } else {
        switchToCustomer();
    }
    
    // Загружаем продукты
    renderProducts();
    updateCart();
    
    // Проверяем сервер
    checkServerConnection();
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Кнопки переключения режимов
    document.getElementById('managerSwitchBtn')?.addEventListener('click', showLoginPanel);
    document.getElementById('customerSwitchBtn')?.addEventListener('click', switchToCustomer);
    
    // Корзина
    document.getElementById('cartBtn')?.addEventListener('click', toggleCart);
    document.getElementById('closeCart')?.addEventListener('click', toggleCart);
    
    // Оформление заказа
    document.getElementById('checkoutBtn')?.addEventListener('click', openOrderModal);
    document.getElementById('closeModal')?.addEventListener('click', closeOrderModal);
    document.getElementById('cancelOrder')?.addEventListener('click', closeOrderModal);
    document.getElementById('confirmOrder')?.addEventListener('click', confirmOrder);
    
    // Менеджер
    document.getElementById('refreshOrdersBtn')?.addEventListener('click', loadManagerOrders);
    
    // Фильтры статусов
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
            const category = this.dataset.category;
            renderProducts(category);
        });
    });
    
    // Оверлей
    document.getElementById('overlay')?.addEventListener('click', closeAllModals);
    
    // Динамические обработчики
    document.addEventListener('click', function(e) {
        // Добавление в корзину
        if (e.target.closest('.add-to-cart')) {
            const btn = e.target.closest('.add-to-cart');
            const productId = parseInt(btn.dataset.id);
            addToCart(productId);
            btn.classList.add('add-animation');
            setTimeout(() => btn.classList.remove('add-animation'), 500);
        }
        
        // Удаление из корзины
        if (e.target.closest('.remove-item')) {
            const btn = e.target.closest('.remove-item');
            const productId = parseInt(btn.dataset.id);
            removeFromCart(productId);
        }
        
        // Изменение количества
        if (e.target.closest('.quantity-btn.decrease')) {
            const btn = e.target.closest('.quantity-btn');
            const productId = parseInt(btn.dataset.id);
            updateQuantity(productId, -1);
        }
        
        if (e.target.closest('.quantity-btn.increase')) {
            const btn = e.target.closest('.quantity-btn');
            const productId = parseInt(btn.dataset.id);
            updateQuantity(productId, 1);
        }
        
        // Действия менеджера
        if (e.target.closest('.action-btn.accept')) {
            const btn = e.target.closest('.action-btn');
            const orderId = btn.dataset.orderId;
            updateOrderStatus(orderId, 'accepted');
        }
        
        if (e.target.closest('.action-btn.cooking')) {
            const btn = e.target.closest('.action-btn');
            const orderId = btn.dataset.orderId;
            updateOrderStatus(orderId, 'cooking');
        }
        
        if (e.target.closest('.action-btn.ready')) {
            const btn = e.target.closest('.action-btn');
            const orderId = btn.dataset.orderId;
            updateOrderStatus(orderId, 'ready');
        }
        
        if (e.target.closest('.action-btn.delivering')) {
            const btn = e.target.closest('.action-btn');
            const orderId = btn.dataset.orderId;
            updateOrderStatus(orderId, 'delivering');
        }
        
        if (e.target.closest('.action-btn.complete')) {
            const btn = e.target.closest('.action-btn');
            const orderId = btn.dataset.orderId;
            updateOrderStatus(orderId, 'completed');
        }
        
        if (e.target.closest('.action-btn.call')) {
            const btn = e.target.closest('.action-btn');
            const phone = btn.dataset.phone;
            window.open(`tel:${phone}`);
        }
    });
}

// ===== РЕЖИМ КЛИЕНТА =====
function switchToCustomer() {
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
    
    // Сфокусироваться на поле ввода
    setTimeout(() => {
        document.getElementById('managerPassword')?.focus();
    }, 100);
}

function loginAsManager() {
    const passwordInput = document.getElementById('managerPassword');
    const password = passwordInput?.value.trim();
    
    if (password === CONFIG.MANAGER_PASSWORD) {
        switchToManager();
        showNotification('Панель управления активирована', 'success');
        if (passwordInput) passwordInput.value = '';
    } else {
        showNotification('Неверный пароль', 'error');
        if (passwordInput) {
            passwordInput.value = '';
            passwordInput.focus();
        }
    }
}

// ===== РЕЖИМ МЕНЕДЖЕРА =====
function switchToManager() {
    appMode = 'manager';
    localStorage.setItem('appMode', 'manager');
    
    document.getElementById('customerPanel').style.display = 'none';
    document.getElementById('managerPanel').style.display = 'block';
    document.getElementById('loginPanel').style.display = 'none';
    
    loadManagerOrders();
    loadManagerStats();
}

async function loadManagerOrders() {
    try {
        showNotification('Загружаю заказы...', 'info');
        
        const response = await fetch(`${CONFIG.SERVER_URL}/get_orders`);
        const result = await response.json();
        
        if (result.success) {
            renderManagerOrders(result.orders);
            showNotification(`Загружено: ${result.orders?.length || 0} заказов`, 'success');
        } else {
            throw new Error(result.error || 'Ошибка сервера');
        }
    } catch (error) {
        console.error('Ошибка загрузки заказов:', error);
        showNotification('Ошибка загрузки заказов', 'error');
        
        // Показываем тестовые данные для демонстрации
        renderManagerOrders(getTestOrders());
    }
}

async function loadManagerStats() {
    try {
        const response = await fetch(`${CONFIG.SERVER_URL}/manager_stats`);
        const result = await response.json();
        
        if (result.success) {
            updateStats(result.stats);
        }
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
        // Тестовые статистики
        updateStats({
            new_orders: 3,
            today_orders: 12,
            total_revenue: 8560,
            active_orders: 5
        });
    }
}

function updateStats(stats) {
    document.getElementById('statNew').textContent = stats.new_orders || 0;
    document.getElementById('statToday').textContent = stats.today_orders || 0;
    document.getElementById('statRevenue').textContent = `${stats.total_revenue || 0} ₽`;
    document.getElementById('statActive').textContent = stats.active_orders || 0;
}

function renderManagerOrders(orders) {
    const ordersList = document.getElementById('ordersList');
    const emptyOrders = document.getElementById('emptyOrders');
    
    if (!ordersList) return;
    
    if (!orders || orders.length === 0) {
        if (emptyOrders) emptyOrders.style.display = 'block';
        ordersList.innerHTML = '';
        return;
    }
    
    if (emptyOrders) emptyOrders.style.display = 'none';
    
    // Фильтрация по статусу
    let filteredOrders = orders;
    if (currentStatusFilter !== 'all') {
        if (currentStatusFilter === 'active') {
            filteredOrders = orders.filter(o => ['new', 'accepted', 'cooking', 'delivering'].includes(o.status));
        } else if (currentStatusFilter === 'completed') {
            filteredOrders = orders.filter(o => ['completed', 'rejected'].includes(o.status));
        } else {
            filteredOrders = orders.filter(o => o.status === currentStatusFilter);
        }
    }
    
    // Сортировка по дате (новые сверху)
    filteredOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    ordersList.innerHTML = filteredOrders.map(order => {
        const statusText = getStatusText(order.status);
        const statusClass = getStatusClass(order.status);
        
        return `
            <div class="order-card">
                <div class="order-header">
                    <div class="order-id">#${order.id}</div>
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
                    <div class="order-status ${statusClass}">${statusText}</div>
                </div>
                
                <div class="order-actions">
                    ${getOrderActions(order.id, order.status, order.phone)}
                </div>
            </div>
        `;
    }).join('');
}

function getOrderActions(orderId, status, phone) {
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
    } else if (status === 'delivering') {
        actions += `
            <button class="action-btn complete" data-order-id="${orderId}">
                <i class="fas fa-flag-checkered"></i> Доставлен
            </button>
        `;
    }
    
    // Всегда показываем кнопку звонка
    actions += `
        <button class="action-btn call" data-phone="${phone}">
            <i class="fas fa-phone"></i> Позвонить
        </button>
    `;
    
    return actions;
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        showNotification('Обновляю статус...', 'info');
        
        const response = await fetch(`${CONFIG.SERVER_URL}/update_order`, {
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
            showNotification(`Статус обновлен: ${getStatusText(newStatus)}`, 'success');
            loadManagerOrders();
            loadManagerStats();
        } else {
            throw new Error(result.error || 'Ошибка обновления');
        }
    } catch (error) {
        console.error('Ошибка обновления статуса:', error);
        showNotification('Ошибка обновления', 'error');
    }
}

// ===== КОРЗИНА И ЗАКАЗЫ =====
function addToCart(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
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
    
    // Обновляем счетчик
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCount = document.getElementById('cartCount');
    if (cartCount) cartCount.textContent = totalItems;
    
    // Рендерим товары в корзине
    renderCartItems();
    
    // Обновляем общую сумму
    updateTotalPrice();
}

function renderCartItems() {
    const cartItems = document.getElementById('cartItems');
    const emptyCart = document.getElementById('emptyCart');
    
    if (!cartItems) return;
    
    if (cart.length === 0) {
        if (emptyCart) emptyCart.style.display = 'block';
        cartItems.innerHTML = '';
        return;
    }
    
    if (emptyCart) emptyCart.style.display = 'none';
    
    cartItems.innerHTML = cart.map(item => `
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

function updateTotalPrice() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const totalPrice = document.getElementById('totalPrice');
    const finalTotal = document.getElementById('finalTotal');
    
    if (totalPrice) totalPrice.textContent = `${total} ₽`;
    if (finalTotal) finalTotal.textContent = `${total} ₽`;
}

function toggleCart() {
    const cartPanel = document.getElementById('cartPanel');
    const overlay = document.getElementById('overlay');
    
    if (cartPanel) {
        cartPanel.classList.toggle('active');
        if (overlay) overlay.classList.toggle('active');
    }
}

// ===== ОФОРМЛЕНИЕ ЗАКАЗА =====
function openOrderModal() {
    if (cart.length === 0) {
        showNotification('Добавьте товары в корзину', 'error');
        return;
    }
    
    const modal = document.getElementById('orderModal');
    const overlay = document.getElementById('overlay');
    const orderSummary = document.getElementById('orderSummary');
    
    if (!modal || !overlay || !orderSummary) return;
    
    // Обновляем информацию о заказе
    orderSummary.innerHTML = cart.map(item => `
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>${item.name} × ${item.quantity}</span>
            <span>${item.price * item.quantity} ₽</span>
        </div>
    `).join('');
    
    modal.classList.add('active');
    overlay.classList.add('active');
    
    // Автозаполнение телефона из Telegram
    if (userData?.username) {
        document.getElementById('phone').value = '+7';
    }
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
    
    if (!address || !phone) {
        showNotification('Ошибка формы', 'error');
        return;
    }
    
    const addressValue = address.value.trim();
    const phoneValue = phone.value.trim();
    const comment = document.getElementById('comment')?.value.trim() || '';
    
    if (!addressValue) {
        showNotification('Введите адрес доставки', 'error');
        return;
    }
    
    if (!phoneValue) {
        showNotification('Введите номер телефона', 'error');
        return;
    }
    
    // Проверяем данные пользователя
    if (!window.userData) {
        showNotification('Ошибка данных пользователя', 'error');
        return;
    }
    
    // Формируем данные заказа
    const orderData = {
        user_id: window.userData.id,
        user_name: window.userData.name,
        username: window.userData.username,
        phone: phoneValue,
        address: addressValue,
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
        
        const response = await fetch(`${CONFIG.SERVER_URL}/create_order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Очищаем корзину
            cart = [];
            updateCart();
            localStorage.removeItem('cart');
            
            // Закрываем модальное окно
            closeOrderModal();
            
            // Показываем успех
            showNotification(`Заказ #${result.order_id} принят!`, 'success');
            
            // Закрываем приложение через 3 секунды
            setTimeout(() => {
                if (tg && tg.close) {
                    tg.close();
                }
            }, 3000);
        } else {
            throw new Error(result.error || 'Ошибка сервера');
        }
    } catch (error) {
        console.error('Ошибка создания заказа:', error);
        showNotification('Ошибка создания заказа', 'error');
    }
}

// ===== ПРОДУКТЫ =====
function renderProducts(category = 'all') {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;
    
    let filteredProducts = PRODUCTS;
    
    if (category !== 'all') {
        filteredProducts = PRODUCTS.filter(product => product.category === category);
    }
    
    productsGrid.innerHTML = filteredProducts.map(product => `
        <div class="product-card" data-id="${product.id}">
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

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    
    if (!notification || !notificationText) {
        console.log(`${type}: ${message}`);
        return;
    }
    
    notificationText.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function closeAllModals() {
    document.querySelectorAll('.modal.active').forEach(modal => {
        modal.classList.remove('active');
    });
    
    document.querySelectorAll('.cart-panel.active').forEach(panel => {
        panel.classList.remove('active');
    });
    
    const overlay = document.getElementById('overlay');
    if (overlay) overlay.classList.remove('active');
}

function formatTime(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    } catch {
        return dateString;
    }
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

function getStatusClass(status) {
    return status;
}

async function checkServerConnection() {
    try {
        const response = await fetch(`${CONFIG.SERVER_URL}/health`);
        if (response.ok) {
            console.log('✅ Сервер доступен');
        }
    } catch (error) {
        console.warn('⚠️ Сервер не отвечает');
        showNotification('Сервер временно недоступен', 'error');
    }
}

// Тестовые данные для демонстрации
function getTestOrders() {
    return [
        {
            id: '#1001',
            customer: 'Иван Иванов',
            phone: '+79991234567',
            address: 'ул. Ленина, 15',
            items: 'Пицца Black Edition ×1, Matcha Latte ×2',
            total: '1250',
            status: 'new',
            date: new Date().toISOString()
        },
        {
            id: '#1002',
            customer: 'Мария Петрова',
            phone: '+79987654321',
            address: 'ул. Мира, 42',
            items: 'Green Burger ×1, Black Coffee ×1',
            total: '670',
            status: 'accepted',
            date: new Date(Date.now() - 3600000).toISOString()
        },
        {
            id: '#1003',
            customer: 'Алексей Смирнов',
            phone: '+79995556677',
            address: 'пр. Победы, 88',
            items: 'Пицца Green Energy ×2',
            total: '1180',
            status: 'cooking',
            date: new Date(Date.now() - 7200000).toISOString()
        }
    ];
}

// Автообновление заказов для менеджера
if (appMode === 'manager') {
    setInterval(() => {
        loadManagerOrders();
        loadManagerStats();
    }, 30000); // Каждые 30 секунд
}

// Автосохранение корзины
setInterval(() => {
    if (cart.length > 0) {
        localStorage.setItem('cart', JSON.stringify(cart));
    }
}, 60000); // Каждую минуту
