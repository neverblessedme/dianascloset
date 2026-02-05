// Diana's Closet - Wardrobe & Outfit Builder (with photos)

const STORAGE_WARDROBE = 'dianas-closet-wardrobe';
const STORAGE_OUTFITS = 'dianas-closet-saved-outfits';
const STORAGE_MOODBOARD = 'dianas-closet-moodboard';

let wardrobe = JSON.parse(localStorage.getItem(STORAGE_WARDROBE) || '[]');
// accessories and outerwear are arrays; tops, bottoms, shoes are single item
let currentOutfit = { tops: null, bottoms: null, shoes: null, accessories: [], outerwear: [] };
let savedOutfits = JSON.parse(localStorage.getItem(STORAGE_OUTFITS) || '[]');
let moodBoard = JSON.parse(localStorage.getItem(STORAGE_MOODBOARD) || '[]');
let activeFilter = 'all';

// Where-to-buy search URLs
const WHERE_TO_BUY = {
  Grailed: (q) => `https://www.grailed.com/search?query=${encodeURIComponent(q)}`,
  Depop: (q) => `https://www.depop.com/search/?q=${encodeURIComponent(q)}`,
  Poshmark: (q) => `https://poshmark.com/search?query=${encodeURIComponent(q)}`,
  eBay: (q) => `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(q)}`,
  Mercari: (q) => `https://www.mercari.com/search/?keyword=${encodeURIComponent(q)}`,
  Vinted: (q) => `https://www.vinted.com/catalog?search_text=${encodeURIComponent(q)}`,
};

// Sample loadup clothes (your items from filenames: name, category, color)
const SAMPLE_CLOTHES = [
  { name: 'YSL choker', category: 'accessories', color: 'silver', image: 'assets/YSL_choker_-_silver-4436c221-bd9c-4095-aee5-5e2abcb303b5.png' },
  { name: 'Black jean skirt', category: 'bottoms', color: 'black', image: 'assets/black_jean_skirt_-_bottoms_-_black-5fff63a1-52b6-4ee2-8323-c3fcf27f20d3.png' },
  { name: 'Chrome Hearts henley', category: 'tops', color: 'black', image: 'assets/chrome_hearts_henley_-_tops_-_black-fb72eb8b-3990-4c33-92ff-d51228443a81.png' },
  { name: 'Giuseppe Zanotti heels', category: 'shoes', color: 'black', image: 'assets/giuseppe_zanotti_heels_-_shoes_-_black-44955be2-c89f-46cf-abec-0b3dd7409a86.png' },
  { name: 'Helmut Lang jacket', category: 'outerwear', color: 'black', image: 'assets/helmut_lang_jacket_-_outerwear_-_black-7bc542a4-9bcd-4169-af04-828afcc8a5f7.png' },
  { name: 'Chanel flight cap', category: 'accessories', color: 'black', image: 'assets/chanel_flight_cap_-_black_-_accessories-0ea02c9c-953b-47f4-890e-7853e46f50c6.png' },
  { name: 'Vivi necklace', category: 'accessories', color: 'silver', image: 'assets/vivi_necklace_-_accessories_-_silver-7ae3f087-f022-40fe-8cd0-7a4f3ed2be14.png' },
  { name: 'Chanel flats', category: 'shoes', color: 'black', image: 'assets/chanel_flats_-_shoes_-_black-5c6d5745-7713-4c9f-8cd8-bffa21c8bd41.png' },
  { name: 'Balenciaga womens pride tee', category: 'tops', color: 'black', image: 'assets/balenciaga_womens_pride_tee_-_black_-_tops-9816cc7d-7d47-458c-b580-c92cb6aad434.png' },
  { name: 'Chrome Hearts glasses', category: 'accessories', color: 'pink', image: 'assets/chrome_hearts_glasses_-_accessories_-_pink-0725b9c3-b875-4ae4-a21b-60fc96a32468.png' },
  { name: 'Balenciaga Classic City bag', category: 'accessories', color: 'white', image: 'assets/balenciaga_classic_city_bag_-_white_-_accessories-b6bf5f9a-4fbd-4c05-a481-bbc96f64177b.png' },
  { name: 'Celine unlock your fantasies sweatshirt', category: 'tops', color: 'other', image: 'assets/celine_sweater_-_tops_-_grey-07610dd9-a91e-4c9b-a928-6bbafd247def.png' },
  { name: 'Prada skirt', category: 'bottoms', color: 'black', image: 'assets/prada_skirt_-_grey_-_bottoms-76c15267-f658-465a-b508-7aaee4b181a5.png' },
  { name: 'Vetements Antwerpen hoodie', category: 'tops', color: 'black', image: 'assets/vetements_hoodie_-_tops_-_black-5e5f25e4-8652-4ad8-a902-bbb8852b7b2d.png' },
  { name: 'Marc Jacobs protect the skin you\'re in tee', category: 'tops', color: 'pink', image: 'assets/marc_jacobs_protect_the_skin_your_in_-_tops_-_white-c52154b6-ccb0-446f-825b-5c75a6f0a355.png' },
];

