// === НАСТРОЙКА API ===
// ВСТАВЬ СВОЙ ЛОГИН ВМЕСТО 'yourusername'
const API_BASE = "https://HeX04yXa.pythonanywhere.com";

// Пример функций для обращения к API

// Авторизация
async function login(username, password, role) {
    const res = await fetch(`${API_BASE}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role })
    });

    return res.json();
}

// Создать заказ
async function createOrder(orderData) {
    const res = await fetch(`${API_BASE}/create_order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData)
    });

    return res.json();
}

// Получить список заказов (для менеджера или курьера)
async function getOrders() {
    const res = await fetch(`${API_BASE}/get_orders`);
    return res.json();
}

// Обновить статус заказа
async function updateOrder(id, status) {
    const res = await fetch(`${API_BASE}/update_order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status })
    });

    return res.json();
}


// ======================
// ДЛЯ ТЕСТА В КОНСОЛИ
// ======================
console.log("app.js загружен, API =", API_BASE);
