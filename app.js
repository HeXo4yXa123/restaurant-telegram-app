// Telegram Web App SDK
let tg = null;
let userData = null;

// Конфигурация сервера
// ⚠️ ЗАМЕНИТЕ НА ВАШ РЕАЛЬНЫЙ URL С PYTHONANYWHERE!
const SERVER_URL = "https://HeX04yXa.pythonanywhere.com";

// База данных продуктов
const products = [
    {
        id: 1,
        name: "Пицца Маргарита",
        description: "Томатный соус, сыр моцарелла, свежий базилик",
        price: 450,
        category: "pizza",
        icon: "fas fa-pizza-slice"
    },
    {
        id: 2,
        name: "Пицца Пепперони",
        description: "Острая колбаска пепперони, сыр, томатный соус",
        price: 550,
        category: "pizza",
        icon: "fas fa-pizza-slice"
    },
    {
        id: 3,
        name: "Чизбургер",
        description: "Говяжья котлета, сыр, салат, соус",
        price: 320,
        category: "burger",
        icon: "fas fa-hamburger"
    },
    {
        id: 4,
        name: "Бургер с беконом",
        description: "Двойная котлета, бекон, сыр чеддер",
        price: 420,
        category: "burger",
        icon: "fas fa-hamburger"
    },
    {
        id: 5,
        name: "Кола",
        description: "Газированный напиток 0.5л",
        price: 120,
        category: "drink",
        icon: "fas fa-wine-glass-alt"
    },
    {
        id: 6,
        name: "Фреш апельсиновый",
        description: "Свежевыжатый апельсиновый сок",
        price: 180,
        category: "drink",
        icon: "fas fa-wine-glass-alt"
    },
    {
        id: 7,
        name: "Тирамису",
        description: "Итальянский десерт с кофе и маскарпоне",
        price: 280,
        category: "dessert",
        icon: "fas fa-ice-cream"
    },
    {
        id: 8,
        name: "Чизкейк",
        description: "Классический чизкейк с ягодным топпингом",
        price: 250,
        category: "dessert",
        icon: "fas fa-ice-cream"
    }
];

// Корзина
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Инициализация приложения
function initApp() {
    // Инициализируем Telegram Web App
    initTelegramWebApp();
    
    // Рендерим продукты
    renderProducts();
    
    // Настраиваем обработчики
    setupEventListeners();
    
    // Обновляем корзину
    updateCartCount();
    
    // Проверяем сервер
    checkServerConnection();
}

// Инициализация Telegram Web App
function initTelegramWebApp() {
    tg = window.Telegram?.WebApp;
    
    if (!tg) {
        console.warn('Telegram Web App SDK не загружен');
        showNotification('Откройте приложение через Telegram бота');
        return;
    }
    
    // Инициализируем
    tg.ready();
    tg.expand();
    
    // Получаем данные пользователя
    const initData = tg.initDataUnsafe || {};
    userData = initData.user;
    
    if (userData) {
        updateUserInfo(userData);
        console.log('Пользователь найден:', userData);
    } else {
        console.warn('Данные пользователя не получены');
        // Показываем тестового пользователя для отладки
        userData = {
            id: 999999,
            first_name: 'Тестовый',
            username: 'test_user'
        };
        updateUserInfo(userData);
        showNotification('Режим тестирования. Войдите через Telegram для полного доступа.');
    }
}

// Обновление информации о пользователе
function updateUserInfo(user) {
    const userName = user.first_name || user.username || 'Пользователь';
    const userEmail = user.username ? `@${user.username}` : 'Telegram';
    
    const userWelcome = document.getElementById('userWelcome');
    const userNameElement = document.getElementById('userName');
    const userEmailElement = document.getElementById('userEmail');
    
    if (userWelcome) {
        userWelcome.innerHTML = `
            <i class="fas fa-user-circle"></i>
            <span>Привет, ${userName}!</span>
        `;
    }
    
    if (userNameElement) userNameElement.textContent = userName;
    if (userEmailElement) userEmailElement.textContent = userEmail;
    
    // Сохраняем user данные для заказов
    window.userData = {
        id: user.id || 999999,
        name: userName,
        username: user.username || ''
    };
}