// DOM
const addForm = document.getElementById('add-item-form');
const itemName = document.getElementById('item-name');
const itemCategory = document.getElementById('item-category');
const itemColor = document.getElementById('item-color');
const itemPhoto = document.getElementById('item-photo');
const wardrobeGrid = document.getElementById('wardrobe-grid');
const filterBtns = document.querySelectorAll('.filter-btn');
const slotContents = {
  tops: document.getElementById('slot-tops'),
  bottoms: document.getElementById('slot-bottoms'),
  shoes: document.getElementById('slot-shoes'),
  accessories: document.getElementById('slot-accessories'),
  outerwear: document.getElementById('slot-outerwear'),
};
const pickModal = document.getElementById('pick-modal');
const modalCategoryLabel = document.getElementById('modal-category-label');
const modalOptions = document.getElementById('modal-options');
const modalClose = document.querySelector('.modal-close');
const outfitNameSection = document.getElementById('outfit-name-section');
const outfitNameInput = document.getElementById('outfit-name');
const savedOutfitsEl = document.getElementById('saved-outfits');

function getItemImageUrl(item) {
  if (!item) return null;
  if (item.image) return item.image;
  return null;
}

function polaroidImg(src) {
  if (!src) return '<div class="polaroid-img-wrap no-img"></div>';
  return `<div class="polaroid-img-wrap"><img src="${src.replace(/"/g, '&quot;')}" alt="" loading="lazy"></div>`;
}

function escapeAttr(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML.replace(/"/g, '&quot;');
}

// Ensure accessories/outerwear are arrays (for saved outfits from before multi-item)
function normalizeOutfitItems(items) {
  if (!items) return { tops: null, bottoms: null, shoes: null, accessories: [], outerwear: [] };
  return {
    tops: items.tops ?? null,
    bottoms: items.bottoms ?? null,
    shoes: items.shoes ?? null,
    accessories: Array.isArray(items.accessories) ? items.accessories : (items.accessories ? [items.accessories] : []),
    outerwear: Array.isArray(items.outerwear) ? items.outerwear : (items.outerwear ? [items.outerwear] : []),
  };
}

// Add item to wardrobe (with optional photo)
addForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = itemName.value.trim();
  if (!name) return;

  const addItem = (imageData) => {
    const item = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      name,
      category: itemCategory.value,
      color: itemColor.value,
      image: imageData || null,
    };
    wardrobe.push(item);
    saveWardrobe();
    itemName.value = '';
    itemPhoto.value = '';
    renderWardrobe();
  };

  const file = itemPhoto.files[0];
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = () => addItem(reader.result);
    reader.readAsDataURL(file);
  } else {
    addItem(null);
  }
});

// Load sample clothes (adds your 5 items if not already in wardrobe)
const addSampleBtn = document.getElementById('add-sample-clothes');
if (addSampleBtn) {
  addSampleBtn.addEventListener('click', () => {
    const existingNames = new Set(wardrobe.map((i) => i.name.toLowerCase()));
    SAMPLE_CLOTHES.forEach((s, i) => {
      if (existingNames.has(s.name.toLowerCase())) return;
      existingNames.add(s.name.toLowerCase());
      wardrobe.push({
        id: 'sample-' + Date.now() + '-' + i,
        name: s.name,
        category: s.category,
        color: s.color,
        image: s.image,
      });
    });
    saveWardrobe();
    renderWardrobe();
  });
}

