const initialProducts = [
  { id: 1, name: "Álbum de Figurinhas Copa 2026", category: "Figurinhas", store: "Banca do Renato", stock: 12, price: 12.00, icon: "⚽" },
  { id: 2, name: "Jornal do Dia", category: "Livros e revistas", store: "Banca do Renato", stock: 8, price: 2.50, icon: "📰" },
  { id: 3, name: "Canetas coloridas (kit com 10)", category: "Papelaria", store: "Papelaria da Praça", stock: 0, price: 19.90, icon: "🖍️" },
  { id: 4, name: "Cartas colecionáveis", category: "Lançamentos", store: "Livraria do Bairro", stock: 5, price: 49.90, icon: "🃏" },
  { id: 5, name: "Revista de passatempos", category: "Livros e revistas", store: "Banca do Renato", stock: 4, price: 8.00, icon: "📚" }
];

let products = load("temai-products", initialProducts);
let reservations = load("temai-reservations", []);
let selectedCategory = "";
let selectedProduct = null;
let currentView = "customer";
let merchantMode = false;

const productList = document.querySelector("#product-list");
const searchInput = document.querySelector("#search");
const modeToggle = document.querySelector("#mode-toggle");
const main = document.querySelector("#main-content");
const dialog = document.querySelector("#reserve-dialog");
const toast = document.querySelector("#toast");

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || structuredClone(fallback); }
  catch { return structuredClone(fallback); }
}
function save() {
  localStorage.setItem("temai-products", JSON.stringify(products));
  localStorage.setItem("temai-reservations", JSON.stringify(reservations));
}
function money(value) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function notify(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2600);
}
function renderProducts() {
  const term = searchInput.value.trim().toLocaleLowerCase("pt-BR");
  const visible = products.filter(p =>
    (!selectedCategory || p.category === selectedCategory) &&
    [p.name, p.store, p.category].some(v => v.toLocaleLowerCase("pt-BR").includes(term))
  );
  document.querySelector("#result-count").textContent = `${visible.length} ${visible.length === 1 ? "item" : "itens"}`;
  productList.innerHTML = visible.length ? visible.map(p => `
    <article class="product-card">
      <div class="product-art" aria-hidden="true">${p.icon}</div>
      <div class="product-body">
        <h3>${escapeHTML(p.name)}</h3>
        <div class="store-line">⌂ ${escapeHTML(p.store)}</div>
        <span class="stock-pill">${p.stock > 0 ? `Disponível · ${p.stock} un.` : "Esgotado"}</span>
        <div class="price">${money(p.price)}</div>
        <button class="primary reserve-btn" data-id="${p.id}" ${p.stock < 1 ? "disabled" : ""}>
          ${p.stock > 0 ? "Reservar" : "Indisponível"}
        </button>
      </div>
    </article>`).join("") : `<p class="empty">Não encontramos produtos com essa busca. Tente outro termo.</p>`;
  productList.querySelectorAll(".reserve-btn").forEach(btn => btn.addEventListener("click", () => openReservation(Number(btn.dataset.id))));
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char]));
}
function openReservation(id) {
  selectedProduct = products.find(p => p.id === id);
  if (!selectedProduct || selectedProduct.stock <= 0) return;
  document.querySelector("#reserve-title").textContent = selectedProduct.name;
  document.querySelector("#reserve-store").textContent = `Estabelecimento: ${selectedProduct.store}`;
  document.querySelector("#reserve-quantity").max = selectedProduct.stock;
  document.querySelector("#reserve-quantity").value = 1;
  document.querySelector("#customer-name").value = "";
  dialog.showModal();
}
document.querySelector("#reserve-form").addEventListener("submit", event => {
  event.preventDefault();
  if (!selectedProduct) return;
  const name = document.querySelector("#customer-name").value.trim();
  const quantity = Number(document.querySelector("#reserve-quantity").value);
  if (!name || quantity < 1 || quantity > selectedProduct.stock) {
    notify("Confira o nome e a quantidade disponível.");
    return;
  }
  selectedProduct.stock -= quantity;
  const code = `TH${String(Date.now()).slice(-6)}`;
  reservations.unshift({ code, name, product: selectedProduct.name, store: selectedProduct.store, quantity, status: "Aguardando confirmação" });
  save();
  dialog.close();
  renderProducts();
  notify(`Reserva registrada! Código: ${code}`);
});
document.querySelectorAll(".category").forEach(btn => btn.addEventListener("click", () => {
  selectedCategory = selectedCategory === btn.dataset.category ? "" : btn.dataset.category;
  document.querySelectorAll(".category").forEach(c => c.classList.toggle("selected", c.dataset.category === selectedCategory));
  renderProducts();
}));
document.querySelector("#clear-category").addEventListener("click", () => {
  selectedCategory = "";
  document.querySelectorAll(".category").forEach(c => c.classList.remove("selected"));
  renderProducts();
});
searchInput.addEventListener("input", renderProducts);

