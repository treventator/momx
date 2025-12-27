/**
 * TANYARAT Admin Dashboard - Clean Implementation
 * Version 2.0
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('TANYARAT Admin Dashboard loaded');

    // Elements
    const loginSection = document.getElementById('loginSection');
    const dashboardSection = document.getElementById('dashboardSection');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const logoutBtn = document.getElementById('logoutBtn');

    // Check authentication
    const token = localStorage.getItem('authToken');
    const isLoggedIn = sessionStorage.getItem('isAdminLoggedIn') === 'true';

    if (token && isLoggedIn) {
        showDashboard();
    } else {
        showLogin();
    }

    // Login form handler
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Logout handler
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});

// ==================== AUTH FUNCTIONS ====================

async function handleLogin(e) {
    e.preventDefault();

    const loginError = document.getElementById('loginError');
    const email = document.getElementById('username')?.value.trim();
    const password = document.getElementById('password')?.value;

    // Hide previous errors
    if (loginError) loginError.classList.add('d-none');

    if (!email || !password) {
        showError('กรุณากรอกอีเมลและรหัสผ่าน');
        return;
    }

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok && data.success && data.user?.token) {
            if (data.user.role !== 'admin') {
                showError('คุณไม่มีสิทธิ์เข้าถึงหน้า Admin');
                return;
            }

            // Store token
            localStorage.setItem('authToken', data.user.token);
            sessionStorage.setItem('isAdminLoggedIn', 'true');

            showDashboard();
        } else {
            showError(data.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
}

function handleLogout(e) {
    e.preventDefault();
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('isAdminLoggedIn');
    location.reload();
}

function showError(message) {
    const loginError = document.getElementById('loginError');
    if (loginError) {
        loginError.textContent = message;
        loginError.classList.remove('d-none');
    }
}

function showLogin() {
    const loginSection = document.getElementById('loginSection');
    const dashboardSection = document.getElementById('dashboardSection');

    if (loginSection) loginSection.classList.remove('d-none');
    if (dashboardSection) dashboardSection.classList.add('d-none');
}

function showDashboard() {
    const loginSection = document.getElementById('loginSection');
    const dashboardSection = document.getElementById('dashboardSection');

    if (loginSection) loginSection.classList.add('d-none');
    if (dashboardSection) dashboardSection.classList.remove('d-none');

    // Initialize dashboard
    initSidebar();
    loadStats();
    loadRecentOrders();

    // Add Product Button handler
    const addProductBtn = document.getElementById('addProductBtn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', () => showProductModal());
    }
}


// ==================== SIDEBAR NAVIGATION ====================

function initSidebar() {
    const sidebarItems = document.querySelectorAll('.sidebar-nav-item[data-section]');
    const pageTitle = document.getElementById('pageTitle');

    sidebarItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            const section = item.getAttribute('data-section');
            console.log('Navigating to:', section);

            // Update active state
            sidebarItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // Hide all sections
            document.querySelectorAll('.admin-section').forEach(s => {
                s.classList.add('d-none');
            });

            // Show selected section
            const targetSection = document.getElementById(section + 'Section');
            if (targetSection) {
                targetSection.classList.remove('d-none');
            }

            // Update title
            const titles = {
                'overview': 'ภาพรวม',
                'products': 'จัดการสินค้า',
                'orders': 'จัดการออเดอร์',
                'contacts': 'ข้อความติดต่อ',
                'users': 'จัดการผู้ใช้',
                'payments': 'ช่องทางชำระเงิน',
                'settings': 'ตั้งค่า'
            };
            if (pageTitle) pageTitle.textContent = titles[section] || 'ภาพรวม';

            // Load section data
            loadSectionData(section);
        });
    });

    // Mobile toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('adminSidebar');
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('show');
        });
    }
}

// ==================== DATA LOADING ====================

function getAuthHeaders() {
    return {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
    };
}

async function loadStats() {
    const token = localStorage.getItem('authToken');

    try {
        // Load orders for sales stats
        const ordersRes = await fetch('/api/admin/orders', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const ordersData = await ordersRes.json();

        if (ordersData.success && ordersData.orders) {
            const totalSales = ordersData.orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
            setElementText('statSales', '฿' + totalSales.toLocaleString());
            setElementText('statOrders', ordersData.orders.length);
        }

        // Load contacts
        const contactsRes = await fetch('/api/admin/contacts', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const contactsData = await contactsRes.json();

        if (contactsData.success && contactsData.contacts) {
            setElementText('statContacts', contactsData.contacts.length);
        }

        // Load users
        const usersRes = await fetch('/api/admin/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const usersData = await usersRes.json();

        if (usersData.success && usersData.users) {
            setElementText('statUsers', usersData.users.length);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadRecentOrders() {
    const token = localStorage.getItem('authToken');
    const tbody = document.getElementById('recentOrdersBody');
    if (!tbody) return;

    try {
        const res = await fetch('/api/admin/orders?limit=5', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success && data.orders?.length > 0) {
            tbody.innerHTML = data.orders.slice(0, 5).map(order => renderOrderRow(order)).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4">ยังไม่มีออเดอร์</td></tr>';
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-danger">เกิดข้อผิดพลาด</td></tr>';
    }
}

function loadSectionData(section) {
    switch (section) {
        case 'products': loadProducts(); break;
        case 'orders': loadOrders(); break;
        case 'contacts': loadContacts(); break;
        case 'users': loadUsers(); break;
    }
}

async function loadProducts() {
    const container = document.getElementById('productsContainer');
    if (!container) return;

    container.innerHTML = '<p class="text-center py-4">กำลังโหลด...</p>';
    const token = localStorage.getItem('authToken');

    try {
        const res = await fetch('/api/admin/products', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success && data.products?.length > 0) {
            container.innerHTML = `
                <div class="section-header">
                    <h3>สินค้าทั้งหมด (${data.products.length})</h3>
                    <button class="btn-tanyarat" onclick="showProductModal()">
                        <i class="fa fa-plus me-1"></i>เพิ่มสินค้า
                    </button>
                </div>
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>รูป</th>
                            <th>ชื่อสินค้า</th>
                            <th>ราคา</th>
                            <th>คลัง</th>
                            <th>สถานะ</th>
                            <th>การดำเนินการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.products.map(p => `
                            <tr>
                                <td><img src="${p.images?.[0]?.url || p.imageUrl || 'assets/img/placeholder.png'}" width="50" height="50" style="object-fit:cover;border-radius:8px;"></td>
                                <td>${p.name}</td>
                                <td>฿${(p.price || 0).toLocaleString()}${p.salePrice ? `<br><small class="text-danger">ลด ฿${p.salePrice.toLocaleString()}</small>` : ''}</td>
                                <td><span class="${p.stock < 5 ? 'text-danger fw-bold' : ''}">${p.stock || 0}</span></td>
                                <td>${p.isActive ? '<span class="badge bg-success">พร้อมขาย</span>' : '<span class="badge bg-secondary">ปิด</span>'}</td>
                                <td>
                                    <button class="btn-tanyarat-outline" onclick="editProduct('${p._id}')" title="แก้ไข">
                                        <i class="fa fa-edit"></i>
                                    </button>
                                    <button class="btn-tanyarat-outline text-danger" onclick="deleteProduct('${p._id}')" title="ลบ">
                                        <i class="fa fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else {
            container.innerHTML = `
                <div class="section-header">
                    <h3>สินค้าทั้งหมด</h3>
                    <button class="btn-tanyarat" onclick="showProductModal()">
                        <i class="fa fa-plus me-1"></i>เพิ่มสินค้า
                    </button>
                </div>
                <p class="text-center py-4">ยังไม่มีสินค้า - กดปุ่ม "เพิ่มสินค้า" เพื่อเริ่มต้น</p>
            `;
        }
    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = '<p class="text-center py-4 text-danger">เกิดข้อผิดพลาด</p>';
    }
}

async function loadOrders() {
    const container = document.getElementById('ordersContainer');
    if (!container) return;

    container.innerHTML = '<p class="text-center py-4">กำลังโหลด...</p>';

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch('/api/admin/orders', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success && data.orders?.length > 0) {
            container.innerHTML = `
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>หมายเลข</th>
                            <th>ลูกค้า</th>
                            <th>สถานะ</th>
                            <th>ยอดรวม</th>
                            <th>วันที่</th>
                            <th>การดำเนินการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.orders.map(order => `
                            <tr>
                                <td>#${order.orderNumber || order._id?.slice(-6)}</td>
                                <td>${order.user?.lineProfile?.displayName || order.shippingAddress?.fullName || 'ไม่ระบุ'}</td>
                                <td><span class="status-badge ${order.status || 'pending'}">${getStatusText(order.status)}</span></td>
                                <td>฿${(order.totalAmount || 0).toLocaleString()}</td>
                                <td>${formatDate(order.createdAt)}</td>
                                <td>
                                    <button class="btn-tanyarat-outline" onclick="viewOrder('${order._id}')">
                                        <i class="fa fa-eye"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else {
            container.innerHTML = '<p class="text-center py-4">ยังไม่มีออเดอร์</p>';
        }
    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = '<p class="text-center py-4 text-danger">เกิดข้อผิดพลาด</p>';
    }
}

async function loadContacts() {
    const container = document.getElementById('contactsContainer');
    if (!container) return;

    container.innerHTML = '<p class="text-center py-4">กำลังโหลด...</p>';

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch('/api/admin/contacts', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success && data.contacts?.length > 0) {
            container.innerHTML = `
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>ชื่อ</th>
                            <th>LINE ID</th>
                            <th>ข้อความ</th>
                            <th>วันที่</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.contacts.map(c => `
                            <tr>
                                <td>${c.name}</td>
                                <td>${c.lineId || '-'}</td>
                                <td>${(c.message || '').substring(0, 50)}${c.message?.length > 50 ? '...' : ''}</td>
                                <td>${formatDate(c.createdAt)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else {
            container.innerHTML = '<p class="text-center py-4">ยังไม่มีข้อความติดต่อ</p>';
        }
    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = '<p class="text-center py-4 text-danger">เกิดข้อผิดพลาด</p>';
    }
}

async function loadUsers() {
    const container = document.getElementById('usersContainer');
    if (!container) return;

    container.innerHTML = '<p class="text-center py-4">กำลังโหลด...</p>';

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch('/api/admin/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success && data.users?.length > 0) {
            container.innerHTML = `
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>รูป</th>
                            <th>ชื่อ</th>
                            <th>อีเมล</th>
                            <th>บทบาท</th>
                            <th>วันที่สมัคร</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.users.map(u => `
                            <tr>
                                <td><img src="${u.lineProfile?.pictureUrl || 'assets/img/placeholder.png'}" width="40" height="40" style="object-fit:cover;border-radius:50%;"></td>
                                <td>${u.lineProfile?.displayName || u.firstName || 'ไม่ระบุ'}</td>
                                <td>${u.email || '-'}</td>
                                <td><span class="status-badge ${u.role === 'admin' ? 'shipped' : 'pending'}">${u.role || 'user'}</span></td>
                                <td>${formatDate(u.createdAt)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else {
            container.innerHTML = '<p class="text-center py-4">ยังไม่มีผู้ใช้</p>';
        }
    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = '<p class="text-center py-4 text-danger">เกิดข้อผิดพลาด</p>';
    }
}

// ==================== HELPER FUNCTIONS ====================

function setElementText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function getStatusText(status) {
    const map = {
        'pending': 'รอดำเนินการ',
        'processing': 'กำลังจัดส่ง',
        'shipped': 'จัดส่งแล้ว',
        'delivered': 'ได้รับสินค้า',
        'cancelled': 'ยกเลิก'
    };
    return map[status] || status || 'รอดำเนินการ';
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('th-TH');
}

function renderOrderRow(order) {
    const customer = order.user?.lineProfile?.displayName || order.shippingAddress?.fullName || 'ไม่ระบุ';
    return `
        <tr>
            <td>#${order.orderNumber || order._id?.slice(-6)}</td>
            <td>${customer}</td>
            <td><span class="status-badge ${order.status || 'pending'}">${getStatusText(order.status)}</span></td>
            <td>฿${(order.totalAmount || 0).toLocaleString()}</td>
            <td>${formatDate(order.createdAt)}</td>
        </tr>
    `;
}

// ==================== PRODUCT ACTIONS ====================

let currentEditProductId = null;
let productModalInstance = null;
let selectedImages = []; // Store selected image files
let mainImageIndex = 0;

function showProductModal(product = null) {
    currentEditProductId = product ? product._id : null;
    selectedImages = [];
    mainImageIndex = 0;

    // Get Bootstrap modal element
    const modalEl = document.getElementById('productModal');
    if (!modalEl) {
        console.error('Product modal not found');
        alert('ไม่พบ Modal สำหรับเพิ่มสินค้า');
        return;
    }

    // Create Bootstrap modal instance if not exists
    if (!productModalInstance) {
        productModalInstance = new bootstrap.Modal(modalEl);
    }

    // Reset form
    const formEl = document.getElementById('productForm');
    if (formEl) formEl.reset();

    // Clear image preview
    const previewContainer = document.getElementById('imagePreviewContainer');
    if (previewContainer) previewContainer.innerHTML = '';

    // Show add button
    const addBtn = document.getElementById('addImageBtn');
    if (addBtn) addBtn.style.display = 'flex';

    // Get form elements
    const titleEl = document.getElementById('productModalLabel');
    const productIdEl = document.getElementById('productId');
    const nameEl = document.getElementById('productName');
    const categoryEl = document.getElementById('productCategory');
    const priceEl = document.getElementById('productPrice');
    const salePriceEl = document.getElementById('productSalePrice');
    const stockEl = document.getElementById('productStock');
    const skuEl = document.getElementById('productSku');
    const weightEl = document.getElementById('productWeight');
    const descriptionEl = document.getElementById('productDescription');
    const ingredientsEl = document.getElementById('productIngredients');
    const tagsEl = document.getElementById('productTags');
    const activeEl = document.getElementById('productActive');
    const featuredEl = document.getElementById('productFeatured');

    // Fill form for edit mode
    if (product) {
        if (titleEl) titleEl.textContent = 'แก้ไขสินค้า';
        if (productIdEl) productIdEl.value = product._id || '';
        if (nameEl) nameEl.value = product.name || '';
        if (categoryEl) categoryEl.value = product.category || '';
        if (priceEl) priceEl.value = product.price || 0;
        if (salePriceEl) salePriceEl.value = product.salePrice || '';
        if (stockEl) stockEl.value = product.stock || 0;
        if (skuEl) skuEl.value = product.sku || '';
        if (weightEl) weightEl.value = product.weight || '';
        if (descriptionEl) descriptionEl.value = product.description || '';
        if (ingredientsEl) ingredientsEl.value = product.ingredients || '';
        if (tagsEl) tagsEl.value = (product.tags || []).join(', ');
        if (activeEl) activeEl.checked = product.isActive !== false;
        if (featuredEl) featuredEl.checked = product.isFeatured === true;

        // Load existing images
        if (product.images && product.images.length > 0) {
            product.images.forEach((img, index) => {
                addExistingImagePreview(img.url || img, index === 0);
            });
        }
    } else {
        if (titleEl) titleEl.textContent = 'เพิ่มสินค้าใหม่';
        if (productIdEl) productIdEl.value = '';
        if (activeEl) activeEl.checked = true;
        if (featuredEl) featuredEl.checked = false;
    }

    // Setup drag and drop
    setupDragAndDrop();

    // Show modal using Bootstrap API
    productModalInstance.show();
}

function closeProductModal() {
    if (productModalInstance) {
        productModalInstance.hide();
    }
    selectedImages = [];
    mainImageIndex = 0;
}

// ==================== IMAGE UPLOAD ====================

function setupDragAndDrop() {
    const uploadArea = document.getElementById('imageUploadArea');
    if (!uploadArea) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.remove('dragover');
        }, false);
    });

    uploadArea.addEventListener('drop', handleDrop, false);
}

function handleDrop(e) {
    const files = e.dataTransfer.files;
    handleFiles(files);
}

function handleImageSelect(e) {
    const files = e.target.files;
    handleFiles(files);
}

function handleFiles(files) {
    const maxFiles = 5;
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

    for (let file of files) {
        if (selectedImages.length >= maxFiles) {
            alert('อัพโหลดได้สูงสุด 5 รูป');
            break;
        }

        if (!allowedTypes.includes(file.type)) {
            alert(`${file.name} ไม่ใช่ไฟล์รูปภาพที่รองรับ`);
            continue;
        }

        if (file.size > maxSize) {
            alert(`${file.name} มีขนาดเกิน 10MB`);
            continue;
        }

        selectedImages.push(file);
        addImagePreview(file, selectedImages.length - 1);
    }

    updateAddButtonVisibility();

    // Clear input so same file can be selected again
    document.getElementById('productImages').value = '';
}

function addImagePreview(file, index) {
    const container = document.getElementById('imagePreviewContainer');
    const reader = new FileReader();

    reader.onload = function (e) {
        const div = document.createElement('div');
        div.className = 'image-preview-item';
        div.dataset.index = index;

        const isMain = index === mainImageIndex;

        div.innerHTML = `
            <img src="${e.target.result}" alt="Preview">
            ${isMain ? '<span class="main-badge">⭐ หลัก</span>' : `<button type="button" class="set-main-btn" onclick="setMainImage(${index})">⭐</button>`}
            <button type="button" class="delete-btn" onclick="removeImage(${index})">✕</button>
        `;

        container.appendChild(div);
    };

    reader.readAsDataURL(file);
}

function addExistingImagePreview(url, isMain) {
    const container = document.getElementById('imagePreviewContainer');

    const div = document.createElement('div');
    div.className = 'image-preview-item existing-image';
    div.dataset.url = url;

    div.innerHTML = `
        <img src="${url}" alt="Product image" onerror="this.src='/assets/img/no-image.png'">
        ${isMain ? '<span class="main-badge">⭐ หลัก</span>' : '<button type="button" class="set-main-btn" onclick="setMainExisting(this)">⭐</button>'}
        <button type="button" class="delete-btn" onclick="removeExistingImage(this)">✕</button>
    `;

    container.appendChild(div);
}

function removeImage(index) {
    selectedImages.splice(index, 1);

    // Adjust main image index
    if (mainImageIndex >= selectedImages.length) {
        mainImageIndex = Math.max(0, selectedImages.length - 1);
    }

    refreshImagePreviews();
}

function removeExistingImage(btn) {
    const item = btn.closest('.image-preview-item');
    if (item) item.remove();
    updateAddButtonVisibility();
}

function setMainImage(index) {
    mainImageIndex = index;
    refreshImagePreviews();
}

function setMainExisting(btn) {
    // Remove all main badges
    document.querySelectorAll('.image-preview-item .main-badge').forEach(badge => {
        const parent = badge.parentElement;
        badge.remove();
        const setBtn = document.createElement('button');
        setBtn.type = 'button';
        setBtn.className = 'set-main-btn';
        setBtn.textContent = '⭐';
        setBtn.onclick = function () { setMainExisting(this); };
        parent.insertBefore(setBtn, parent.querySelector('.delete-btn'));
    });

    // Show all set-main buttons
    document.querySelectorAll('.image-preview-item .set-main-btn').forEach(b => {
        b.style.display = '';
    });

    // Set this as main
    const item = btn.closest('.image-preview-item');
    btn.remove();
    const badge = document.createElement('span');
    badge.className = 'main-badge';
    badge.textContent = '⭐ หลัก';
    item.insertBefore(badge, item.querySelector('.delete-btn'));
}

function refreshImagePreviews() {
    const container = document.getElementById('imagePreviewContainer');

    // Keep existing images
    const existingImages = container.querySelectorAll('.existing-image');
    container.innerHTML = '';
    existingImages.forEach(img => container.appendChild(img));

    // Re-add new images
    selectedImages.forEach((file, index) => {
        addImagePreview(file, index);
    });

    updateAddButtonVisibility();
}

function updateAddButtonVisibility() {
    const addBtn = document.getElementById('addImageBtn');
    const existingCount = document.querySelectorAll('.image-preview-item.existing-image').length;
    const totalCount = selectedImages.length + existingCount;

    if (addBtn) {
        addBtn.style.display = totalCount >= 5 ? 'none' : 'flex';
    }
}



// Note: saveProductBtn uses onclick in HTML - no need for addEventListener here
// Removed duplicate event listener to prevent double submit


async function saveProduct(e) {
    if (e) e.preventDefault();

    const token = localStorage.getItem('authToken');
    if (!token) {
        alert('กรุณา login ใหม่');
        return;
    }

    // Show loading state
    const saveText = document.getElementById('saveProductText');
    const saveLoading = document.getElementById('saveProductLoading');
    const saveBtn = document.getElementById('saveProductBtn');

    if (saveText) saveText.classList.add('d-none');
    if (saveLoading) saveLoading.classList.remove('d-none');
    if (saveBtn) saveBtn.disabled = true;

    try {
        // Get form values
        const productData = {
            name: document.getElementById('productName')?.value.trim() || '',
            category: document.getElementById('productCategory')?.value || '',
            description: document.getElementById('productDescription')?.value.trim() || '',
            price: parseFloat(document.getElementById('productPrice')?.value) || 0,
            salePrice: parseFloat(document.getElementById('productSalePrice')?.value) || 0,
            stock: parseInt(document.getElementById('productStock')?.value) || 0,
            sku: document.getElementById('productSku')?.value.trim() || '',
            weight: parseFloat(document.getElementById('productWeight')?.value) || 0,
            ingredients: document.getElementById('productIngredients')?.value.trim() || '',
            tags: (document.getElementById('productTags')?.value || '').split(',').map(t => t.trim()).filter(t => t),
            isActive: document.getElementById('productActive')?.checked !== false,
            isFeatured: document.getElementById('productFeatured')?.checked === true
        };

        // Validate required fields
        if (!productData.name) {
            alert('กรุณากรอกชื่อสินค้า');
            resetSaveButton();
            return;
        }
        if (!productData.price || productData.price <= 0) {
            alert('กรุณากรอกราคาสินค้า');
            resetSaveButton();
            return;
        }
        if (!productData.description) {
            alert('กรุณากรอกรายละเอียดสินค้า');
            resetSaveButton();
            return;
        }

        let res, data;

        // Check if we have new images to upload
        if (selectedImages.length > 0 && !currentEditProductId) {
            // Create product with images using FormData
            const formData = new FormData();
            formData.append('productData', JSON.stringify(productData));

            // Append images in correct order (main image first)
            if (mainImageIndex > 0 && mainImageIndex < selectedImages.length) {
                // Put main image first
                formData.append('images', selectedImages[mainImageIndex]);
                selectedImages.forEach((file, index) => {
                    if (index !== mainImageIndex) {
                        formData.append('images', file);
                    }
                });
            } else {
                selectedImages.forEach(file => {
                    formData.append('images', file);
                });
            }

            res = await fetch('/api/admin/products/with-images', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
        } else {
            // Regular JSON request for update or create without new images
            const url = currentEditProductId
                ? `/api/admin/products/${currentEditProductId}`
                : '/api/admin/products';
            const method = currentEditProductId ? 'PUT' : 'POST';

            // Collect existing images if any
            const existingImages = [];
            document.querySelectorAll('.image-preview-item.existing-image').forEach((item, index) => {
                const url = item.dataset.url;
                const isMain = item.querySelector('.main-badge') !== null;
                if (url) {
                    existingImages.push({ url, isMain, alt: productData.name });
                }
            });

            if (existingImages.length > 0) {
                productData.images = existingImages;
            }

            res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(productData)
            });
        }

        data = await res.json();

        if (res.ok && data.success) {
            alert(currentEditProductId ? 'แก้ไขสินค้าสำเร็จ!' : 'เพิ่มสินค้าสำเร็จ!');
            closeProductModal();
            loadProducts(); // Reload list
        } else {
            alert('เกิดข้อผิดพลาด: ' + (data.message || 'ไม่สามารถบันทึกได้'));
        }
    } catch (error) {
        console.error('Save product error:', error);
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
        resetSaveButton();
    }
}

function resetSaveButton() {
    const saveText = document.getElementById('saveProductText');
    const saveLoading = document.getElementById('saveProductLoading');
    const saveBtn = document.getElementById('saveProductBtn');

    if (saveText) saveText.classList.remove('d-none');
    if (saveLoading) saveLoading.classList.add('d-none');
    if (saveBtn) saveBtn.disabled = false;
}


async function editProduct(id) {
    const token = localStorage.getItem('authToken');

    try {
        const res = await fetch(`/api/admin/products/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success && data.product) {
            showProductModal(data.product);
        } else {
            alert('ไม่พบสินค้า');
        }
    } catch (error) {
        console.error('Error fetching product:', error);
        alert('เกิดข้อผิดพลาด');
    }
}

async function deleteProduct(id) {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบสินค้านี้?')) return;

    const token = localStorage.getItem('authToken');

    try {
        const res = await fetch(`/api/admin/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (res.ok && data.success) {
            alert('ลบสินค้าสำเร็จ!');
            loadProducts();
        } else {
            alert('ไม่สามารถลบสินค้าได้: ' + (data.message || 'เกิดข้อผิดพลาด'));
        }
    } catch (error) {
        console.error('Delete error:', error);
        alert('เกิดข้อผิดพลาดในการลบ');
    }
}

function viewOrder(id) {
    console.log('View order:', id);
    alert('ฟีเจอร์ดูรายละเอียดออเดอร์กำลังพัฒนา');
}