function saveWardrobe() {
  localStorage.setItem(STORAGE_WARDROBE, JSON.stringify(wardrobe));
}

// Clear all wardrobe (in-site confirm modal + poof animation)
const clearWardrobeBtn = document.getElementById('clear-wardrobe-btn');
const clearWardrobeModal = document.getElementById('clear-wardrobe-modal');
const clearWardrobeCancel = document.getElementById('clear-wardrobe-cancel');
const clearWardrobeConfirm = document.getElementById('clear-wardrobe-confirm');
const POOF_DURATION_MS = 500;

if (clearWardrobeBtn) {
  clearWardrobeBtn.addEventListener('click', () => {
    clearWardrobeModal.classList.remove('hidden');
  });
}
if (clearWardrobeCancel) {
  clearWardrobeCancel.addEventListener('click', () => {
    clearWardrobeModal.classList.add('hidden');
  });
}
if (clearWardrobeModal) {
  clearWardrobeModal.addEventListener('click', (e) => {
    if (e.target === clearWardrobeModal) clearWardrobeModal.classList.add('hidden');
  });
}
if (clearWardrobeConfirm) {
  clearWardrobeConfirm.addEventListener('click', () => {
    if (wardrobe.length === 0) {
      clearWardrobeModal.classList.add('hidden');
      return;
    }
    // 1. Close popup immediately so you can watch the poof
    clearWardrobeModal.classList.add('hidden');

    const STAGGER_MS = 55;

    // 2. Show all items (bottom of grid = last in DOM)
    filterBtns.forEach((b) => b.classList.toggle('active', b.dataset.filter === 'all'));
    activeFilter = 'all';
    renderWardrobe();

    // 3. Stagger poof from bottom to top (last item = delay 0, first = longest)
    requestAnimationFrame(() => {
      const items = Array.from(wardrobeGrid.querySelectorAll('.wardrobe-item'));
      const n = items.length;
      items.forEach((el, i) => {
        el.style.animationDelay = `${(n - 1 - i) * STAGGER_MS}ms`;
        el.classList.add('poof');
      });
      const totalMs = (n - 1) * STAGGER_MS + POOF_DURATION_MS;
      setTimeout(() => {
        wardrobe = [];
        currentOutfit = { tops: null, bottoms: null, shoes: null, accessories: [], outerwear: [] };
        saveWardrobe();
        renderWardrobe();
        renderOutfitSlots();
        outfitNameSection.classList.add('hidden');
      }, totalMs);
    });
  });
}

function saveSavedOutfits() {
  localStorage.setItem(STORAGE_OUTFITS, JSON.stringify(savedOutfits));
}

// Render wardrobe grid - polaroid / scrap style
function renderWardrobe() {
  const filtered = activeFilter === 'all'
    ? wardrobe
    : wardrobe.filter((i) => i.category === activeFilter);

  wardrobeGrid.innerHTML = filtered.map((item) => {
    const imgSrc = getItemImageUrl(item);
    const imgHtml = polaroidImg(imgSrc);
    return `
      <div class="wardrobe-item" data-id="${item.id}" data-category="${escapeAttr(item.category)}" draggable="true">
        <button class="remove-btn" aria-label="Remove">×</button>
        <div class="polaroid">
          ${imgHtml}
          <div class="polaroid-caption">${escapeHtml(item.name)}</div>
        </div>
      </div>
    `;
  }).join('');

  wardrobeGrid.querySelectorAll('.wardrobe-item .remove-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.closest('.wardrobe-item').dataset.id;
      wardrobe = wardrobe.filter((i) => i.id !== id);
      clearSlotIfItem(id);
      saveWardrobe();
      renderWardrobe();
      renderOutfitSlots();
    });
  });

  wardrobeGrid.querySelectorAll('.wardrobe-item').forEach((el) => {
    el.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('application/json', JSON.stringify({ id: el.dataset.id, category: el.dataset.category }));
      e.dataTransfer.effectAllowed = 'copy';
      el.classList.add('dragging');
    });
    el.addEventListener('dragend', () => el.classList.remove('dragging'));
  });
}

