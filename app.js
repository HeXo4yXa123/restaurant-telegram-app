const API_BASE = "https://hex04yxa.pythonanywhere.com";

let role = null;
let cart = [];
const products = [
    {name: "Пицца Маргарита", price: 450},
    {name: "Бургер", price: 320},
    {name: "Суши сет", price: 900},
    {name: "Паста", price: 500},
];

// --- Показ экранов ---
function show(id) {
    document.querySelectorAll(".screen").forEach(s => s.style.display = "none");
    document.getElementById(id).style.display = "block";
}

function selectRole(r) {
    role = r;

    if (r === "client") {
        loadMenu();
        show("client-menu");
    }
    if (r === "manager") {
        loadOrders();
        show("manager-screen");
    }
    if (r === "courier") {
        loadCourierOrders();
        show("courier-screen");
    }
}

// --- Клиент: меню ---
function loadMenu() {
    const list = document.getElementById("products");
    list.innerHTML = "";

    products.forEach((p, i) => {
        list.innerHTML += `
            <div class="card">
                <b>${p.name}</b><br>
                ${p.price} ₽<br><br>
                <button class="btn" onclick="addToCart(${i})">Добавить</button>
            </div>`;
    });
}

function addToCart(i) {
    cart.push(products[i]);
    alert("Добавлено в корзину");
}

function openCart() {
    const block = document.getElementById("cart-items");
    block.innerHTML = "";

    cart.forEach(p => {
        block.innerHTML += `<div class="card">${p.name} — ${p.price} ₽</div>`;
    });

    show("cart-screen");
}

function backToMenu() {
    show("client-menu");
}

// --- Отправка заказа ---
async function sendOrder() {
    const phone = document.getElementById("client-phone").value;
    const address = document.getElementById("client-address").value;

    if (!phone || !address || cart.length === 0) {
        alert("Заполните все поля!");
        return;
    }

    const orderText = cart.map(c => `${c.name} (${c.price} ₽)`).join(", ");
    const total = cart.reduce((a, b) => a + b.price, 0);

    const body = {
        phone,
        address,
        order: orderText,
        amount: total
    };

    const res = await fetch(API_BASE + "/create_order", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body)
    });

    const data = await res.json();
    alert(data.message);

    cart = [];
    show("client-menu");
}

// --- Менеджер: получить заказы ---
async function loadOrders() {
    const res = await fetch(API_BASE + "/orders");
    const data = await res.json();

    const box = document.getElementById("orders-list");
    box.innerHTML = "";

    data.forEach(o => {
        box.innerHTML += `
            <div class="card">
                <b>${o.id}</b><br>
                ${o.phone}<br>
                ${o.address}<br>
                ${o.order}<br>
                <b>${o.amount} ₽</b><br>
                Статус: ${o.status}
            </div>`;
    });
}

// --- Курьер ---
async function loadCourierOrders() {
    const res = await fetch(API_BASE + "/courier_orders");
    const data = await res.json();

    const box = document.getElementById("courier-orders");
    box.innerHTML = "";

    data.forEach(o => {
        box.innerHTML += `
            <div class="card">
                <b>${o.id}</b><br>
                ${o.address}<br>
                Заказ: ${o.order}
            </div>`;
    });
}
