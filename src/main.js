const art = (background, accent, symbol) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500"><rect width="800" height="500" fill="${background}"/><circle cx="670" cy="90" r="170" fill="${accent}" opacity=".25"/><circle cx="120" cy="470" r="230" fill="${accent}" opacity=".18"/><path d="M0 390 Q180 300 360 405 T800 340 V500 H0Z" fill="${accent}" opacity=".2"/><text x="400" y="300" text-anchor="middle" font-family="Arial" font-size="150" fill="${accent}" opacity=".9">${symbol}</text></svg>`)}`;

const demoListings = [
  { name: "Bosch Professional Drill", category: "Construction", price: 199, deposit: 398, rating: "4.9", reviews: 18, owner: "Jignesh P.", address: "12 College Road, Nadiad, Gujarat", image: art("#dce6ef", "#47779b", "⚙"), tone: "blue" },
  { name: "Petrol Lawn Mower", category: "Gardening", price: 450, deposit: 900, rating: "5.0", reviews: 11, owner: "GardenPro Nadiad", address: "8 Pij Road, Nadiad, Gujarat", image: art("#dfead6", "#4f8c54", "✾"), tone: "green" },
  { name: "Heavy Duty Angle Grinder", category: "Construction", price: 275, deposit: 550, rating: "4.8", reviews: 24, owner: "Mahesh Tools", address: "24 Santram Road, Nadiad, Gujarat", image: art("#f1dfc8", "#b8722d", "◈"), tone: "orange" },
  { name: "Electric Hedge Trimmer", category: "Gardening", price: 300, deposit: 600, rating: "4.9", reviews: 7, owner: "Khedut Rentals", address: "3 Uttarsanda Road, Nadiad, Gujarat", image: art("#e2edcf", "#6f9e38", "⌁"), tone: "lime" },
  { name: "Portable Concrete Mixer", category: "Construction", price: 1200, deposit: 2400, rating: "4.7", reviews: 9, owner: "Patel BuildMart", address: "45 Dabhan Road, Nadiad, Gujarat", image: art("#eee4c7", "#b08a32", "▦"), tone: "yellow" },
  { name: "Garden Pressure Sprayer", category: "Gardening", price: 180, deposit: 360, rating: "4.8", reviews: 14, owner: "GreenGrow Nadiad", address: "17 Santram Society, Nadiad, Gujarat", image: art("#d9ece0", "#38866a", "❋"), tone: "mint" },
];
let listings = [...demoListings];
const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

const grid = document.querySelector("#listing-grid");
const empty = document.querySelector("#empty-state");
const searchInput = document.querySelector("#search-input");
let activeCategory = "All";