function renderReservations() {
  main.innerHTML = `
    <section class="section">
      <div class="section-heading"><h2>Minhas reservas</h2><button class="text-button" data-back>Voltar ao início</button></div>
      ${reservations.length ? reservations.map(r => `<div class="product-row"><div><strong>${escapeHTML(r.product)}</strong><p class="muted">${escapeHTML(r.store)} · ${r.quantity} un.</p><small>Código: ${escapeHTML(r.code)} · ${escapeHTML(r.status)}</small></div></div>`).join("") : `<p class="empty">Você ainda não fez nenhuma reserva neste navegador.</p>`}
    </section>`;
  main.querySelector("[data-back]").addEventListener("click", () => renderCustomer());
}
function renderCustomer() {
  currentView = "customer";
  main.innerHTML = `
    <section class="hero"><div><p class="eyebrow">COMÉRCIO PERTO DE VOCÊ</p><h1>O que você procura,<br><span>pode estar pertinho</span> de você!</h1><p>Consulte a disponibilidade e reserve no comércio local.</p></div><div class="hero-art" aria-hidden="true">🏪</div></section>
    <section class="section"><div class="section-heading"><h2>Categorias em destaque</h2><button class="text-button" id="clear-category">Ver todas</button></div><div class="categories">
      <button class="category" data-category="Lançamentos"><span>★</span>Lançamentos</button><button class="category" data-category="Livros e revistas"><span>▤</span>Livros e revistas</button><button class="category" data-category="Figurinhas"><span>⚽</span>Figurinhas</button><button class="category" data-category="Papelaria"><span>✎</span>Papelaria</button><button class="category" data-category="Outros"><span>＋</span>Outros</button>
    </div></section>
    <section class="section"><div class="section-heading"><h2>Produtos disponíveis perto de você</h2><span class="muted" id="result-count"></span></div><div id="product-list" class="product-grid"></div></section>`;
  main.querySelectorAll(".category").forEach(btn => btn.addEventListener("click", () => {
    selectedCategory = selectedCategory === btn.dataset.category ? "" : btn.dataset.category;
    main.querySelectorAll(".category").forEach(c => c.classList.toggle("selected", c.dataset.category === selectedCategory));
    renderProducts();
  }));
  main.querySelector("#clear-category").addEventListener("click", () => { selectedCategory = ""; renderCustomer(); });
  renderProducts();
}
function renderMerchant() {
  currentView = "merchant";
  main.innerHTML = `
    <section class="hero"><div><p class="eyebrow">PAINEL DO COMERCIANTE</p><h1>Olá, comerciante!<br><span>Vamos cuidar da sua loja?</span></h1><p>Atualize seus produtos e acompanhe as reservas de forma simples.</p></div><div class="hero-art" aria-hidden="true">🛍️</div></section>
    <section class="section"><div class="section-heading"><h2>Resumo da loja</h2><span class="stock-pill">${products.length} produtos cadastrados</span></div>
    <div class="merchant-panel">
      <div class="panel-card"><h3>Adicionar produto</h3>
        <form id="add-product">
          <div class="field"><label for="new-name">Nome do produto</label><input id="new-name" required maxlength="100" placeholder="Ex.: álbum de figurinhas"></div>
          <div class="field"><label for="new-category">Categoria</label><select id="new-category"><option>Figurinhas</option><option>Livros e revistas</option><option>Papelaria</option><option>Lançamentos</option><option>Outros</option></select></div>
          <div class="field"><label for="new-store">Estabelecimento</label><input id="new-store" required value="Banca do Renato" maxlength="80"></div>
          <div class="field"><label for="new-stock">Quantidade disponível</label><input id="new-stock" type="number" min="0" value="1" required></div>
          <div class="field"><label for="new-price">Preço (R$)</label><input id="new-price" type="number" min="0" step="0.01" value="0" required></div>
          <button class="primary">Cadastrar produto</button>
        </form>
      </div>
      <div class="panel-card"><h3>Produtos e estoque</h3><div id="merchant-products"></div></div>
    </div></section>
    <section class="section"><div class="section-heading"><h2>Reservas recebidas</h2><span class="muted">${reservations.length} no total</span></div>
      ${reservations.length ? reservations.map(r => `<div class="product-row"><div><strong>${escapeHTML(r.product)}</strong><p class="muted">${escapeHTML(r.name)} · ${r.quantity} un. · ${escapeHTML(r.store)}</p><small>Código ${escapeHTML(r.code)}</small></div><span class="stock-pill">${escapeHTML(r.status)}</span></div>`).join("") : `<p class="muted">Ainda não há reservas.</p>`}
    </section>`;
  main.querySelector("#add-product").addEventListener("submit", event => {
    event.preventDefault();
    const name = main.querySelector("#new-name").value.trim();
    const category = main.querySelector("#new-category").value;
    const store = main.querySelector("#new-store").value.trim();
    const stock = Number(main.querySelector("#new-stock").value);
    const price = Number(main.querySelector("#new-price").value);
    products.unshift({ id: Date.now(), name, category, store, stock, price, icon: category === "Figurinhas" ? "⚽" : category === "Papelaria" ? "✎" : "📦" });
    save(); renderMerchant(); notify("Produto cadastrado com sucesso!");
  });
  renderMerchantProducts();
}
function renderMerchantProducts() {
  const target = main.querySelector("#merchant-products");
  if (!target) return;
  target.innerHTML = products.map(p => `<div class="product-row"><div><strong>${escapeHTML(p.name)}</strong><p class="muted">${escapeHTML(p.store)} · ${p.stock} disponível(is)</p></div><div class="qty"><button data-id="${p.id}" data-change="-1" aria-label="Diminuir estoque">−</button><button data-id="${p.id}" data-change="1" aria-label="Aumentar estoque">+</button></div></div>`).join("");
  target.querySelectorAll("button").forEach(btn => btn.addEventListener("click", () => {
    const product = products.find(p => p.id === Number(btn.dataset.id));
    product.stock = Math.max(0, product.stock + Number(btn.dataset.change));
    save(); renderMerchantProducts(); notify("Estoque atualizado.");
  }));
}
document.querySelectorAll(".nav-item").forEach(btn => btn.addEventListener("click", () => {
  document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("active", b === btn));
  if (btn.dataset.view === "customer") renderCustomer();
  if (btn.dataset.view === "reservations") renderReservations();
  if (btn.dataset.view === "merchant") renderMerchant();
}));
modeToggle.addEventListener("click", () => {
  merchantMode = !merchantMode;
  modeToggle.textContent = merchantMode ? "Voltar para área do cliente" : "Área do comerciante";
  document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.view === (merchantMode ? "merchant" : "customer")));
  merchantMode ? renderMerchant() : renderCustomer();
});
renderProducts();
