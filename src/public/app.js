document.addEventListener('DOMContentLoaded', () => {
  // Navigation & Views Elements
  const registerView = document.getElementById('register-view');
  const loginView = document.getElementById('login-view');
  const appView = document.getElementById('app-view');

  const goToLoginLink = document.getElementById('go-to-login');
  const goToRegisterLink = document.getElementById('go-to-register');

  const registerForm = document.getElementById('register-form');
  const loginForm = document.getElementById('login-form');

  const registerError = document.getElementById('register-error');
  const registerSuccess = document.getElementById('register-success');
  const loginError = document.getElementById('login-error');
  const loginSuccess = document.getElementById('login-success');

  // Dashboard Header & Navigation
  const triggerProfile = document.getElementById('trigger-profile');
  const logoutIconBtn = document.getElementById('logout-icon-btn');
  const displayShopName = document.getElementById('display-shop-name');
  const avatarChar = document.getElementById('avatar-char');
  const ledgerSearch = document.getElementById('ledger-search');
  const categoryFilters = document.getElementById('category-filters');
  const vouchersGroupedList = document.getElementById('vouchers-grouped-list');
  const emptyState = document.getElementById('empty-state');

  // Bottom Navigation tabs
  const navHome = document.getElementById('nav-home');
  const navVouchers = document.getElementById('nav-vouchers');
  const navParties = document.getElementById('nav-parties');
  const navProfileTab = document.getElementById('nav-profile-tab');

  // Profile Drawer Modal
  const profileDrawerModal = document.getElementById('profile-drawer-modal');
  const closeProfileDrawer = document.getElementById('close-profile-drawer');
  const logoutBtn = document.getElementById('logout-btn');

  // Create Voucher Modal
  const createVoucherModal = document.getElementById('create-voucher-modal');
  const openCreateVoucherBtn = document.getElementById('open-create-voucher');
  const closeCreateModal = document.getElementById('close-create-modal');
  const createVoucherForm = document.getElementById('create-voucher-form');
  const createError = document.getElementById('create-error');
  const vType = document.getElementById('v-type');
  const vNumber = document.getElementById('v-number');
  const vParty = document.getElementById('v-party');
  const vDate = document.getElementById('v-date');
  const vStatus = document.getElementById('v-status');
  const vTerms = document.getElementById('v-terms');
  const vTotalAmount = document.getElementById('v-total-amount');

  // Dynamic Voucher Items
  const itemsSectionContainer = document.getElementById('items-section-container');
  const itemsTbody = document.getElementById('items-tbody');
  const addItemRowBtn = document.getElementById('add-item-row-btn');
  const computedTotalsCard = document.getElementById('computed-totals-card');
  const directAmountGroup = document.getElementById('direct-amount-group');
  const compSubtotal = document.getElementById('comp-subtotal');
  const compGst = document.getElementById('comp-gst');
  const compTotal = document.getElementById('comp-total');

  // Voucher Details Modal
  const voucherDetailModal = document.getElementById('voucher-detail-modal');
  const closeDetailModal = document.getElementById('close-detail-modal');
  const invoiceMerchantName = document.getElementById('invoice-merchant-name');
  const invoiceMerchantDetails = document.getElementById('invoice-merchant-details');
  const invoiceStatusBadge = document.getElementById('invoice-status-badge');
  const invoicePartyName = document.getElementById('invoice-party-name');
  const invoiceDate = document.getElementById('invoice-date');
  const invoiceItemsWrapper = document.getElementById('invoice-items-wrapper');
  const invoiceItemsTbody = document.getElementById('invoice-items-tbody');
  const invoiceSubtotal = document.getElementById('invoice-subtotal');
  const invoiceGst = document.getElementById('invoice-gst');
  const invoiceTotal = document.getElementById('invoice-total');
  const invoiceTerms = document.getElementById('invoice-terms');
  const invoiceTermsWrapper = document.getElementById('invoice-terms-wrapper');

  // Detail Modal Actions
  const invoiceActionDuplicate = document.getElementById('invoice-action-duplicate');
  const invoiceActionDelete = document.getElementById('invoice-action-delete');
  const invoiceActionPdf = document.getElementById('invoice-action-pdf');

  // Global Session State
  let currentUser = null;
  let activeFilter = 'All';
  let searchQuery = '';
  let activeDetailVoucherId = null;

  // Initialize UI features
  setupPasswordToggles();
  setupCreateModalItemsEvents();

  // Navigation Routing Links
  goToLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    switchView('login');
  });

  goToRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    switchView('register');
  });

  // Main Authentication Check on Load
  checkAuthStatus();

  // Registration Form Posting
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlerts();

    const shopName = document.getElementById('reg-shop-name').value.trim();
    const ownerName = document.getElementById('reg-owner-name').value.trim();
    const gstin = document.getElementById('reg-gstin').value.trim();
    const mobileRaw = document.getElementById('reg-mobile').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    if (!shopName || !ownerName || !mobileRaw || !email || !password) {
      showError(registerError, 'All fields are required.');
      return;
    }

    let mobile = mobileRaw.replace(/\s+/g, '');
    if (!mobile.startsWith('+') && !mobile.startsWith('91')) {
      mobile = '+91' + mobile;
    } else if (mobile.startsWith('91') && !mobile.startsWith('+')) {
      mobile = '+' + mobile;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopName, ownerName, gstin: gstin || undefined, mobile, email, password })
      });
      const data = await response.json();

      if (response.ok) {
        showSuccess(registerSuccess, 'Registered successfully! Loading sign in...');
        registerForm.reset();
        setTimeout(() => { switchView('login'); }, 1500);
      } else {
        showError(registerError, data.error || 'Registration failed.');
      }
    } catch (err) {
      showError(registerError, 'Network error occurred.');
    }
  });

  // Login Form Posting
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlerts();

    const identifierRaw = document.getElementById('log-identifier').value.trim();
    const password = document.getElementById('log-password').value;

    if (!identifierRaw || !password) {
      showError(loginError, 'Credentials are required.');
      return;
    }

    let identifier = identifierRaw.replace(/\s+/g, '');
    const isPhone = /^[0-9+]+$/.test(identifier);
    if (isPhone && !identifier.startsWith('+') && !identifier.startsWith('91')) {
      identifier = '+91' + identifier;
    } else if (isPhone && identifier.startsWith('91') && !identifier.startsWith('+')) {
      identifier = '+' + identifier;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
      const data = await response.json();

      if (response.ok) {
        showSuccess(loginSuccess, 'Entering dashboard...');
        loginForm.reset();
        setTimeout(() => { checkAuthStatus(); }, 1000);
      } else {
        showError(loginError, data.error || 'Invalid credentials.');
      }
    } catch (err) {
      showError(loginError, 'Network error occurred.');
    }
  });

  // Logout Trigger
  function triggerLogout() {
    fetch('/api/auth/logout', { method: 'POST' }).finally(() => {
      document.cookie = 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      window.location.reload();
    });
  }

  logoutBtn.addEventListener('click', triggerLogout);
  logoutIconBtn.addEventListener('click', triggerLogout);

  // Bottom Tabs Click Controllers
  navHome.addEventListener('click', () => {
    // Treat Home as a quick toggle to open profile information
    openModal(profileDrawerModal);
  });
  navProfileTab.addEventListener('click', () => {
    openModal(profileDrawerModal);
  });
  navVouchers.addEventListener('click', () => {
    setActiveTab(navVouchers);
  });
  navParties.addEventListener('click', () => {
    // Show a beautiful, non-blocking modal notifying feature integration
    showNotification('Coming soon: Complete Parties Ledger management!');
  });

  triggerProfile.addEventListener('click', () => {
    openModal(profileDrawerModal);
  });

  closeProfileDrawer.addEventListener('click', () => {
    closeModal(profileDrawerModal);
  });

  // Search Ledger event
  let searchTimeout = null;
  ledgerSearch.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      fetchAndRenderVouchers();
    }, 300);
  });

  // Category filters event
  categoryFilters.addEventListener('click', (e) => {
    const pill = e.target.closest('.filter-pill');
    if (!pill) return;

    // Remove active from all
    categoryFilters.querySelectorAll('.filter-pill').forEach(btn => btn.classList.remove('active'));
    pill.classList.add('active');

    activeFilter = pill.dataset.filter;
    fetchAndRenderVouchers();
  });

  // Floating Action button
  openCreateVoucherBtn.addEventListener('click', () => {
    // Set default values on form
    createVoucherForm.reset();
    createError.style.display = 'none';

    // Set default date to today in local timezone
    const today = new Date().toISOString().split('T')[0];
    vDate.value = today;

    // Clear and configure items
    itemsTbody.replaceChildren();
    
    // Toggle correct view based on type selection (Sales shows items, Payment shows direct amount)
    handleTypeToggle();
    openModal(createVoucherModal);
  });

  closeCreateModal.addEventListener('click', () => {
    closeModal(createVoucherModal);
  });

  // Voucher Creation Submit Handler
  createVoucherForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    createError.style.display = 'none';

    const voucherNumber = vNumber.value.trim();
    const type = vType.value;
    const partyName = vParty.value.trim();
    const date = vDate.value;
    const status = vStatus.value;
    const terms = vTerms.value.trim();
    const totalVal = parseFloat(vTotalAmount.value);

    if (!voucherNumber || !partyName || !date) {
      createError.textContent = 'Please fill all required voucher fields.';
      createError.style.display = 'block';
      return;
    }

    const items = [];
    const showItems = (type === 'Sales' || type === 'Purchase');

    if (showItems) {
      const rows = itemsTbody.querySelectorAll('tr');
      for (let i = 0; i < rows.length; i++) {
        const name = rows[i].querySelector('.item-name-input').value.trim();
        const qty = parseInt(rows[i].querySelector('.item-qty-input').value, 10);
        const rate = parseFloat(rows[i].querySelector('.item-rate-input').value);

        if (!name) {
          createError.textContent = 'Please specify a name for all items.';
          createError.style.display = 'block';
          return;
        }
        if (isNaN(qty) || qty < 1) {
          createError.textContent = 'Item quantities must be positive numbers.';
          createError.style.display = 'block';
          return;
        }
        if (isNaN(rate) || rate < 0) {
          createError.textContent = 'Item rates must be positive amounts.';
          createError.style.display = 'block';
          return;
        }

        items.push({ name, qty, rate });
      }

      if (items.length === 0) {
        createError.textContent = 'Please add at least one item for sales/purchase vouchers.';
        createError.style.display = 'block';
        return;
      }
    } else {
      if (isNaN(totalVal) || totalVal < 0) {
        createError.textContent = 'Please enter a valid non-negative amount.';
        createError.style.display = 'block';
        return;
      }
    }

    const payload = {
      voucherNumber,
      type,
      partyName,
      date,
      status,
      terms: terms || undefined,
      items: showItems ? items : undefined,
      totalAmount: showItems ? undefined : totalVal
    };

    try {
      const response = await fetch('/api/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (response.ok) {
        closeModal(createVoucherModal);
        fetchAndRenderVouchers();
      } else {
        createError.textContent = data.error || 'Failed to create voucher.';
        createError.style.display = 'block';
      }
    } catch (err) {
      createError.textContent = 'Connection error.';
      createError.style.display = 'block';
    }
  });

  // Voucher Detail Invoice Modal controls
  closeDetailModal.addEventListener('click', () => {
    closeModal(voucherDetailModal);
  });

  // Duplicate Voucher Handler
  invoiceActionDuplicate.addEventListener('click', async () => {
    if (!activeDetailVoucherId) return;

    try {
      const response = await fetch(`/api/vouchers/${activeDetailVoucherId}/duplicate`, {
        method: 'POST'
      });
      if (response.ok) {
        closeModal(voucherDetailModal);
        fetchAndRenderVouchers();
        showNotification('Voucher duplicated successfully! Custom suffix "-DUP" applied.');
      } else {
        const data = await response.json();
        showNotification('Error: ' + (data.error || 'Could not duplicate.'));
      }
    } catch (err) {
      showNotification('Duplication failed due to network error.');
    }
  });

  // non-blocking confirmation for Deletion
  let deletionConfirmed = false;
  invoiceActionDelete.addEventListener('click', async () => {
    if (!activeDetailVoucherId) return;

    if (!deletionConfirmed) {
      deletionConfirmed = true;
      invoiceActionDelete.textContent = 'Confirm Delete?';
      invoiceActionDelete.style.backgroundColor = '#b91c1c';
      invoiceActionDelete.style.color = '#ffffff';
      
      // Reset after 3 seconds if not clicked again
      setTimeout(() => {
        deletionConfirmed = false;
        invoiceActionDelete.textContent = 'Delete';
        invoiceActionDelete.style.backgroundColor = '#fee2e2';
        invoiceActionDelete.style.color = '#b91c1c';
      }, 3000);
      return;
    }

    try {
      const response = await fetch(`/api/vouchers/${activeDetailVoucherId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        closeModal(voucherDetailModal);
        fetchAndRenderVouchers();
        showNotification('Voucher deleted successfully.');
      } else {
        showNotification('Failed to delete voucher.');
      }
    } catch (err) {
      showNotification('Deletion failed due to network error.');
    }
  });

  // Mock PDF printing action
  invoiceActionPdf.addEventListener('click', () => {
    window.print();
  });

  // Navigation Tab State Helper
  function setActiveTab(activeTab) {
    [navHome, navVouchers, navParties, navProfileTab].forEach(btn => btn.classList.remove('active'));
    activeTab.classList.add('active');
  }

  // Type Selector Toggle in creation form
  vType.addEventListener('change', handleTypeToggle);

  function handleTypeToggle() {
    const selected = vType.value;
    if (selected === 'Sales' || selected === 'Purchase') {
      itemsSectionContainer.style.display = 'block';
      directAmountGroup.style.display = 'none';
      if (itemsTbody.children.length === 0) {
        addItemRow(); // Default single item row
      }
      recalculateItemsTotals();
    } else {
      itemsSectionContainer.style.display = 'none';
      directAmountGroup.style.display = 'block';
    }
  }

  // Create Modal Items rows event delegation
  addItemRowBtn.addEventListener('click', addItemRow);

  function addItemRow() {
    const tr = document.createElement('tr');
    
    // Create elements safely using Vanilla DOM methods to satisfy secure guidelines
    const tdName = document.createElement('td');
    const inputName = document.createElement('input');
    inputName.type = 'text';
    inputName.className = 'item-name-input';
    inputName.placeholder = 'Basmati Rice 25kg';
    inputName.required = true;
    tdName.appendChild(inputName);

    const tdQty = document.createElement('td');
    const inputQty = document.createElement('input');
    inputQty.type = 'number';
    inputQty.className = 'item-qty-input';
    inputQty.placeholder = '1';
    inputQty.value = '1';
    inputQty.min = '1';
    inputQty.required = true;
    tdQty.appendChild(inputQty);

    const tdRate = document.createElement('td');
    const inputRate = document.createElement('input');
    inputRate.type = 'number';
    inputRate.className = 'item-rate-input';
    inputRate.placeholder = '0.00';
    inputRate.min = '0';
    inputRate.step = '0.01';
    inputRate.required = true;
    tdRate.appendChild(inputRate);

    const tdDelete = document.createElement('td');
    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'delete-row-btn';
    delBtn.textContent = '×';
    delBtn.addEventListener('click', () => {
      tr.remove();
      recalculateItemsTotals();
    });
    tdDelete.appendChild(delBtn);

    tr.appendChild(tdName);
    tr.appendChild(tdQty);
    tr.appendChild(tdRate);
    tr.appendChild(tdDelete);

    itemsTbody.appendChild(tr);

    // recalculate totals on typing values
    [inputQty, inputRate].forEach(input => {
      input.addEventListener('input', recalculateItemsTotals);
    });

    recalculateItemsTotals();
  }

  function recalculateItemsTotals() {
    let subtotal = 0;
    const rows = itemsTbody.querySelectorAll('tr');

    rows.forEach(row => {
      const qty = parseInt(row.querySelector('.item-qty-input').value, 10) || 0;
      const rate = parseFloat(row.querySelector('.item-rate-input').value) || 0;
      subtotal += (qty * rate);
    });

    if (rows.length > 0) {
      computedTotalsCard.style.display = 'flex';
      const gst = subtotal * 0.18;
      const total = subtotal + gst;

      compSubtotal.textContent = formatRupees(subtotal);
      compGst.textContent = formatRupees(gst);
      compTotal.textContent = formatRupees(total);
    } else {
      computedTotalsCard.style.display = 'none';
    }
  }

  function setupCreateModalItemsEvents() {
    // Triggers totals calculations for default fields
    recalculateItemsTotals();
  }

  // API Call: Fetch and Render Vouchers Ledger list
  async function fetchAndRenderVouchers() {
    try {
      let url = '/api/vouchers';
      const params = [];
      if (activeFilter !== 'All') {
        params.push(`type=${activeFilter}`);
      }
      if (searchQuery.trim() !== '') {
        params.push(`search=${encodeURIComponent(searchQuery.trim())}`);
      }

      if (params.length > 0) {
        url += '?' + params.join('&');
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        renderLedger(data.vouchers);
      }
    } catch (err) {
      console.error('Error fetching vouchers ledger list:', err);
    }
  }

  // Render Vouchers day-wise grouping logic
  function renderLedger(vouchers) {
    vouchersGroupedList.replaceChildren();

    if (!vouchers || vouchers.length === 0) {
      emptyState.style.display = 'flex';
      return;
    }

    emptyState.style.display = 'none';

    // Group vouchers day-wise
    const groups = {};
    vouchers.forEach(v => {
      const dateStr = v.date; // Format 'YYYY-MM-DD'
      if (!groups[dateStr]) {
        groups[dateStr] = {
          dateVal: dateStr,
          vouchers: [],
          dayTotal: 0
        };
      }
      groups[dateStr].vouchers.push(v);
      
      const amt = parseFloat(v.totalAmount) || 0;
      // Sales and Receipt represent addition of capital/receivable values
      // Purchase and Payment represent debiting outflows
      if (v.type === 'Sales' || v.type === 'Receipt') {
        groups[dateStr].dayTotal += amt;
      } else {
        groups[dateStr].dayTotal -= amt;
      }
    });

    // Sort dates desc
    const sortedDates = Object.keys(groups).sort((a, b) => new Date(b) - new Date(a));

    sortedDates.forEach(dateKey => {
      const group = groups[dateKey];
      
      const dayGroupDiv = document.createElement('div');
      dayGroupDiv.className = 'day-group';

      // Header block
      const dayHeaderDiv = document.createElement('div');
      dayHeaderDiv.className = 'day-header';
      
      const dateLabel = document.createElement('span');
      dateLabel.textContent = formatDayLabel(group.dateVal);
      dayHeaderDiv.appendChild(dateLabel);

      const dateTotal = document.createElement('span');
      dateTotal.className = 'day-total';
      dateTotal.textContent = formatRupees(Math.abs(group.dayTotal));
      
      // Color daily total if positive or negative
      if (group.dayTotal < 0) {
        dateTotal.style.color = '#b91c1c';
      } else {
        dateTotal.style.color = 'var(--color-success)';
      }
      dayHeaderDiv.appendChild(dateTotal);

      dayGroupDiv.appendChild(dayHeaderDiv);

      // Items list container
      const dayItemsDiv = document.createElement('div');
      dayItemsDiv.className = 'day-items';

      group.vouchers.forEach(voucher => {
        const card = document.createElement('div');
        card.className = 'voucher-item-card';
        card.addEventListener('click', () => {
          openVoucherDetail(voucher.id);
        });

        // Left block (Type Icon + Details)
        const leftBlock = document.createElement('div');
        leftBlock.className = 'voucher-left-block';

        const iconContainer = document.createElement('div');
        iconContainer.className = `voucher-type-icon ${voucher.type.toLowerCase()}-icon`;
        iconContainer.appendChild(getVoucherIconSvg(voucher.type));
        leftBlock.appendChild(iconContainer);

        const details = document.createElement('div');
        details.className = 'voucher-details';
        
        const partyTitle = document.createElement('h4');
        partyTitle.textContent = voucher.partyName;
        details.appendChild(partyTitle);

        const subTitle = document.createElement('p');
        subTitle.textContent = `${voucher.voucherNumber} • ${voucher.type}`;
        details.appendChild(subTitle);

        leftBlock.appendChild(details);
        card.appendChild(leftBlock);

        // Right block (Amount + Status badge)
        const rightBlock = document.createElement('div');
        rightBlock.className = 'voucher-right-block';

        const amtLabel = document.createElement('span');
        const isOutflow = (voucher.type === 'Purchase' || voucher.type === 'Payment');
        amtLabel.className = `voucher-amount ${isOutflow ? 'amt-minus' : 'amt-plus'}`;
        amtLabel.textContent = `${isOutflow ? '-' : '+'}${formatRupees(voucher.totalAmount)}`;
        rightBlock.appendChild(amtLabel);

        const statusBadge = document.createElement('span');
        statusBadge.className = `badge badge-${voucher.status.toLowerCase()}`;
        statusBadge.textContent = voucher.status;
        rightBlock.appendChild(statusBadge);

        card.appendChild(rightBlock);
        dayItemsDiv.appendChild(card);
      });

      dayGroupDiv.appendChild(dayItemsDiv);
      vouchersGroupedList.appendChild(dayGroupDiv);
    });
  }

  // Open Voucher details details card drawer
  async function openVoucherDetail(id) {
    activeDetailVoucherId = id;
    deletionConfirmed = false;
    invoiceActionDelete.textContent = 'Delete';
    invoiceActionDelete.style.backgroundColor = '#fee2e2';
    invoiceActionDelete.style.color = '#b91c1c';

    try {
      const response = await fetch(`/api/vouchers/${id}`);
      if (response.ok) {
        const data = await response.json();
        const voucher = data.voucher;

        // Populate details safely to avoid template injection or XSS
        invoiceMerchantName.textContent = currentUser ? currentUser.shopName : 'Shankar Traders';
        
        // Build merchant contact block safely
        invoiceMerchantDetails.replaceChildren();
        if (currentUser) {
          const ownerDiv = document.createElement('div');
          ownerDiv.textContent = `Owner: ${currentUser.ownerName}`;
          invoiceMerchantDetails.appendChild(ownerDiv);
          
          const mobileDiv = document.createElement('div');
          mobileDiv.textContent = `Mobile: ${currentUser.mobile} | Email: ${currentUser.email}`;
          invoiceMerchantDetails.appendChild(mobileDiv);

          if (currentUser.gstin) {
            const gstinDiv = document.createElement('div');
            gstinDiv.textContent = `GSTIN: ${currentUser.gstin.toUpperCase()}`;
            invoiceMerchantDetails.appendChild(gstinDiv);
          }
        } else {
          invoiceMerchantDetails.textContent = '12, MG Road, Bengaluru, KA 560001\nGSTIN: 29ABCDE1234F2Z5';
        }

        // Status badge
        invoiceStatusBadge.className = `badge badge-${voucher.status.toLowerCase()}`;
        invoiceStatusBadge.textContent = voucher.status;

        invoicePartyName.textContent = voucher.partyName;
        invoiceDate.textContent = formatInvoiceDate(voucher.date);

        // Render Invoice items table or hide if empty
        invoiceItemsTbody.replaceChildren();
        if (voucher.items && voucher.items.length > 0) {
          invoiceItemsWrapper.style.display = 'block';
          
          voucher.items.forEach(item => {
            const tr = document.createElement('tr');

            const tdItem = document.createElement('td');
            tdItem.textContent = item.name;
            const rateSpan = document.createElement('span');
            rateSpan.className = 'item-rate';
            rateSpan.textContent = `@ ${formatRupees(item.rate)}/unit`;
            tdItem.appendChild(rateSpan);

            const tdQty = document.createElement('td');
            tdQty.className = 'center-align';
            tdQty.textContent = item.qty;

            const tdAmt = document.createElement('td');
            tdAmt.className = 'right-align';
            tdAmt.textContent = formatRupees(item.amount);

            tr.appendChild(tdItem);
            tr.appendChild(tdQty);
            tr.appendChild(tdAmt);

            invoiceItemsTbody.appendChild(tr);
          });

          // Show subtotal and GST details
          invoiceSubtotal.closest('.totals-row').style.display = 'flex';
          invoiceGst.closest('.totals-row').style.display = 'flex';
          invoiceSubtotal.textContent = formatRupees(voucher.subtotal);
          invoiceGst.textContent = formatRupees(voucher.gstAmount);
        } else {
          // Direct amount payment / Receipt
          invoiceItemsWrapper.style.display = 'none';
          invoiceSubtotal.closest('.totals-row').style.display = 'none';
          invoiceGst.closest('.totals-row').style.display = 'none';
        }

        invoiceTotal.textContent = formatRupees(voucher.totalAmount);

        if (voucher.terms) {
          invoiceTermsWrapper.style.display = 'block';
          invoiceTerms.textContent = voucher.terms;
        } else {
          invoiceTermsWrapper.style.display = 'none';
        }

        openModal(voucherDetailModal);
      }
    } catch (err) {
      console.error('Error fetching voucher details:', err);
    }
  }

  // Verification helper: Checks if the user is authenticated via API session
  async function checkAuthStatus() {
    try {
      const response = await fetch('/api/auth/profile');
      if (response.ok) {
        const data = await response.json();
        currentUser = data.user;
        
        // Sync profile variables
        document.getElementById('prof-shop-name').textContent = currentUser.shopName;
        document.getElementById('prof-owner-name').textContent = currentUser.ownerName;
        document.getElementById('prof-email').textContent = currentUser.email;
        document.getElementById('prof-mobile').textContent = currentUser.mobile;
        
        const gstinEl = document.getElementById('prof-gstin');
        const gstinWrapper = document.getElementById('prof-gstin-wrapper');
        if (currentUser.gstin) {
          gstinEl.textContent = currentUser.gstin.toUpperCase();
          gstinWrapper.style.display = 'block';
        } else {
          gstinWrapper.style.display = 'none';
        }

        // Header Avatar sync
        displayShopName.textContent = currentUser.shopName;
        avatarChar.textContent = currentUser.shopName.substring(0, 1).toUpperCase();
        document.getElementById('profile-initials').textContent = currentUser.shopName.substring(0, 2).toUpperCase();

        switchView('app');
        fetchAndRenderVouchers();
      } else {
        switchView('login');
      }
    } catch (err) {
      switchView('login');
    }
  }

  // Switch App Views helper
  function switchView(view) {
    hideAlerts();
    if (view === 'login') {
      registerView.style.display = 'none';
      appView.style.display = 'none';
      loginView.style.display = 'block';
    } else if (view === 'register') {
      loginView.style.display = 'none';
      appView.style.display = 'none';
      registerView.style.display = 'block';
    } else if (view === 'app') {
      loginView.style.display = 'none';
      registerView.style.display = 'none';
      appView.style.display = 'flex';
      setActiveTab(navVouchers);
    }
  }

  // CSS Modals visibility triggers
  function openModal(modal) {
    modal.style.display = 'flex';
  }

  function closeModal(modal) {
    modal.style.display = 'none';
  }

  // Toast-like notification helper (Vanilla JS modal popup replacement)
  function showNotification(msg) {
    const notifyCard = document.createElement('div');
    notifyCard.className = 'alert-message success-message';
    notifyCard.style.position = 'absolute';
    notifyCard.style.top = '20px';
    notifyCard.style.left = '20px';
    notifyCard.style.width = 'calc(100% - 40px)';
    notifyCard.style.zIndex = '1000';
    notifyCard.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)';
    notifyCard.textContent = msg;

    appView.appendChild(notifyCard);

    setTimeout(() => {
      notifyCard.remove();
    }, 3500);
  }

  // Password fields visibility toggles
  function setupPasswordToggles() {
    const toggles = document.querySelectorAll('.password-toggle');
    toggles.forEach(toggle => {
      toggle.addEventListener('click', () => {
        const input = toggle.previousElementSibling;
        const openIcon = toggle.querySelector('.eye-open-icon');
        const closedIcon = toggle.querySelector('.eye-closed-icon');

        if (input.type === 'password') {
          input.type = 'text';
          openIcon.style.display = 'none';
          closedIcon.style.display = 'block';
        } else {
          input.type = 'password';
          openIcon.style.display = 'block';
          closedIcon.style.display = 'none';
        }
      });
    });
  }

  // Helper formatting libraries
  function formatRupees(amount) {
    const parsed = parseFloat(amount);
    if (isNaN(parsed)) return '₹0.00';
    return '₹' + parsed.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  // Formatting date 'YYYY-MM-DD' to Day labels '15 JUN'
  function formatDayLabel(dateString) {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  }

  // Formatting date 'YYYY-MM-DD' to Invoice layout format '15 Jun 2026'
  function formatInvoiceDate(dateString) {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const months = ['Jun', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    // In our seed date mockups, it writes "Jun" for June
    const monthName = d.toLocaleString('en-US', { month: 'short' });
    return `${d.getDate()} ${monthName} ${d.getFullYear()}`;
  }

  // Svg assets generators matching screenshot designs
  function getVoucherIconSvg(type) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '24');
    svg.setAttribute('height', '24');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('fill', 'currentColor');

    if (type === 'Sales') {
      // cash box / invoice
      path.setAttribute('d', 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z'); // fallback helper
      // Wait, let's draw standard business bills icon
      path.setAttribute('d', 'M5 8h14V6H5v2zm0 4h14v-2H5v2zm0 4h14v-2H5v2zM2 4v16h20V4H2zm18 14H4V6h16v12z');
    } else if (type === 'Purchase') {
      // shopping cart
      path.setAttribute('d', 'M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z');
    } else if (type === 'Receipt') {
      // hand holding coins
      path.setAttribute('d', 'M5 11h4c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2zm0-6h4v4H5V5zm14 8h-4c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2zm0 6h-4v-4h4v4zM19 3h-4c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 6h-4V5h4v4zM5 13h4c1.1 0 2-.9 2-2v4c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2v-4c0 1.1.9 2 2 2zm0 6h4v-4H5v4z'); // standard grids
      path.setAttribute('d', 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z');
    } else {
      // wallet / payment
      path.setAttribute('d', 'M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z');
    }

    svg.appendChild(path);
    return svg;
  }

  // Clear Form Alerts
  function showError(element, msg) {
    element.textContent = msg;
    element.style.display = 'block';
  }

  function showSuccess(element, msg) {
    element.textContent = msg;
    element.style.display = 'block';
  }

  function hideAlerts() {
    registerError.style.display = 'none';
    registerSuccess.style.display = 'none';
    loginError.style.display = 'none';
    loginSuccess.style.display = 'none';
  }
});