async function loadSharedListings() {
  try {
    const response = await fetch("/api/listings");
    if (!response.ok) throw new Error("Could not load saved equipment");
    let sharedListings = await response.json();
    const oldBrowserListings = JSON.parse(localStorage.getItem("rentmate-listings") || "[]");
    let migratedAll = true;
    for (const item of oldBrowserListings) {
      const migrated = await fetch("/api/listings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...item, id: item.id || crypto.randomUUID() }) });
      if (migrated.ok) sharedListings.unshift(await migrated.json());
      else migratedAll = false;
    }
    if (migratedAll) localStorage.removeItem("rentmate-listings");
    listings = [...demoListings, ...sharedListings];
    render();
  } catch (error) {
    console.error("RentMate needs to be opened from its server to share listings.", error);
  }
}

function render() {
  const query = searchInput.value.toLowerCase().trim();
  const sorted = [...listings].filter(item => (activeCategory === "All" || activeCategory === "Popular" || item.category === activeCategory) && (!query || `${item.name} ${item.category}`.toLowerCase().includes(query)));
  const sort = document.querySelector("#sort-select").value;
  if (sort === "price-low") sorted.sort((a, b) => a.price - b.price);
  if (sort === "price-high") sorted.sort((a, b) => b.price - a.price);
  grid.innerHTML = sorted.map(item => `<article class="listing-card"><div class="listing-image ${escapeHTML(item.tone)}" style="background-image:url('${item.image}')"><span class="heart">♡</span><span class="distance">${item.category === "Gardening" ? "1.8" : "2.4"} km away</span></div><div class="listing-content"><div class="listing-top"><span class="listing-category">${escapeHTML(item.category)}</span><span class="rating">★ ${escapeHTML(item.rating)} <small>(${item.reviews})</small></span></div><h3>${escapeHTML(item.name)}</h3><p class="owner">Listed by ${escapeHTML(item.owner)}</p><div class="price-row"><span><strong>₹${Number(item.price).toLocaleString("en-IN")}</strong> / day</span><button class="round-arrow product-trigger" data-product="${listings.indexOf(item)}" aria-label="View ${escapeHTML(item.name)}">↗</button></div></div></article>`).join("");
  empty.hidden = sorted.length > 0;
}

document.querySelectorAll("[data-category]").forEach(button => button.addEventListener("click", () => { document.querySelectorAll("[data-category]").forEach(item => item.classList.remove("active")); button.classList.add("active"); activeCategory = button.dataset.category; render(); }));
document.querySelectorAll("[data-search]").forEach(button => button.addEventListener("click", () => { searchInput.value = button.dataset.search; render(); document.querySelector(".listings-section").scrollIntoView({ behavior: "smooth" }); }));
searchInput.addEventListener("input", render);
document.querySelector("#search-button").addEventListener("click", () => document.querySelector(".listings-section").scrollIntoView({ behavior: "smooth" }));
document.querySelector("#sort-select").addEventListener("change", render);
const modal = document.querySelector("#modal");
document.querySelector("#list-button").addEventListener("click", () => { modal.hidden = false; document.body.classList.add("modal-open"); });
document.querySelector("#modal-close").addEventListener("click", () => { modal.hidden = true; document.body.classList.remove("modal-open"); });
modal.addEventListener("click", event => { if (event.target === modal) { modal.hidden = true; document.body.classList.remove("modal-open"); } });
const listingPhoto = document.querySelector("#listing-photo");
let listingPhotoData = "";
listingPhoto.addEventListener("change", () => {
  const file = listingPhoto.files[0];
  if (!file) return;
  if (file.size > 4 * 1024 * 1024) { listingPhoto.setCustomValidity("Choose an image smaller than 4 MB"); listingPhoto.reportValidity(); listingPhoto.value = ""; return; }
  listingPhoto.setCustomValidity("");
  const reader = new FileReader();
  reader.onload = () => { listingPhotoData = reader.result; const preview = document.querySelector("#photo-preview"); preview.innerHTML = `<img src="${listingPhotoData}" alt="Equipment preview" />`; preview.hidden = false; };
  reader.readAsDataURL(file);
});
document.querySelector("#list-form").addEventListener("submit", async event => {
  event.preventDefault();
  const newListing = { id: crypto.randomUUID(), name: document.querySelector("#listing-name").value.trim(), category: document.querySelector("#listing-category").value, price: Number(document.querySelector("#listing-rent").value), deposit: Number(document.querySelector("#listing-deposit").value), address: document.querySelector("#listing-address").value.trim(), owner: "RentMate member", image: listingPhotoData, rating: "New", reviews: 0, tone: "green" };
  let savedListing;
  try {
    const response = await fetch("/api/listings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newListing) });
    if (!response.ok) throw new Error("Server did not save the listing");
    savedListing = await response.json();
  } catch (error) {
    alert("Could not save the listing. Please make sure RentMate is open from http://localhost:8000 and try again.");
    return;
  }
  listings.unshift(savedListing);
  activeCategory = "All";
  document.querySelectorAll("[data-category]").forEach(button => button.classList.toggle("active", button.dataset.category === "All"));
  searchInput.value = "";
  render();
  event.target.innerHTML = `<div class="success-message"><span>✓</span><h3>Equipment published!</h3><p>${escapeHTML(newListing.name)} is now visible in the Nadiad equipment listings.</p></div>`;
  setTimeout(() => { modal.hidden = true; document.body.classList.remove("modal-open"); document.querySelector(".listings-section").scrollIntoView({ behavior: "smooth" }); }, 1100);
});
const loginModal = document.querySelector("#login-modal");
const loginForm = document.querySelector("#login-form");
const accountButton = document.querySelector("#account-button");
const phoneNumber = document.querySelector("#phone-number");
function openLogin() { loginModal.hidden = false; document.body.classList.add("modal-open"); setTimeout(() => phoneNumber.focus(), 50); }
function closeLogin() { loginModal.hidden = true; document.body.classList.remove("modal-open"); }
accountButton.addEventListener("click", openLogin);
document.querySelector("#login-close").addEventListener("click", closeLogin);
loginModal.addEventListener("click", event => { if (event.target === loginModal) closeLogin(); });
loginForm.addEventListener("submit", event => {
  event.preventDefault();
  const phone = phoneNumber.value.replace(/\D/g, "");
  if (phone.length !== 10) { phoneNumber.setCustomValidity("Enter a valid 10-digit mobile number"); phoneNumber.reportValidity(); return; }
  phoneNumber.setCustomValidity("");
  loginForm.innerHTML = `<div class="otp-view"><span class="otp-icon">✓</span><p class="eyebrow">ONE LAST STEP</p><h3>Enter your OTP</h3><p>We sent a 6-digit code to +91 ${phone.slice(0, 5)} ${phone.slice(5)}.</p><label>Verification code<input id="otp-input" type="text" inputmode="numeric" maxlength="6" placeholder="• • • • • •" required /></label><button class="primary-button" id="verify-otp" type="button">Verify and sign in <span>→</span></button><button class="resend-button" type="button">Resend code</button></div>`;
  document.querySelector("#verify-otp").addEventListener("click", () => {
    const otp = document.querySelector("#otp-input");
    if (otp.value.length !== 6) { otp.setCustomValidity("Enter the 6-digit OTP"); otp.reportValidity(); return; }
    accountButton.textContent = "AK";
    accountButton.classList.add("logged-in");
    loginForm.innerHTML = `<div class="success-message"><span>✓</span><h3>You’re signed in!</h3><p>Welcome to RentMate. You can now book equipment and manage your rentals.</p></div>`;
    setTimeout(closeLogin, 1400);
  });
});
document.querySelector("#google-login").addEventListener("click", () => { accountButton.classList.add("logged-in"); closeLogin(); });
const productModal = document.querySelector("#product-modal");
const pickupDate = document.querySelector("#pickup-date");
const returnDate = document.querySelector("#return-date");
let selectedProduct;
const today = new Date().toISOString().split("T")[0];
pickupDate.min = today;
returnDate.min = today;
grid.addEventListener("click", event => {
  const trigger = event.target.closest(".product-trigger");
  if (!trigger) return;
  selectedProduct = listings[Number(trigger.dataset.product)];
  document.querySelector("#product-image").style.backgroundImage = `url('${selectedProduct.image}')`;
  document.querySelector("#product-category").textContent = selectedProduct.category;
  document.querySelector("#product-rating").innerHTML = `★ ${selectedProduct.rating} <small>(${selectedProduct.reviews})</small>`;
  document.querySelector("#product-title").textContent = selectedProduct.name;
  document.querySelector("#product-owner").textContent = `Listed by ${selectedProduct.owner}`;
  document.querySelector("#product-price").textContent = `₹${selectedProduct.price.toLocaleString("en-IN")}`;
  document.querySelector("#product-deposit").textContent = `₹${Number(selectedProduct.deposit || selectedProduct.price * 2).toLocaleString("en-IN")}`;
  pickupDate.value = "";
  returnDate.value = "";
  document.querySelector("#book-button").hidden = false;
  document.querySelector("#payment-panel").hidden = true;
  document.querySelector("#confirm-payment").hidden = true;
  document.querySelector("#address-unlock").hidden = true;
  document.querySelector("#address-unlock").textContent = "";
  productModal.hidden = false;
  document.body.classList.add("modal-open");
});
function closeProductModal() { productModal.hidden = true; document.body.classList.remove("modal-open"); }
document.querySelector("#product-close").addEventListener("click", closeProductModal);
productModal.addEventListener("click", event => { if (event.target === productModal) closeProductModal(); });
pickupDate.addEventListener("change", () => { returnDate.min = pickupDate.value || today; if (returnDate.value && returnDate.value < returnDate.min) returnDate.value = ""; });
document.querySelector("#book-button").addEventListener("click", () => {
  if (!pickupDate.value || !returnDate.value) { pickupDate.reportValidity(); returnDate.reportValidity(); return; }
  if (returnDate.value < pickupDate.value) { returnDate.setCustomValidity("Return date must be on or after pickup date"); returnDate.reportValidity(); return; }
  returnDate.setCustomValidity("");
  const days = Math.floor((new Date(`${returnDate.value}T00:00:00`) - new Date(`${pickupDate.value}T00:00:00`)) / 86400000) + 1;
  const deposit = Number(selectedProduct.deposit || selectedProduct.price * 2);
  const rentTotal = Number(selectedProduct.price) * days;
  const paymentPanel = document.querySelector("#payment-panel");
  paymentPanel.innerHTML = `<p class="eyebrow">PAYMENT SUMMARY</p><div><span>Rent · ${days} ${days === 1 ? "day" : "days"}</span><strong>₹${rentTotal.toLocaleString("en-IN")}</strong></div><div><span>Refundable security deposit</span><strong>₹${deposit.toLocaleString("en-IN")}</strong></div><div class="payment-total"><span>Total due now</span><strong>₹${(rentTotal + deposit).toLocaleString("en-IN")}</strong></div><p>Demo checkout: no real payment will be charged.</p>`;
  paymentPanel.hidden = false;
  document.querySelector("#book-button").hidden = true;
  document.querySelector("#confirm-payment").hidden = false;
});
document.querySelector("#confirm-payment").addEventListener("click", async () => {
  const paymentButton = document.querySelector("#confirm-payment");
  paymentButton.disabled = true;
  paymentButton.innerHTML = "Processing…";
  let addressText = "";
  try {
    const response = await fetch(`/api/demo-checkout/${encodeURIComponent(selectedProduct.id)}`, { method: "POST" });
    if (!response.ok) throw new Error("Demo checkout failed");
    addressText = (await response.json()).address;
  } catch (error) {
    paymentButton.disabled = false;
    paymentButton.innerHTML = "Pay securely <span>→</span>";
    alert("Checkout needs the RentMate server. Please reopen the app at http://localhost:8000.");
    return;
  }
  const address = document.querySelector("#address-unlock");
  address.innerHTML = `<span class="address-check">✓</span><div><strong>Demo payment complete</strong><p>Owner pickup address</p><b>${escapeHTML(addressText)}</b></div>`;
  address.hidden = false;
  paymentButton.hidden = true;
});
render();
loadSharedListings();