function clearSlotIfItem(itemId) {
  if (currentOutfit.tops?.id === itemId) currentOutfit.tops = null;
  if (currentOutfit.bottoms?.id === itemId) currentOutfit.bottoms = null;
  if (currentOutfit.shoes?.id === itemId) currentOutfit.shoes = null;
  currentOutfit.accessories = currentOutfit.accessories.filter((i) => i.id !== itemId);
  currentOutfit.outerwear = currentOutfit.outerwear.filter((i) => i.id !== itemId);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Filters
filterBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    filterBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    renderWardrobe();
  });
});

// Pick for slot
document.querySelectorAll('.slot-pick-btn').forEach((btn) => {
  btn.addEventListener('click', () => openPickModal(btn.dataset.slot));
});

// Drag and drop: only into matching category slots; accessories/outerwear accept multiple
function setupSlotDropZones() {
  document.querySelectorAll('.outfit-slot').forEach((slotEl) => {
    const slot = slotEl.dataset.slot;
    slotEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      slotEl.classList.add('drop-target');
    });
    slotEl.addEventListener('dragleave', (e) => {
      if (!slotEl.contains(e.relatedTarget)) slotEl.classList.remove('drop-target');
    });
    slotEl.addEventListener('drop', (e) => {
      e.preventDefault();
      slotEl.classList.remove('drop-target');
      let data;
      try {
        data = JSON.parse(e.dataTransfer.getData('application/json'));
      } catch (_) {
        return;
      }
      const item = wardrobe.find((i) => i.id === data.id);
      if (!item || item.category !== slot) return;
      if (slot === 'accessories' || slot === 'outerwear') {
        if (!currentOutfit[slot].some((i) => i.id === item.id)) {
          currentOutfit[slot].push(item);
        }
      } else {
        currentOutfit[slot] = item;
      }
      renderOutfitSlots();
      outfitNameSection.classList.remove('hidden');
    });
  });
}
setupSlotDropZones();

function openPickModal(slot) {
  const categoryLabel = slot;
  modalCategoryLabel.textContent = categoryLabel;
  const items = wardrobe.filter((i) => i.category === slot);

  if (!items.length) {
    modalOptions.innerHTML = '<p class="empty-state">no items in this category yet. add some to your closet or use "add sample clothes"!</p>';
  } else {
    modalOptions.innerHTML = items.map((item) => {
      const src = getItemImageUrl(item);
      const imgTag = src ? `<img src="${src.replace(/"/g, '&quot;')}" alt="">` : '';
      return `
        <button type="button" class="modal-option" data-id="${item.id}">
          ${imgTag || '<span class="modal-option-placeholder"></span>'}
          <span class="modal-option-label">${escapeHtml(item.name)}</span>
        </button>
      `;
    }).join('');
  }

  modalOptions.querySelectorAll('.modal-option').forEach((opt) => {
    if (!opt.dataset.id) return;
    opt.addEventListener('click', () => {
      const item = wardrobe.find((i) => i.id === opt.dataset.id);
      if (item) {
        if (slot === 'accessories' || slot === 'outerwear') {
          if (!currentOutfit[slot].some((i) => i.id === item.id)) currentOutfit[slot].push(item);
        } else {
          currentOutfit[slot] = item;
        }
        renderOutfitSlots();
        pickModal.classList.add('hidden');
        outfitNameSection.classList.remove('hidden');
      }
    });
  });

  pickModal.classList.remove('hidden');
}

modalClose.addEventListener('click', () => pickModal.classList.add('hidden'));
pickModal.addEventListener('click', (e) => {
  if (e.target === pickModal) pickModal.classList.add('hidden');
});

