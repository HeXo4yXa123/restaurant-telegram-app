// Frontend app logic. Put your PythonAnywhere username into API_BASE.
const API_BASE = 'https://HeX04yXa.pythonanywhere.com'; // <-- REPLACE


let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let appMode = 'client';
let user = null;


document.addEventListener('DOMContentLoaded', ()=>{
setupEventListeners();
renderProducts();
updateCart();
});


function setupEventListeners(){
document.getElementById('authForm').addEventListener('submit', async (e)=>{
e.preventDefault();
const name = document.getElementById('authName').value.trim();
const username = document.getElementById('authUsername').value.trim();
const password = document.getElementById('authPassword').value.trim();
const role = document.getElementById('authRole').value;


user = { name, username, role };
document.getElementById('userWelcome').textContent = name || username || 'Гость';
document.getElementById('logoutBtn').style.display = 'inline-block';


if (role === 'client') switchToCustomer();
if (role === 'manager') await managerLogin(username, password);
if (role === 'courier') switchToCourier();
});


document.getElementById('cartBtn')?.addEventListener('click', toggleCart);
document.getElementById('closeCart')?.addEventListener('click', toggleCart);
document.getElementById('checkoutBtn')?.addEventListener('click', openOrderModal);
document.getElementById('closeModal')?.addEventListener('click', closeOrderModal);
document.getElementById('cancelOrder')?.addEventListener('click', closeOrderModal);
document.getElementById('confirmOrder')?.addEventListener('click', confirmOrder);
document.getElementById('refreshOrdersBtn')?.addEventListener('click', loadManagerOrders);
document.getElementById('showClientBtn')?.addEventListener('click', ()=>{ switchToCustomer(); });
document.getElementById('showManagerBtn')?.addEventListener('click', ()=>{ showLoginPanel(); });
document.getElementById('showCourierBtn')?.addEventListener('click', ()=>{ switchToCourier(); });
document.getElementById('cartBtnFooter')?.addEventListener('click', toggleCart);


document.addEventListener('click', function(e){
if (e.target.closest('.add-to-cart')){
const id = +e.target.closest('.add-to-cart').dataset.id;
addToCart(id);
}


if (e.target.closest('.remove-item')){
const id = +e.target.closest('.remove-item').dataset.id;
removeFromCart(id);
}


if (e.target.closest('.action-btn')){
const btn = e.target.closest('.action-btn');
const action = btn.dataset.action;
const orderId = btn.dataset.orderId;
updateOrderStatus(orderId, action);
}
});


// status filters
document.querySelectorAll('.status-filter').forEach(btn => btn.addEventListener('click', function(){ document.querySelectorAll('.status-filter').forEach(b=>b.classList.remove('active')); this.classList.add('active'); loadManagerOrders(); }));
}


// ---- products (example) ----
const PRODUCTS = [
{ id:1, name:'Пицца Маргарита', desc:'Томатный соус, моцарелла, базилик', price:450, icon:'🍕' },
{ id:2, name:'Хачапури', desc:'Сырный хачапури по-аджарски', price:390, icon:'🥟' },
{ id:3, name:'Бургер Классический', desc:'Говядина, сыр, соус', price:320, icon:'🍔' },
{ id:4, name:'Matcha Latte', desc:'Матча с молоком', price:280, icon:'🥤' }
];


function renderProducts(){
const grid = document.getElementById('productsGrid');
grid.innerHTML = PRODUCTS.map(p => `
<div class="product-card">
<div class="product-image">${p.icon}</div>
<div class="product-content">
<h4 class="product-title">${p.name}</h4>
<p class="product-description">${p.desc}</p>
<div class="product-footer">
<div class="product-price">${p.price} ₽</div>
<button class="add-to-cart" data-id="${p.id}">+</button>
</div>
</div>
</div>
`).join('');
}


// ---- cart ----
function addToCart(productId){
const p = PRODUCTS.find(x=>x.id===productId);
if (!p) return;
const existing = cart.find(i=>i.id===productId);
if (existing) existing.quantity++;
else cart.push({ id:p.id, name:p.name, price:p.price, quantity:1 });
updateCart();
showNotification(`${p.name} добавлен`,'success');
}


function removeFromCart(productId){ cart = cart.filter(i=>i.id!==productId); updateCart(); }


function updateQuantity(productId, delta){ const it = cart.find(i=>i.id===productId); if(!it) return; it.quantity+=delta; if(it.quantity<=0) removeFromCart(productId); else updateCart(); }


function updateCart(){ localStorage.setItem('cart', JSON.stringify(cart)); const totalItems = cart.reduce((s,i)=>s+i.quantity,0); document.getElementById('cartCount').textContent = totalItems; document.getElementById('cartCountHeader').textContent = totalItems; renderCartItems(); updateTotalPrice(); }

