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
                                <td><img src="${p.images?.[0] || p.imageUrl || 'assets/img/placeholder.png'}" width="50" height="50" style="object-fit:cover;border-radius:8px;"></td>
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

function showProductModal(product = null) {
    currentEditProductId = product ? product._id : null;

    // Create modal if it doesn't exist
    let modal = document.getElementById('productModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'productModal';
        modal.className = 'admin-modal';
        modal.innerHTML = `
            <div class="admin-modal-content">
                <div class="admin-modal-header">
                    <h4 id="productModalTitle">เพิ่มสินค้าใหม่</h4>
                    <button type="button" class="close-modal" onclick="closeProductModal()">&times;</button>
                </div>
                <form id="productForm" onsubmit="saveProduct(event)">
                    <div class="form-group">
                        <label>ชื่อสินค้า *</label>
                        <input type="text" id="productName" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>คำอธิบาย</label>
                        <textarea id="productDescription" class="form-control" rows="3"></textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group half">
                            <label>ราคา (บาท) *</label>
                            <input type="number" id="productPrice" class="form-control" min="0" step="0.01" required>
                        </div>
                        <div class="form-group half">
                            <label>ราคาลด (บาท)</label>
                            <input type="number" id="productSalePrice" class="form-control" min="0" step="0.01">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group half">
                            <label>จำนวนในคลัง *</label>
                            <input type="number" id="productStock" class="form-control" min="0" required>
                        </div>
                        <div class="form-group half">
                            <label>SKU</label>
                            <input type="text" id="productSku" class="form-control">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>URL รูปภาพ</label>
                        <input type="text" id="productImage" class="form-control" placeholder="https://...">
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="productActive" checked> สินค้าพร้อมขาย
                        </label>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn-tanyarat-outline" onclick="closeProductModal()">ยกเลิก</button>
                        <button type="submit" class="btn-tanyarat">บันทึกสินค้า</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        // Add modal styles
        if (!document.getElementById('modalStyles')) {
            const styles = document.createElement('style');
            styles.id = 'modalStyles';
            styles.textContent = `
                .admin-modal { position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999; }
                .admin-modal-content { background:#fff;border-radius:16px;width:90%;max-width:500px;max-height:90vh;overflow-y:auto; }
                .admin-modal-header { display:flex;justify-content:space-between;align-items:center;padding:20px;border-bottom:1px solid #eee; }
                .admin-modal-header h4 { margin:0;font-weight:600; }
                .close-modal { background:none;border:none;font-size:24px;cursor:pointer;color:#666; }
                #productForm { padding:20px; }
                .form-group { margin-bottom:15px; }
                .form-group label { display:block;margin-bottom:5px;font-weight:500; }
                .form-group .form-control { width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:8px;font-size:14px; }
                .form-row { display:flex;gap:15px; }
                .form-group.half { flex:1; }
                .modal-actions { display:flex;gap:10px;justify-content:flex-end;margin-top:20px;padding-top:20px;border-top:1px solid #eee; }
            `;
            document.head.appendChild(styles);
        }
    }

    // Fill form if editing
    if (product) {
        document.getElementById('productModalTitle').textContent = 'แก้ไขสินค้า';
        document.getElementById('productName').value = product.name || '';
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productPrice').value = product.price || 0;
        document.getElementById('productSalePrice').value = product.salePrice || '';
        document.getElementById('productStock').value = product.stock || 0;
        document.getElementById('productSku').value = product.sku || '';
        document.getElementById('productImage').value = product.imageUrl || product.images?.[0] || '';
        document.getElementById('productActive').checked = product.isActive !== false;
    } else {
        document.getElementById('productModalTitle').textContent = 'เพิ่มสินค้าใหม่';
        document.getElementById('productForm').reset();
        document.getElementById('productActive').checked = true;
    }

    modal.style.display = 'flex';
}

function closeProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) modal.style.display = 'none';
    currentEditProductId = null;
}

async function saveProduct(e) {
    e.preventDefault();

    const token = localStorage.getItem('authToken');
    if (!token) {
        alert('กรุณา login ใหม่');
        return;
    }

    const productData = {
        name: document.getElementById('productName').value.trim(),
        description: document.getElementById('productDescription').value.trim(),
        price: parseFloat(document.getElementById('productPrice').value) || 0,
        salePrice: parseFloat(document.getElementById('productSalePrice').value) || null,
        stock: parseInt(document.getElementById('productStock').value) || 0,
        sku: document.getElementById('productSku').value.trim() || undefined,
        images: document.getElementById('productImage').value.trim() ? [document.getElementById('productImage').value.trim()] : [],
        isActive: document.getElementById('productActive').checked
    };

    try {
        const url = currentEditProductId
            ? `/api/admin/products/${currentEditProductId}`
            : '/api/admin/products';

        const method = currentEditProductId ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productData)
        });

        const data = await res.json();

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
    }
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