// Pinterest link help popup
const pinterestHelpModal = document.getElementById('pinterest-help-modal');
const pinterestHelpBtn = document.getElementById('pinterest-link-help-btn');
const pinterestHelpClose = document.getElementById('pinterest-help-close');
if (pinterestHelpBtn) {
  pinterestHelpBtn.addEventListener('click', () => {
    if (pinterestHelpModal) pinterestHelpModal.classList.remove('hidden');
  });
}
if (pinterestHelpClose) {
  pinterestHelpClose.addEventListener('click', () => {
    if (pinterestHelpModal) pinterestHelpModal.classList.add('hidden');
  });
}
if (pinterestHelpModal) {
  pinterestHelpModal.addEventListener('click', (e) => {
    if (e.target === pinterestHelpModal) pinterestHelpModal.classList.add('hidden');
  });
}

function renderOutfitSlots() {
  const singleSlots = ['tops', 'bottoms', 'shoes'];
  const multiSlots = ['accessories', 'outerwear'];

  singleSlots.forEach((slot) => {
    const el = slotContents[slot];
    const item = currentOutfit[slot];
    const slotEl = el.closest('.outfit-slot');
    if (item) {
      const src = getItemImageUrl(item);
      const imgHtml = polaroidImg(src);
      el.innerHTML = `
        <div class="polaroid polaroid-outfit">
          ${imgHtml}
          <div class="polaroid-caption">${escapeHtml(item.name)}</div>
        </div>
      `;
      el.classList.remove('empty');
      slotEl.classList.add('filled');
    } else {
      el.innerHTML = '—';
      el.classList.add('empty');
      slotEl.classList.remove('filled');
    }
  });

  multiSlots.forEach((slot) => {
    const el = slotContents[slot];
    const items = currentOutfit[slot];
    const slotEl = el.closest('.outfit-slot');
    if (items && items.length > 0) {
      el.innerHTML = items
        .map(
          (item) => {
            const src = getItemImageUrl(item);
            const imgHtml = polaroidImg(src);
            return `
              <div class="slot-item-entry" data-slot="${slot}" data-id="${item.id}">
                <button type="button" class="slot-remove-btn" aria-label="Remove from outfit">×</button>
                <div class="polaroid polaroid-outfit">
                  ${imgHtml}
                  <div class="polaroid-caption">${escapeHtml(item.name)}</div>
                </div>
              </div>
            `;
          }
        )
        .join('');
      el.classList.remove('empty');
      slotEl.classList.add('filled');
      el.querySelectorAll('.slot-remove-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const entry = btn.closest('.slot-item-entry');
          const id = entry?.dataset.id;
          if (id) {
            currentOutfit[slot] = currentOutfit[slot].filter((i) => i.id !== id);
            renderOutfitSlots();
          }
        });
      });
    } else {
      el.innerHTML = '—';
      el.classList.add('empty');
      slotEl.classList.remove('filled');
    }
  });
}

// Random outfit
document.getElementById('random-outfit').addEventListener('click', () => {
  const singleSlots = ['tops', 'bottoms', 'shoes'];
  const multiSlots = ['accessories', 'outerwear'];
  let hasAny = false;
  singleSlots.forEach((slot) => {
    const items = wardrobe.filter((i) => i.category === slot);
    currentOutfit[slot] = items.length ? items[Math.floor(Math.random() * items.length)] : null;
    if (currentOutfit[slot]) hasAny = true;
  });
  multiSlots.forEach((slot) => {
    const items = wardrobe.filter((i) => i.category === slot);
    currentOutfit[slot] = items.length ? [items[Math.floor(Math.random() * items.length)]] : [];
    if (currentOutfit[slot].length) hasAny = true;
  });
  renderOutfitSlots();
  if (hasAny) outfitNameSection.classList.remove('hidden');
});

// Clear outfit
document.getElementById('clear-outfit').addEventListener('click', () => {
  currentOutfit = { tops: null, bottoms: null, shoes: null, accessories: [], outerwear: [] };
  renderOutfitSlots();
  outfitNameInput.value = '';
  outfitNameSection.classList.add('hidden');
});