// Функция отправки заказа на сервер
async function sendOrderToServer(orderData) {
    try {
        showNotification("📤 Отправляем заказ...");
        
        console.log('Отправляю данные:', orderData);
        
        const response = await fetch(`${SERVER_URL}/create_order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(`✅ Заказ ${result.order_id} создан!`);
            return result;
        } else {
            throw new Error(result.error || 'Ошибка сервера');
        }
    } catch (error) {
        console.error('Ошибка отправки заказа:', error);
        showNotification(`❌ Ошибка: ${error.message}`);
        throw error;
    }
}

// Рендеринг продуктов
function renderProducts(category = 'all') {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;
    
    let filteredProducts = products;
    
    if (category !== 'all') {
        filteredProducts = products.filter(product => product.category === category);
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

// Настройка обработчиков событий
function setupEventListeners() {
    // Кнопка меню
    const menuBtn = document.getElementById('menuBtn');
    const closeMenu = document.getElementById('closeMenu');
    if (menuBtn) menuBtn.addEventListener('click', toggleMenu);
    if (closeMenu) closeMenu.addEventListener('click', toggleMenu);
    
    // Кнопка корзины
    const cartBtn = document.getElementById('cartBtn');
    const closeCart = document.getElementById('closeCart');
    if (cartBtn) cartBtn.addEventListener('click', toggleCart);
    if (closeCart) closeCart.addEventListener('click', toggleCart);
    
    // Категории
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const category = this.dataset.category;
            renderProducts(category);
        });
    });
    
    // Затемнение фона
    const overlay = document.getElementById('overlay');
    if (overlay) overlay.addEventListener('click', closeAllPanels);
    
    // Оформление заказа
    const checkoutBtn = document.getElementById('checkoutBtn');
    const closeModal = document.getElementById('closeModal');
    const cancelOrder = document.getElementById('cancelOrder');
    const confirmOrderBtn = document.getElementById('confirmOrder');
    
    if (checkoutBtn) checkoutBtn.addEventListener('click', openOrderModal);
    if (closeModal) closeModal.addEventListener('click', closeOrderModal);
    if (cancelOrder) cancelOrder.addEventListener('click', closeOrderModal);
    if (confirmOrderBtn) confirmOrderBtn.addEventListener('click', confirmOrder);
    
    // Выход
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
    
    // Динамические обработчики для продуктов
    document.addEventListener('click', function(e) {
        // Добавление в корзину
        if (e.target.closest('.add-to-cart')) {
            const btn = e.target.closest('.add-to-cart');
            const productId = parseInt(btn.dataset.id);
            addToCart(productId);
            
            // Анимация кнопки
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
    });
}

// Работа с корзиной
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
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
    showNotification(`${product.name} добавлен в корзину!`);
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
    updateCartCount();
    renderCartItems();
    updateTotalPrice();
}

function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCount = document.getElementById('cartCount');
    if (cartCount) cartCount.textContent = totalItems;
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

// Управление панелями
function toggleMenu() {
    const menu = document.getElementById('sideMenu');
    const overlay = document.getElementById('overlay');
    if (menu) menu.classList.toggle('active');
    if (overlay) overlay.classList.toggle('active');
}

function toggleCart() {
    const cartPanel = document.getElementById('cartPanel');
    const overlay = document.getElementById('overlay');
    if (cartPanel) cartPanel.classList.toggle('active');
    if (overlay) overlay.classList.toggle('active');
    renderCartItems();
    updateTotalPrice();
}

function closeAllPanels() {
    const sideMenu = document.getElementById('sideMenu');
    const cartPanel = document.getElementById('cartPanel');
    const overlay = document.getElementById('overlay');
    const orderModal = document.getElementById('orderModal');
    
    if (sideMenu) sideMenu.classList.remove('active');
    if (cartPanel) cartPanel.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    if (orderModal) orderModal.classList.remove('active');
}

// Оформление заказа
function openOrderModal() {
    if (cart.length === 0) {
        showNotification('Добавьте товары в корзину!');
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
    const comment = document.getElementById('comment');
    
    if (!address || !phone) {
        showNotification('Ошибка: форма не найдена');
        return;
    }
    
    const addressValue = address.value.trim();
    const phoneValue = phone.value.trim();
    const commentValue = comment ? comment.value.trim() : '';
    
    if (!addressValue) {
        showNotification('Введите адрес доставки!');
        return;
    }
    
    if (!phoneValue) {
        showNotification('Введите номер телефона!');
        return;
    }
    
    // Проверяем, есть ли данные пользователя
    if (!window.userData) {
        showNotification('Данные пользователя не найдены. Откройте приложение через Telegram бота.');
        return;
    }
    
    // Формируем данные для отправки
    const orderData = {
        user_id: window.userData.id,
        user_name: window.userData.name,
        username: window.userData.username,
        phone: phoneValue,
        address: addressValue,
        comment: commentValue,
        items: cart.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price
        })),
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };
    
    console.log('Отправляю заказ:', orderData);
    
    try {
        // Показываем загрузку
        showNotification("⏳ Создаем заказ...");
        
        // Отправляем на сервер
        const result = await sendOrderToServer(orderData);
        
        // Очищаем корзину
        cart = [];
        updateCart();
        localStorage.removeItem('cart');
        
        // Показываем успех
        showNotification(`🎉 Заказ ${result.order_id} принят!`);
        
        // Закрываем модальное окно
        closeOrderModal();
        
        // Закрываем приложение через 3 секунды
        setTimeout(() => {
            if (tg && tg.close) {
                tg.close();
            } else {
                showNotification('Заказ создан! Можете закрыть приложение.');
            }
        }, 3000);
        
    } catch (error) {
        console.error('Ошибка при создании заказа:', error);
        showNotification('❌ Ошибка при создании заказа. Попробуйте еще раз.');
    }
}

// Выход
function logout() {
    if (tg && tg.sendData) {
        tg.sendData(JSON.stringify({ action: 'logout' }));
        tg.close();
    } else {
        showNotification('Выйдите из Telegram');
    }
}

// Уведомления
function showNotification(message) {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    
    if (!notification || !notificationText) {
        console.log('Уведомление:', message);
        alert(message);
        return;
    }
    
    notificationText.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Проверка подключения к серверу
async function checkServerConnection() {
    try {
        const response = await fetch(`${SERVER_URL}/health`);
        if (response.ok) {
            console.log('✅ Сервер доступен');
        }
    } catch (error) {
        console.warn('⚠️ Сервер не отвечает');
        showNotification('Сервер временно недоступен');
    }
}

// Запускаем приложение когда DOM загружен
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
