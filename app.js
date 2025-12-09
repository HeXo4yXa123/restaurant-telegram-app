class RestaurantApp {
    constructor() {
        this.products = [];
        this.cart = [];
        this.userRole = 'customer';
        this.currentOrder = null;
        this.orders = [];
        
        this.init();
    }

    async init() {
        // Загрузка данных
        await this.loadProducts();
        this.loadCart();
        this.setupEventListeners();
        
        // Симуляция загрузки
        setTimeout(() => {
            this.showScreen('main-screen');
            this.hideLoading();
        }, 1000);
    }

    async loadProducts() {
        // Здесь будет запрос к бэкенду
        // Временно используем mock-данные
        this.products = [
            { id: 1, name: 'Пицца Маргарита', description: 'Томаты, сыр, базилик', price: 450, category: 'pizza' },
            { id: 2, name: 'Пицца Пепперони', description: 'Салями, сыр, перец', price: 550, category: 'pizza' },
            { id: 3, name: 'Чизбургер', description: 'Говядина, сыр, овощи', price: 320, category: 'burger' },
            { id: 4, name: 'Биг Бургер', description: 'Двойная котлета, бекон', price: 420, category: 'burger' },
            { id: 5, name: 'Филадельфия', description: 'Лосось, сыр, огурец', price: 680, category: 'sushi' },
            { id: 6, name: 'Калифорния', description: 'Краб, авокадо, икра', price: 520, category: 'sushi' },
            { id: 7, name: 'Кола', description: '0.5л', price: 120, category: 'drinks' },
            { id: 8, name: 'Кофе', description: 'Американо', price: 150, category: 'drinks' }
        ];
        
        this.renderProducts();
    }

    setupEventListeners() {
        // Кнопки категорий
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.filterProducts(e.target.dataset.category);
            });
        });

        // Поиск
        document.getElementById('search').addEventListener('input', (e) => {
            this.searchProducts(e.target.value);
        });

        // Корзина
        document.getElementById('cart-btn').addEventListener('click', () => {
            this.showCart();
        });

        // Оформление заказа
        document.getElementById('checkout-btn').addEventListener('click', () => {
            this.showCheckout();
        });

        // Форма заказа
        document.getElementById('checkout-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitOrder();
        });

        // Навигация назад
        document.getElementById('back-to-catalog').addEventListener('click', () => {
            this.showCatalog();
        });

        document.getElementById('back-to-cart').addEventListener('click', () => {
            this.showCart();
        });

        // Вход
        document.getElementById('login-btn').addEventListener('click', () => {
            this.showLoginModal();
        });

        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('cancel-login').addEventListener('click', () => {
            this.hideLoginModal();
        });

        // Выход
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });
    }

    renderProducts(filteredProducts = null) {
        const productsToRender = filteredProducts || this.products;
        const container = document.getElementById('products-grid');
        container.innerHTML = '';

        productsToRender.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <div class="product-img">
                    <i class="fas fa-${this.getProductIcon(product.category)}"></i>
                </div>
                <h3 class="product-title">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-footer">
                    <span class="product-price">${product.price} ₽</span>
                    <button class="add-to-cart" data-id="${product.id}">
                        <i class="fas fa-plus"></i> В корзину
                    </button>
                </div>
            `;
            
            productCard.querySelector('.add-to-cart').addEventListener('click', () => {
                this.addToCart(product);
            });
            
            container.appendChild(productCard);
        });
    }

    getProductIcon(category) {
        const icons = {
            pizza: 'pizza-slice',
            burger: 'hamburger',
            sushi: 'fish',
            drinks: 'wine-bottle'
        };
        return icons[category] || 'utensils';
    }

    addToCart(product) {
        const existingItem = this.cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                ...product,
                quantity: 1
            });
        }
        
        this.saveCart();
        this.updateCartCount();
        this.showNotification(`${product.name} добавлен в корзину`);
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
        this.updateCartCount();
        this.renderCart();
    }

    updateQuantity(productId, change) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                this.removeFromCart(productId);
            } else {
                this.saveCart();
                this.updateCartCount();
                this.renderCart();
            }
        }
    }

    renderCart() {
        const container = document.getElementById('cart-items');
        const totalElement = document.getElementById('cart-total');
        
        if (this.cart.length === 0) {
            container.innerHTML = '<p class="empty-cart">Корзина пуста</p>';
            totalElement.textContent = '0 ₽';
            return;
        }
        
        let total = 0;
        container.innerHTML = '';
        
        this.cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p class="price">${item.price} ₽ × ${item.quantity} = ${itemTotal} ₽</p>
                </div>
                <div class="cart-item-controls">
                    <button class="quantity-btn minus" data-id="${item.id}">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn plus" data-id="${item.id}">+</button>
                    <button class="remove-btn" data-id="${item.id}">Удалить</button>
                </div>
            `;
            
            cartItem.querySelector('.minus').addEventListener('click', () => {
                this.updateQuantity(item.id, -1);
            });
            
            cartItem.querySelector('.plus').addEventListener('click', () => {
                this.updateQuantity(item.id, 1);
            });
            
            cartItem.querySelector('.remove-btn').addEventListener('click', () => {
                this.removeFromCart(item.id);
            });
            
            container.appendChild(cartItem);
        });
        
        totalElement.textContent = `${total} ₽`;
    }

    showCart() {
        this.hideAllSections();
        document.getElementById('cart-section').classList.remove('hidden');
        this.renderCart();
    }

    showCatalog() {
        this.hideAllSections();
        document.getElementById('catalog').classList.remove('hidden');
    }

    showCheckout() {
        if (this.cart.length === 0) {
            this.showNotification('Добавьте товары в корзину');
            return;
        }
        
        this.hideAllSections();
        document.getElementById('checkout-section').classList.remove('hidden');
        this.renderOrderReview();
    }

    renderOrderReview() {
        const container = document.getElementById('order-review');
        const totalElement = document.getElementById('order-total');
        
        let total = 0;
        container.innerHTML = '';
        
        this.cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            
            const itemElement = document.createElement('div');
            itemElement.className = 'order-review-item';
            itemElement.innerHTML = `
                <span>${item.name} × ${item.quantity}</span>
                <span>${itemTotal} ₽</span>
            `;
            container.appendChild(itemElement);
        });
        
        totalElement.textContent = `${total} ₽`;
    }

    async submitOrder() {
        const order = {
            id: Date.now(),
            customer: {
                name: document.getElementById('name').value,
                phone: document.getElementById('phone').value,
                address: document.getElementById('address').value,
                comment: document.getElementById('comment').value
            },
            items: this.cart,
            total: this.getCartTotal(),
            status: 'new',
            createdAt: new Date().toISOString()
        };
        
        try {
            // Отправка в Google Sheets через бэкенд
            const response = await fetch('https://your-pythonanywhere-app.pythonanywhere.com/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(order)
            });
            
            if (response.ok) {
                this.showNotification('Заказ успешно оформлен!');
                this.cart = [];
                this.saveCart();
                this.updateCartCount();
                this.showCatalog();
                
                // Очистка формы
                document.getElementById('checkout-form').reset();
            } else {
                throw new Error('Ошибка при сохранении заказа');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showNotification('Ошибка при оформлении заказа', 'error');
        }
    }

    async handleLogin() {
        const role = document.getElementById('role').value;
        const password = document.getElementById('password').value;
        
        // Простая проверка пароля (в реальном приложении нужно использовать безопасную аутентификацию)
        const passwords = {
            manager: 'manager123',
            courier: 'courier123',
            customer: ''
        };
        
        if (role === 'customer' || password === passwords[role]) {
            this.userRole = role;
            this.hideLoginModal();
            this.updateUIForRole();
            
            if (role !== 'customer') {
                await this.loadOrders();
                this.showAdminPanel();
            } else {
                this.showCatalog();
            }
            
            this.showNotification(`Вы вошли как ${this.getRoleName(role)}`);
        } else {
            this.showNotification('Неверный пароль', 'error');
        }
    }

    async loadOrders() {
        try {
            const response = await fetch('https://your-pythonanywhere-app.pythonanywhere.com/api/orders');
            if (response.ok) {
                this.orders = await response.json();
                this.renderAdminPanel();
            }
        } catch (error) {
            console.error('Error loading orders:', error);
            // Используем тестовые данные
            this.orders = [
                {
                    id: 1001,
                    customer: { name: 'Иван Иванов', phone: '+79991234567', address: 'ул. Ленина, 1' },
                    items: [{ name: 'Пицца Маргарита', quantity: 1, price: 450 }],
                    total: 450,
                    status: 'new',
                    createdAt: '2024-01-15T10:30:00Z'
                },
                {
                    id: 1002,
                    customer: { name: 'Мария Петрова', phone: '+79997654321', address: 'ул. Мира, 15' },
                    items: [{ name: 'Чизбургер', quantity: 2, price: 320 }, { name: 'Кола', quantity: 1, price: 120 }],
                    total: 760,
                    status: 'preparing',
                    createdAt: '2024-01-15T11:15:00Z'
                }
            ];
            this.renderAdminPanel();
        }
    }

    renderAdminPanel() {
        const container = document.getElementById('admin-panel');
        const title = document.getElementById('admin-title');
        
        if (this.userRole === 'manager') {
            title.textContent = 'Панель менеджера - Все заказы';
            this.renderManagerPanel(container);
        } else if (this.userRole === 'courier') {
            title.textContent = 'Панель курьера - Мои заказы';
            this.renderCourierPanel(container);
        }
    }

    renderManagerPanel(container) {
        container.innerHTML = `
            <div class="orders-list">
                ${this.orders.map(order => `
                    <div class="order-card">
                        <div class="order-header">
                            <span class="order-id">Заказ #${order.id}</span>
                            <span class="order-status status-${order.status}">${this.getStatusText(order.status)}</span>
                        </div>
                        <div class="order-details">
                            <p><strong>Клиент:</strong> ${order.customer.name}</p>
                            <p><strong>Телефон:</strong> ${order.customer.phone}</p>
                            <p><strong>Адрес:</strong> ${order.customer.address}</p>
                            <p><strong>Комментарий:</strong> ${order.customer.comment || 'нет'}</p>
                            <ul class="order-items">
                                ${order.items.map(item => `
                                    <li>
                                        <span>${item.name} × ${item.quantity}</span>
                                        <span>${item.price * item.quantity} ₽</span>
                                    </li>
                                `).join('')}
                            </ul>
                            <p class="total-row"><strong>Итого:</strong> ${order.total} ₽</p>
                        </div>
                        <div class="order-actions">
                            ${order.status === 'new' ? `
                                <button class="btn primary" onclick="app.updateOrderStatus(${order.id}, 'preparing')">
                                    В приготовление
                                </button>
                            ` : ''}
                            ${order.status === 'preparing' ? `
                                <button class="btn primary" onclick="app.updateOrderStatus(${order.id}, 'ready')">
                                    Готов к выдаче
                                </button>
                            ` : ''}
                            ${order.status === 'ready' ? `
                                <button class="btn secondary" onclick="app.assignCourier(${order.id})">
                                    Назначить курьера
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderCourierPanel(container) {
        const courierOrders = this.orders.filter(order => 
            order.status === 'ready' || order.status === 'delivering'
        );
        
        container.innerHTML = `
            <div class="orders-list">
                ${courierOrders.map(order => `
                    <div class="order-card">
                        <div class="order-header">
                            <span class="order-id">Заказ #${order.id}</span>
                            <span class="order-status status-${order.status}">${this.getStatusText(order.status)}</span>
                        </div>
                        <div class="order-details">
                            <p><strong>Клиент:</strong> ${order.customer.name}</p>
                            <p><strong>Телефон:</strong> ${order.customer.phone}</p>
                            <p><strong>Адрес:</strong> ${order.customer.address}</p>
                            <ul class="order-items">
                                ${order.items.map(item => `
                                    <li>${item.name} × ${item.quantity}</li>
                                `).join('')}
                            </ul>
                        </div>
                        <div class="order-actions">
                            <button class="btn primary" onclick="app.updateOrderStatus(${order.id}, 'delivering')">
                                Начать доставку
                            </button>
                            <button class="btn secondary" onclick="app.updateOrderStatus(${order.id}, 'delivered')">
                                Завершить доставку
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    async updateOrderStatus(orderId, status) {
        try {
            const response = await fetch(`https://your-pythonanywhere-app.pythonanywhere.com/api/orders/${orderId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });
            
            if (response.ok) {
                const order = this.orders.find(o => o.id === orderId);
                if (order) {
                    order.status = status;
                }
                this.renderAdminPanel();
                this.showNotification('Статус обновлен');
            }
        } catch (error) {
            console.error('Error updating order:', error);
            this.showNotification('Ошибка при обновлении статуса', 'error');
        }
    }

    getStatusText(status) {
        const statuses = {
            new: 'Новый',
            preparing: 'Готовится',
            ready: 'Готов',
            delivering: 'Доставляется',
            delivered: 'Доставлен'
        };
        return statuses[status] || status;
    }

    getRoleName(role) {
        const roles = {
            customer: 'Клиент',
            manager: 'Менеджер',
            courier: 'Курьер'
        };
        return roles[role] || role;
    }

    updateUIForRole() {
        const loginBtn = document.getElementById('login-btn');
        if (this.userRole === 'customer') {
            loginBtn.textContent = 'Вход';
        } else {
            loginBtn.textContent = this.getRoleName(this.userRole);
        }
    }

    showAdminPanel() {
        this.hideAllSections();
        document.getElementById('admin-section').classList.remove('hidden');
    }

    logout() {
        this.userRole = 'customer';
        this.updateUIForRole();
        this.showCatalog();
        this.showNotification('Вы вышли из системы');
    }

    filterProducts(category) {
        if (category === 'all') {
            this.renderProducts();
        } else {
            const filtered = this.products.filter(p => p.category === category);
            this.renderProducts(filtered);
        }
    }

    searchProducts(query) {
        const filtered = this.products.filter(p => 
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.description.toLowerCase().includes(query.toLowerCase())
        );
        this.renderProducts(filtered);
    }

    getCartTotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    updateCartCount() {
        const count = this.cart.reduce((total, item) => total + item.quantity, 0);
        document.getElementById('cart-count').textContent = count;
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
    }

    loadCart() {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            this.cart = JSON.parse(savedCart);
            this.updateCartCount();
        }
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        document.getElementById(screenId).classList.remove('hidden');
    }

    hideAllSections() {
        document.querySelectorAll('#catalog, #cart-section, #checkout-section, #admin-section').forEach(section => {
            section.classList.add('hidden');
        });
    }

    showLoginModal() {
        document.getElementById('login-modal').classList.remove('hidden');
    }

    hideLoginModal() {
        document.getElementById('login-modal').classList.add('hidden');
        document.getElementById('login-form').reset();
    }

    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        const text = document.getElementById('notification-text');
        
        text.textContent = message;
        notification.style.background = type === 'error' ? '#e74c3c' : '#2ecc71';
        notification.classList.remove('hidden');
        
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 3000);
    }
}

// Инициализация приложения
const app = new RestaurantApp();
window.app = app; // Делаем доступным глобально для обработчиков в HTML