// Save outfit
document.getElementById('save-outfit').addEventListener('click', () => {
  const name = outfitNameInput.value.trim() || 'Unnamed outfit';
  const items = [
    currentOutfit.tops,
    currentOutfit.bottoms,
    currentOutfit.shoes,
    ...(currentOutfit.accessories || []),
    ...(currentOutfit.outerwear || []),
  ].filter(Boolean);
  if (items.length === 0) return;
  savedOutfits.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    name,
    items: {
      tops: currentOutfit.tops,
      bottoms: currentOutfit.bottoms,
      shoes: currentOutfit.shoes,
      accessories: currentOutfit.accessories ? [...currentOutfit.accessories] : [],
      outerwear: currentOutfit.outerwear ? [...currentOutfit.outerwear] : [],
    },
  });
  saveSavedOutfits();
  renderSavedOutfits();
  outfitNameInput.value = '';
});

function itemsFromOutfit(items) {
  const norm = normalizeOutfitItems(items);
  return [
    norm.tops,
    norm.bottoms,
    norm.shoes,
    ...(norm.accessories || []),
    ...(norm.outerwear || []),
  ].filter(Boolean);
}

function renderSavedOutfits() {
  if (savedOutfits.length === 0) {
    savedOutfitsEl.innerHTML = '<p class="empty-state">no saved outfits yet. build one and name it!</p>';
    return;
  }
  savedOutfitsEl.innerHTML = savedOutfits.map((outfit) => {
    const allItems = itemsFromOutfit(outfit.items);
    const parts = allItems.map((it) => it.name).join(' · ');
    const photoStrip = allItems
      .map((it) => {
        const src = getItemImageUrl(it);
        if (!src) return `<span class="saved-photo-thumb no-img"></span>`;
        return `<span class="saved-photo-thumb"><img src="${src.replace(/"/g, '&quot;')}" alt=""></span>`;
      })
      .join('');
    return `
      <div class="saved-outfit" data-id="${outfit.id}">
        <div class="saved-outfit-photos">${photoStrip || ''}</div>
        <div class="saved-outfit-info">
          <div class="saved-outfit-name">${escapeHtml(outfit.name)}</div>
          <div class="saved-outfit-items">${escapeHtml(parts)}</div>
        </div>
        <div class="saved-outfit-actions">
          <button type="button" class="wear-btn">wear</button>
          <button type="button" class="delete-btn">delete</button>
        </div>
      </div>
    `;
  }).join('');

  savedOutfitsEl.querySelectorAll('.wear-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.closest('.saved-outfit').dataset.id;
      const outfit = savedOutfits.find((o) => o.id === id);
      if (outfit) {
        currentOutfit = normalizeOutfitItems(outfit.items);
        renderOutfitSlots();
        outfitNameSection.classList.remove('hidden');
      }
    });
  });

  savedOutfitsEl.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.closest('.saved-outfit').dataset.id;
      savedOutfits = savedOutfits.filter((o) => o.id !== id);
      saveSavedOutfits();
      renderSavedOutfits();
    });
  });
}

