// Telegram Web App интеграция
const tg = window.Telegram.WebApp;

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    // Расширяем приложение на весь экран
    tg.expand();
    
    // Инициализация завершена
    tg.ready();
    
    // Получаем данные пользователя из Telegram
    const user = tg.initDataUnsafe?.user;
    if (user) {
        updateUserInfo(user);
    }
    
    // Инициализируем приложение
    initApp();
});

// Обновление информации о пользователе
function updateUserInfo(user) {
    const userName = user.first_name || user.username || 'Пользователь';
    const userEmail = user.username ? `@${user.username}` : 'Telegram';
    
    document.getElementById('userWelcome').innerHTML = `
        <i class="fas fa-user-circle"></i>
        <span>Привет, ${userName}!</span>
    `;
    
    document.getElementById('userName').textContent = userName;
    document.getElementById('userEmail').textContent = userEmail;
}

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
    },
    {
        id: 9,
        name: "Карбонара",
        description: "Спагетти, бекон, сыр, яйцо",
        price: 380,
        category: "pasta",
        icon: "fas fa-utensils"
    },
    {
        id: 10,
        name: "Цезарь с курицей",
        description: "Салат с курицей, сыром и соусом Цезарь",
        price: 320,
        category: "salad",
        icon: "fas fa-leaf"
    }
];

// Корзина
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Инициализация приложения
function initApp() {
    renderProducts();
    setupEventListeners();
    updateCartCount();
}

// Рендеринг продуктов
function renderProducts(category = 'all') {
    const productsGrid = document.getElementById('productsGrid');
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
    document.getElementById('menuBtn').addEventListener('click', toggleMenu);
    document.getElementById('closeMenu').addEventListener('click', toggleMenu);
    
    // Кнопка корзины
    document.getElementById('cartBtn').addEventListener('click', toggleCart);
    document.getElementById('closeCart').addEventListener('click', toggleCart);
    
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
    document.getElementById('overlay').addEventListener('click', function() {
        closeAllPanels();
    });
    
    // Оформление заказа
    document.getElementById('checkoutBtn').addEventListener('click', openOrderModal);
    document.getElementById('closeModal').addEventListener('click', closeOrderModal);
    document.getElementById('cancelOrder').addEventListener('click', closeOrderModal);
    document.getElementById('confirmOrder').addEventListener('click', confirmOrder);
    
    // Выход
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
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
    document.getElementById('cartCount').textContent = totalItems;
}

function renderCartItems() {
    const cartItems = document.getElementById('cartItems');
    const emptyCart = document.getElementById('emptyCart');
    
    if (cart.length === 0) {
        emptyCart.style.display = 'block';
        cartItems.innerHTML = '';
        return;
    }
    
    emptyCart.style.display = 'none';
    
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
    document.getElementById('totalPrice').textContent = `${total} ₽`;
    document.getElementById('finalTotal').textContent = `${total} ₽`;
}

// Управление панелями
function toggleMenu() {
    const menu = document.getElementById('sideMenu');
    const overlay = document.getElementById('overlay');
    menu.classList.toggle('active');
    overlay.classList.toggle('active');
}

function toggleCart() {
    const cartPanel = document.getElementById('cartPanel');
    const overlay = document.getElementById('overlay');
    cartPanel.classList.toggle('active');
    overlay.classList.toggle('active');
    renderCartItems();
    updateTotalPrice();
}

function closeAllPanels() {
    document.getElementById('sideMenu').classList.remove('active');
    document.getElementById('cartPanel').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
    document.getElementById('orderModal').classList.remove('active');
}

// Оформление заказа
function openOrderModal() {
    if (cart.length === 0) {
        showNotification('Добавьте товары в корзину!');
        return;
    }
    
    const modal = document.getElementById('orderModal');
    const overlay = document.getElementById('overlay');
    
    // Обновляем информацию о заказе
    const orderSummary = document.getElementById('orderSummary');
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
    document.getElementById('orderModal').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
}

function confirmOrder() {
    const address = document.getElementById('address').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const comment = document.getElementById('comment').value.trim();
    
    if (!address) {
        showNotification('Введите адрес доставки!');
        return;
    }
    
    if (!phone) {
        showNotification('Введите номер телефона!');
        return;
    }
    
    // Формируем данные заказа
    const order = {
        address,
        phone,
        comment,
        items: cart,
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        timestamp: new Date().toISOString()
    };
    
    // Отправляем данные в Telegram
    tg.sendData(JSON.stringify({
        action: 'create_order',
        order: order
    }));
    
    // Показываем уведомление
    showNotification('Заказ оформлен! Скоро с вами свяжутся.');
    
    // Очищаем корзину
    cart = [];
    updateCart();
    closeOrderModal();
    
    // Закрываем приложение через 2 секунды
    setTimeout(() => {
        tg.close();
    }, 2000);
}

// Выход
function logout() {
    tg.sendData(JSON.stringify({ action: 'logout' }));
    tg.close();
}

// Уведомления
function showNotification(message) {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    
    notificationText.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Закрытие приложения при нажатии кнопки "Назад" на Android
window.addEventListener('popstate', function() {
    tg.close();
});

// Автоматическое обновление каждые 5 минут (для поддержания сессии)
setInterval(() => {
    if (cart.length > 0) {
        localStorage.setItem('cart', JSON.stringify(cart));
    }
}, 5 * 60 * 1000);
