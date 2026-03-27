(() => {
// Hàm chuẩn hóa chuỗi cực mạnh: Xóa dấu, viết thường và XÓA SẠCH khoảng trắng
function norm(s){
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, ""); // Xóa sạch tất cả khoảng trắng để so khớp chính xác
}

function buildCsvUrl(sheetId, gid){
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
}

function parseCSV(text){
  const rows = [];
  let i = 0, field = "", row = [], inQuotes = false;
  while(i < text.length){
    const c = text[i];
    if(inQuotes){
      if(c === '"'){
        if(text[i+1] === '"'){ field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += c; i++; continue;
    }
    if(c === '"'){ inQuotes = true; i++; continue; }
    if(c === ','){ row.push(field); field = ""; i++; continue; }
    if(c === "\n"){ row.push(field); field = ""; rows.push(row); row = []; i++; continue; }
    if(c === "\r"){ i++; continue; }
    field += c; i++;
  }
  row.push(field);
  rows.push(row);
  return rows;
}

function pickIdx(hmap, wanted){
  const w = norm(wanted);
  // Duyệt qua map để tìm key đã được chuẩn hóa
  for(const [k, idx] of hmap.entries()) {
    if(norm(k) === w) return idx;
  }
  return -1;
}

function viPrice(x){
  const s = String(x || "").trim();
  if(!s) return null;
  const cleaned = s.replace(/[^\d]/g, "");
  if(!cleaned) return null;
  const n = Number(cleaned);
  if(!Number.isFinite(n)) return null;
  return new Intl.NumberFormat("vi-VN").format(n) + "vnd";
}

function initialsOf(name){
  const parts = String(name || "").trim().split(/[\s\-_/]+/).filter(Boolean);
  return parts.map(p => p[0].toUpperCase()).slice(0,2).join("") || "NA";
}

function setText(id, value){
  const el = document.getElementById(id);
  if(el) el.textContent = value ?? "";
}

function setLink(id, label, href){
  const el = document.getElementById(id);
  if(!el) return;
  if(href){
    el.hidden = false;
    el.href = href;
    if(el.querySelector("span")) el.querySelector("span").textContent = label;
    else el.textContent = label;
  }else{
    el.hidden = true;
  }
}

function applyImage(imgId, fallbackId, url, fallbackText){
  const img = document.getElementById(imgId);
  const fallback = document.getElementById(fallbackId);
  if(!img) return;

  if(fallback){
    fallback.textContent = fallbackText || "";
    fallback.hidden = false;
  }
  img.hidden = true;
  img.removeAttribute("src");

  if(!url) return;

  img.onload = () => {
    img.hidden = false;
    if(fallback) fallback.hidden = true;
  };
  img.onerror = () => {
    img.hidden = true;
    if(fallback) fallback.hidden = false;
  };
  img.src = url;
}

const brandName = MY_INFO.brandName || "Tên shop";
const contactLink = MY_INFO.zaloLink || MY_INFO.facebookLink || MY_INFO.telegramLink || "#";

setText("brandName", brandName);
setText("brandFoot", brandName);
setText("heroKicker", MY_INFO.heroKicker || "Premium Services");
setText("heroTitle", MY_INFO.heroTitle || "Bảng giá dịch vụ");
setText("heroSubtitle", MY_INFO.heroSubtitle || "");
setText("ownerName", MY_INFO.ownerName || "Tên của bạn");
setText("ownerRole", MY_INFO.ownerRole || "");
setText("ownerDesc", MY_INFO.ownerDesc || "");

applyImage("brandLogo", "brandFallback", MY_INFO.logoUrl, initialsOf(brandName));
applyImage("ownerAvatar", "ownerAvatarFallback", MY_INFO.avatarUrl, initialsOf(MY_INFO.ownerName || brandName));

setLink("ownerPhone", MY_INFO.phone || "", MY_INFO.phone ? `tel:${MY_INFO.phone}` : "");
setLink("ownerEmail", MY_INFO.email || "", MY_INFO.email ? `mailto:${MY_INFO.email}` : "");
setLink("ownerZalo", "Zalo", MY_INFO.zaloLink || "");
setLink("ownerFacebook", "Facebook", MY_INFO.facebookLink || "");
setLink("ownerTelegram", "Telegram", MY_INFO.telegramLink || "");

const quickContactLink = document.getElementById("quickContactLink");
if(quickContactLink) quickContactLink.href = contactLink;

const heroContactBtn = document.getElementById("heroContactBtn");
if(heroContactBtn) heroContactBtn.href = contactLink;

const contactTopBtn = document.getElementById("contactTopBtn");
if(contactTopBtn){
  contactTopBtn.addEventListener("click", () => {
    if(contactLink && contactLink !== "#") window.open(contactLink, "_blank", "noopener");
  });
}

const footerNote = document.getElementById("footerNote");
if(footerNote && Array.isArray(MY_INFO.footerNotes)){
  footerNote.innerHTML = MY_INFO.footerNotes.map(v => `<div>- ${v}</div>`).join("");
}

const grid = document.getElementById("grid");
const notice = document.getElementById("notice");
const countLabel = document.getElementById("countLabel");
const searchInput = document.getElementById("searchInput");
const catBtn = document.getElementById("catBtn");
const catMenu = document.getElementById("catMenu");
const catLabel = document.getElementById("catLabel");

const modal = document.getElementById("orderModal");
const orderText = document.getElementById("orderText");
const copyBtn = document.getElementById("copyBtn");
const contactBtn = document.getElementById("contactBtn");
const closeModalBtn = document.getElementById("closeModal");

let allProducts = [];
let catOpen = false;
let selectedCat = "Tất cả";

function setNotice(msg){
  if(!notice) return;
  if(!msg){
    notice.hidden = true;
    notice.textContent = "";
    return;
  }
  notice.hidden = false;
  notice.textContent = msg;
}

function setCatOpen(open){
  catOpen = open;
  if(catMenu){
    catMenu.style.display = open ? "block" : "none";
    catMenu.setAttribute("aria-hidden", open ? "false" : "true");
  }
}

function openModal(text){
  if(!modal || !orderText) return;
  orderText.value = text;
  modal.setAttribute("aria-hidden", "false");
  if(contactBtn) contactBtn.href = contactLink;
}

function closeModal(){
  if(modal) modal.setAttribute("aria-hidden", "true");
}

if(catBtn){
  catBtn.addEventListener("click", () => setCatOpen(!catOpen));
}

document.addEventListener("click", (e) => {
  if(catMenu && catBtn && !catMenu.contains(e.target) && !catBtn.contains(e.target)){
    setCatOpen(false);
  }
});

if(closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
if(modal){
  modal.addEventListener("click", (e) => {
    if(e.target && e.target.dataset && e.target.dataset.close) closeModal();
  });
}

if(copyBtn){
  copyBtn.addEventListener("click", async () => {
    try{
      await navigator.clipboard.writeText(orderText.value);
      copyBtn.textContent = "Đã copy";
      setTimeout(() => copyBtn.textContent = "Copy nội dung", 1200);
    }catch{
      orderText.select();
      document.execCommand("copy");
    }
  });
}

function buildCategoryMenu(products){
  if(!catMenu || !catLabel) return;
  const cats = ["Tất cả", ...new Set(products.map(p => p.category || "Khác"))];
  catMenu.innerHTML = "";
  cats.forEach(cat => {
    const div = document.createElement("div");
    div.className = "dropdown-item" + (cat === selectedCat ? " active" : "");
    div.textContent = cat;
    div.addEventListener("click", () => {
      selectedCat = cat;
      catLabel.textContent = cat;
      [...catMenu.querySelectorAll(".dropdown-item")].forEach(el => el.classList.remove("active"));
      div.classList.add("active");
      setCatOpen(false);
      render();
    });
    catMenu.appendChild(div);
  });
  catLabel.textContent = selectedCat;
}

function findPrice(rows, pack, months, type){
  const hit = rows.find(r => r.pack === pack && r.months === months && r.type === type);
  if(hit) return hit.price;
  const hit2 = rows.find(r => r.pack === pack && r.months === months);
  if(hit2) return hit2.price;
  return "";
}

function render(){
  if(!grid || !countLabel || !searchInput) return;
  const q = norm(searchInput.value || "");
  const filtered = allProducts.filter(p => {
    const okSearch = !q || norm(p.name).includes(q);
    const okCat = selectedCat === "Tất cả" || p.category === selectedCat;
    return okSearch && okCat;
  });

  countLabel.textContent = `${filtered.length} sản phẩm`;
  grid.innerHTML = "";

  for(const p of filtered){
    const card = document.createElement("div");
    card.className = "card";

    const banner = document.createElement("div");
    banner.className = "banner";
    if(p.image){
      const img = document.createElement("img");
      img.src = p.image;
      img.alt = p.name;
      img.loading = "lazy";
      img.onerror = () => banner.innerHTML = `<div class="banner-fallback">${initialsOf(p.name)}</div>`;
      banner.appendChild(img);
    }else{
      banner.innerHTML = `<div class="banner-fallback">${initialsOf(p.name)}</div>`;
    }

    const body = document.createElement("div");
    body.className = "card-body";

    const top = document.createElement("div");
    top.className = "row-top";
    top.innerHTML = `<div class="title">${p.name}</div><div class="badge">${p.category || "Khác"}</div>`;

    const f1 = document.createElement("div");
    f1.className = "field";
    f1.innerHTML = `<div class="label">Gói</div>`;
    const selPack = document.createElement("select");
    selPack.className = "select";
    p.packages.forEach(v => {
      const o = document.createElement("option");
      o.value = v; o.textContent = v;
      selPack.appendChild(o);
    });
    f1.appendChild(selPack);

    const f2 = document.createElement("div");
    f2.className = "field";
    f2.innerHTML = `<div class="label">Số tháng</div>`;
    const selMonths = document.createElement("select");
    selMonths.className = "select";
    p.months.forEach(v => {
      const o = document.createElement("option");
      o.value = v; o.textContent = v;
      selMonths.appendChild(o);
    });
    f2.appendChild(selMonths);

    const f3 = document.createElement("div");
    f3.className = "field";
    f3.innerHTML = `<div class="label">Loại</div>`;
    const selType = document.createElement("select");
    selType.className = "select";
    p.types.forEach(v => {
      const o = document.createElement("option");
      o.value = v; o.textContent = v;
      selType.appendChild(o);
    });
    f3.appendChild(selType);

    const pricebar = document.createElement("div");
    pricebar.className = "pricebar";

    const priceEl = document.createElement("div");
    priceEl.className = "price";

    const btn = document.createElement("button");
    btn.className = "buybtn";

    function updatePrice(){
      const pack = selPack.value;
      const months = selMonths.value;
      const type = selType.value;
      const raw = findPrice(p.rows, pack, months, type);
      const pretty = viPrice(raw);

      if(pretty){
        priceEl.innerHTML = `<small>Giá</small><br>${pretty}`;
        btn.textContent = "Mua";
      }else{
        priceEl.innerHTML = `<small>Giá</small><br>Liên hệ`;
        btn.textContent = "Liên hệ";
      }

      btn.onclick = () => {
        const msg = `Mình muốn mua:\n- Dịch vụ: ${p.name}\n- Gói: ${pack}\n- Số tháng: ${months}\n- Loại: ${type}\n- Giá: ${pretty || "Liên hệ"}\n\n${MY_INFO.ownerName || brandName} xác nhận giúp mình nhé.`;
        openModal(msg);
      };
    }

    selPack.addEventListener("change", updatePrice);
    selMonths.addEventListener("change", updatePrice);
    selType.addEventListener("change", updatePrice);
    updatePrice();

    pricebar.appendChild(priceEl);
    pricebar.appendChild(btn);

    body.appendChild(top);
    body.appendChild(f1);
    body.appendChild(f2);
    body.appendChild(f3);
    body.appendChild(pricebar);

    card.appendChild(banner);
    card.appendChild(body);
    grid.appendChild(card);
  }
}

async function load(){
  try{
    const url = buildCsvUrl(SHEET_CONFIG.sheetId, SHEET_CONFIG.priceGid);
    const res = await fetch(url, { cache: "no-store" });
    if(!res.ok) throw new Error(`Không tải được Google Sheet (HTTP ${res.status}).`);
    const csv = await res.text();
    const rows = parseCSV(csv);
    if(rows.length < 2) throw new Error("Sheet rỗng.");

    const headers = rows[0];
    const hmap = new Map(headers.map((h, i) => [h, i]));

    const col = SHEET_CONFIG.columns || {};
    const idxProduct = pickIdx(hmap, col.product);
    const idxPackage = pickIdx(hmap, col.package);
    const idxMonths = pickIdx(hmap, col.months);
    const idxPrice = pickIdx(hmap, col.price);
    const idxType = pickIdx(hmap, col.type);
    const idxImage = pickIdx(hmap, col.image);

    if([idxProduct, idxPackage, idxMonths, idxPrice, idxType].some(i => i < 0)){
      throw new Error("Sheet chưa đúng cột. Cần: SẢN PHẨM, GÓI, SỐ THÁNG, GIÁ, LOẠI. ẢNH là tuỳ chọn.");
    }

    const out = [];
    let currentCategory = "Khác";

    for(let r = 1; r < rows.length; r++){
      const row = rows[r];
      const product = (row[idxProduct] || "").trim();
      const pack = (row[idxPackage] || "").trim();
      const months = (row[idxMonths] || "").trim();
      const price = (row[idxPrice] || "").trim();
      const type = (row[idxType] || "").trim();
      const image = idxImage >= 0 ? (row[idxImage] || "").trim() : "";

      if(!product) continue;

      if(product && !pack && !months && !price && !type){
        currentCategory = product;
        continue;
      }
      out.push({ product, pack, months, price, type, image, category: currentCategory });
    }

    const by = new Map();
    for(const it of out){
      if(!by.has(it.product)){
        by.set(it.product, { name: it.product, category: it.category, image: it.image, rows: [] });
      }
      const g = by.get(it.product);
      g.rows.push(it);
      if(!g.image && it.image) g.image = it.image;
    }

    allProducts = [...by.values()].map(g => {
      const packages = [...new Set(g.rows.map(r => r.pack).filter(Boolean))];
      const months = [...new Set(g.rows.map(r => r.months).filter(Boolean))];
      const types = [...new Set(g.rows.map(r => r.type).filter(Boolean))];
      return { ...g, packages, months, types };
    }).sort((a, b) => a.name.localeCompare(b.name, "vi"));

    buildCategoryMenu(allProducts);
    render();
  }catch(err){
    console.error(err);
    setNotice(String(err.message || err));
  }
}

if(searchInput) searchInput.addEventListener("input", render);
load();
})();