// Pinterest - open search in new tab
document.getElementById('pinterest-search-btn').addEventListener('click', () => {
  const query = document.getElementById('pinterest-query').value.trim() || 'fashion outfits';
  const url = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`;
  window.open(url, '_blank', 'noopener');
});
document.getElementById('pinterest-query').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    document.getElementById('pinterest-search-btn').click();
  }
});

// Mood board - add item
function saveMoodBoard() {
  localStorage.setItem(STORAGE_MOODBOARD, JSON.stringify(moodBoard));
}

function isPinterestPinUrl(str) {
  if (!str || typeof str !== 'string') return false;
  const s = str.trim();
  return /^https?:\/\/(\w+\.)?pinterest\.com\/pin\//.test(s) || /^https?:\/\/pin\.it\//.test(s);
}

/** Fetch pin page HTML via CORS proxy and extract og:image URL. */
async function fetchImageFromPinterestPin(pinUrl) {
  const url = pinUrl.trim();
  if (!isPinterestPinUrl(url)) return null;
  const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url);
  try {
    const res = await fetch(proxyUrl, { method: 'GET' });
    if (!res.ok) return null;
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const ogImage = doc.querySelector('meta[property="og:image"]');
    const src = ogImage ? ogImage.getAttribute('content') : null;
    return src || null;
  } catch (_) {
    return null;
  }
}

document.getElementById('moodboard-add-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const nameEl = document.getElementById('moodboard-name');
  const pinterestEl = document.getElementById('moodboard-pinterest-link');
  const imageUrlEl = document.getElementById('moodboard-image-url');
  const purchaseUrlEl = document.getElementById('moodboard-purchase-url');
  const photoEl = document.getElementById('moodboard-photo');
  const statusEl = document.getElementById('moodboard-status');
  const submitBtn = document.getElementById('moodboard-submit-btn');

  const name = nameEl.value.trim();
  if (!name) return;

  const pinterestLink = pinterestEl.value.trim();
  const imageUrl = imageUrlEl.value.trim();
  const purchaseUrl = purchaseUrlEl.value.trim();
  const file = photoEl.files[0];

  const addItem = (imageData) => {
    moodBoard.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      name,
      image: imageData || null,
      purchaseUrl: purchaseUrl || null,
    });
    saveMoodBoard();
    renderMoodBoard();
    nameEl.value = '';
    pinterestEl.value = '';
    imageUrlEl.value = '';
    purchaseUrlEl.value = '';
    photoEl.value = '';
    statusEl.textContent = '';
    submitBtn.disabled = false;
  };

  const setStatus = (msg) => {
    statusEl.textContent = msg;
  };

  if (pinterestLink && isPinterestPinUrl(pinterestLink)) {
    submitBtn.disabled = true;
    setStatus('getting image from pinterest…');
    const imageFromPin = await fetchImageFromPinterestPin(pinterestLink);
    if (imageFromPin) {
      addItem(imageFromPin);
    } else {
      setStatus('couldn\'t get image from that link. try an image url or photo upload.');
      submitBtn.disabled = false;
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          addItem(reader.result);
          setStatus('');
        };
        reader.readAsDataURL(file);
      } else if (imageUrl) {
        addItem(imageUrl);
        setStatus('');
      }
    }
    return;
  }

  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = () => addItem(reader.result);
    reader.readAsDataURL(file);
  } else {
    addItem(imageUrl || null);
  }
});

function renderMoodBoard() {
  const grid = document.getElementById('moodboard-grid');
  if (moodBoard.length === 0) {
    grid.innerHTML = '<p class="empty-state">no items yet. search pinterest for inspo, then add items here and use the links below to find them on grailed, depop, poshmark, ebay & more.</p>';
    return;
  }
  grid.innerHTML = moodBoard.map((item) => {
    const imgHtml = item.image
      ? `<div class="moodboard-item-img"><img src="${item.image.replace(/"/g, '&quot;')}" alt="" loading="lazy"></div>`
      : '<div class="moodboard-item-img no-img"></div>';
    const purchaseLink = item.purchaseUrl
      ? `<a href="${item.purchaseUrl.replace(/"/g, '&quot;')}" target="_blank" rel="noopener" class="moodboard-purchase-link">View purchase link</a>`
      : '';
    const whereToBuy = Object.entries(WHERE_TO_BUY)
      .map(([label, fn]) => `<a href="${fn(item.name)}" target="_blank" rel="noopener">${label}</a>`)
      .join('');
    return `
      <div class="moodboard-item" data-id="${item.id}">
        ${imgHtml}
        <div class="moodboard-item-info">
          <div class="moodboard-item-name">${escapeHtml(item.name)}</div>
          <div class="moodboard-where-to-buy">${whereToBuy}</div>
          ${purchaseLink ? `<div class="moodboard-where-to-buy">${purchaseLink}</div>` : ''}
          <button type="button" class="remove-mood-btn">Remove</button>
        </div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.remove-mood-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.closest('.moodboard-item').dataset.id;
      moodBoard = moodBoard.filter((i) => i.id !== id);
      saveMoodBoard();
      renderMoodBoard();
    });
  });
}

// Init
renderWardrobe();
renderOutfitSlots();
renderSavedOutfits();
renderMoodBoard();
