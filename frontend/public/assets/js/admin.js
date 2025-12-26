// Admin Dashboard JavaScript

document.addEventListener('DOMContentLoaded', () => {
    console.log('Admin Dashboard script loaded.');

    // Senior accessibility enhancements
    initAccessibilityFeatures();

    const loginSection = document.getElementById('loginSection');
    const dashboardContent = document.getElementById('dashboardSection');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');

    // Check if elements exist (new admin design)
    if (!loginSection || !dashboardContent) {
        console.log('New admin design detected - using new element structure');
        initNewAdminDesign();
        return;
    }

    // Check if already logged in (simple check, improve with tokens later)
    if (sessionStorage.getItem('isAdminLoggedIn') === 'true') {
        showDashboard();
    } else {
        // Show login form if not logged in
        if (loginSection) loginSection.classList.remove('d-none');
        if (dashboardContent) dashboardContent.classList.add('d-none');
    }

    // --- Login Form Submission --- 
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            loginError.classList.add('d-none'); // Hide previous errors

            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');
            const email = usernameInput ? usernameInput.value.trim() : '';
            const password = passwordInput ? passwordInput.value : '';

            console.log('Login attempt:', { email, hasPassword: !!password });

            // Validate inputs
            if (!email || !password) {
                loginError.textContent = 'กรุณากรอกอีเมลและรหัสผ่าน';
                loginError.classList.remove('d-none');
                return;
            }

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (response.ok && data.success && data.user && data.user.token) {
                    // Check if user is admin
                    if (data.user.role !== 'admin') {
                        loginError.textContent = 'คุณไม่มีสิทธิ์เข้าถึงหน้า Admin';
                        loginError.classList.remove('d-none');
                        return;
                    }

                    // Login successful
                    console.log('Admin login successful');
                    // Store the authentication token in localStorage
                    localStorage.setItem('authToken', data.user.token);
                    sessionStorage.setItem('isAdminLoggedIn', 'true');
                    showDashboard();
                } else {
                    // Login failed
                    console.error('Admin login failed:', data.message);
                    loginError.textContent = data.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
                    loginError.classList.remove('d-none');

                    // Read error message aloud for accessibility
                    if (isTextToSpeechEnabled()) {
                        speakText(loginError.textContent);
                    }
                }
            } catch (error) {
                console.error('Error during admin login:', error);
                loginError.textContent = 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง';
                loginError.classList.remove('d-none');

                // Read error message aloud for accessibility
                if (isTextToSpeechEnabled()) {
                    speakText(loginError.textContent);
                }
            }
        });
    }
});

// ==================== NEW ADMIN DESIGN FUNCTIONS ====================

function initNewAdminDesign() {
    console.log('Initializing new admin design...');

    const loginSection = document.getElementById('loginSection');
    const dashboardSection = document.getElementById('dashboardSection');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const logoutBtn = document.getElementById('logoutBtn');

    // Check if already logged in
    if (localStorage.getItem('authToken') && sessionStorage.getItem('isAdminLoggedIn') === 'true') {
        showNewDashboard();
        return;
    }

    // Show login, hide dashboard
    if (loginSection) loginSection.classList.remove('d-none');
    if (dashboardSection) dashboardSection.classList.add('d-none');

    // Login form handler
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const emailInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');
            const email = emailInput ? emailInput.value.trim() : '';
            const password = passwordInput ? passwordInput.value : '';

            if (!email || !password) {
                showLoginError('กรุณากรอกอีเมลและรหัสผ่าน');
                return;
            }

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok && data.success && data.user && data.user.token) {
                    if (data.user.role !== 'admin') {
                        showLoginError('คุณไม่มีสิทธิ์เข้าถึงหน้า Admin');
                        return;
                    }

                    localStorage.setItem('authToken', data.user.token);
                    sessionStorage.setItem('isAdminLoggedIn', 'true');
                    showNewDashboard();
                } else {
                    showLoginError(data.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
                }
            } catch (error) {
                console.error('Login error:', error);
                showLoginError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
            }
        });
    }

    // Logout handler
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('isAdminLoggedIn');
            location.reload();
        });
    }

    // Sidebar navigation
    initNewSidebarNav();
}

function showLoginError(message) {
    const loginError = document.getElementById('loginError');
    if (loginError) {
        loginError.textContent = message;
        loginError.classList.remove('d-none');
    }
}

function showNewDashboard() {
    const loginSection = document.getElementById('loginSection');
    const dashboardSection = document.getElementById('dashboardSection');

    if (loginSection) loginSection.classList.add('d-none');
    if (dashboardSection) dashboardSection.classList.remove('d-none');

    // Initialize dashboard
    initNewSidebarNav();
    loadDashboardStats();
    loadRecentOrders();
}

function initNewSidebarNav() {
    const sidebarItems = document.querySelectorAll('.sidebar-nav-item[data-section]');
    const allSections = document.querySelectorAll('.admin-section');
    const pageTitle = document.getElementById('pageTitle');

    sidebarItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.getAttribute('data-section');

            // Update active state
            sidebarItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // Show selected section
            allSections.forEach(s => s.classList.add('d-none'));
            const targetSection = document.getElementById(section + 'Section');
            if (targetSection) targetSection.classList.remove('d-none');

            // Update page title
            const sectionTitles = {
                'overview': 'ภาพรวม',
                'products': 'จัดการสินค้า',
                'orders': 'จัดการออเดอร์',
                'contacts': 'ข้อความติดต่อ',
                'users': 'จัดการผู้ใช้',
                'payments': 'ช่องทางชำระเงิน',
                'settings': 'ตั้งค่า'
            };
            if (pageTitle) pageTitle.textContent = sectionTitles[section] || 'ภาพรวม';

            // Load section data
            loadSectionData(section);
        });
    });

    // Mobile sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('adminSidebar');
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('show');
        });
    }
}

function loadDashboardStats() {
    const authToken = localStorage.getItem('authToken');

    // Fetch sales stats
    fetch('/api/admin/orders', {
        headers: { 'Authorization': `Bearer ${authToken}` }
    })
        .then(res => res.json())
        .then(data => {
            if (data.success && data.orders) {
                const totalSales = data.orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
                const statSales = document.getElementById('statSales');
                const statOrders = document.getElementById('statOrders');
                if (statSales) statSales.textContent = '฿' + totalSales.toLocaleString();
                if (statOrders) statOrders.textContent = data.orders.length;
            }
        })
        .catch(err => console.error('Error loading stats:', err));

    // Fetch contacts count
    fetch('/api/admin/contacts', {
        headers: { 'Authorization': `Bearer ${authToken}` }
    })
        .then(res => res.json())
        .then(data => {
            if (data.success && data.contacts) {
                const statContacts = document.getElementById('statContacts');
                if (statContacts) statContacts.textContent = data.contacts.length;
            }
        })
        .catch(err => console.error('Error loading contacts:', err));

    // Fetch users count
    fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${authToken}` }
    })
        .then(res => res.json())
        .then(data => {
            if (data.success && data.users) {
                const statUsers = document.getElementById('statUsers');
                if (statUsers) statUsers.textContent = data.users.length;
            }
        })
        .catch(err => console.error('Error loading users:', err));
}

function loadRecentOrders() {
    const authToken = localStorage.getItem('authToken');
    const tbody = document.getElementById('recentOrdersBody');
    if (!tbody) return;

    fetch('/api/admin/orders?limit=5', {
        headers: { 'Authorization': `Bearer ${authToken}` }
    })
        .then(res => res.json())
        .then(data => {
            if (data.success && data.orders && data.orders.length > 0) {
                tbody.innerHTML = data.orders.slice(0, 5).map(order => {
                    const statusClass = {
                        'pending': 'pending',
                        'processing': 'processing',
                        'shipped': 'shipped',
                        'delivered': 'delivered',
                        'cancelled': 'cancelled'
                    }[order.status] || 'pending';

                    const statusText = {
                        'pending': 'รอดำเนินการ',
                        'processing': 'กำลังจัดส่ง',
                        'shipped': 'จัดส่งแล้ว',
                        'delivered': 'ได้รับสินค้า',
                        'cancelled': 'ยกเลิก'
                    }[order.status] || order.status;

                    const customerName = order.user?.lineProfile?.displayName ||
                        order.shippingAddress?.fullName ||
                        'ไม่ระบุชื่อ';
                    const date = new Date(order.createdAt).toLocaleDateString('th-TH');

                    return `
                    <tr>
                        <td>#${order.orderNumber || order._id.slice(-6)}</td>
                        <td>${customerName}</td>
                        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                        <td>฿${(order.totalAmount || 0).toLocaleString()}</td>
                        <td>${date}</td>
                    </tr>
                `;
                }).join('');
            } else {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4">ยังไม่มีออเดอร์</td></tr>';
            }
        })
        .catch(err => {
            console.error('Error loading orders:', err);
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-danger">เกิดข้อผิดพลาด</td></tr>';
        });
}

function loadSectionData(section) {
    const authToken = localStorage.getItem('authToken');

    switch (section) {
        case 'products':
            loadProductsSection();
            break;
        case 'orders':
            loadOrdersSection();
            break;
        case 'contacts':
            loadContactsSection();
            break;
        case 'users':
            loadUsersSection();
            break;
    }
}

function loadProductsSection() {
    const container = document.getElementById('productsContainer');
    if (!container) return;

    const authToken = localStorage.getItem('authToken');

    fetch('/api/shop/products', {
        headers: { 'Authorization': `Bearer ${authToken}` }
    })
        .then(res => res.json())
        .then(data => {
            if (data.success && data.products && data.products.length > 0) {
                container.innerHTML = `
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>รูป</th>
                            <th>ชื่อสินค้า</th>
                            <th>ราคา</th>
                            <th>คลัง</th>
                            <th>การดำเนินการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.products.map(p => `
                            <tr>
                                <td><img src="${p.imageUrl || 'assets/img/placeholder.png'}" width="50" height="50" style="object-fit:cover;border-radius:8px;"></td>
                                <td>${p.name}</td>
                                <td>฿${(p.price || 0).toLocaleString()}</td>
                                <td>${p.stock || 0}</td>
                                <td>
                                    <button class="btn-tanyarat-outline" onclick="editProduct('${p._id}')">
                                        <i class="fa fa-edit"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            } else {
                container.innerHTML = '<p class="text-center py-4">ยังไม่มีสินค้า</p>';
            }
        })
        .catch(err => {
            console.error('Error loading products:', err);
            container.innerHTML = '<p class="text-center py-4 text-danger">เกิดข้อผิดพลาด</p>';
        });
}

function loadOrdersSection() {
    const container = document.getElementById('ordersContainer');
    if (!container) return;

    const authToken = localStorage.getItem('authToken');

    fetch('/api/admin/orders', {
        headers: { 'Authorization': `Bearer ${authToken}` }
    })
        .then(res => res.json())
        .then(data => {
            if (data.success && data.orders && data.orders.length > 0) {
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
                        ${data.orders.map(order => {
                    const customerName = order.user?.lineProfile?.displayName ||
                        order.shippingAddress?.fullName || 'ไม่ระบุ';
                    const date = new Date(order.createdAt).toLocaleDateString('th-TH');
                    const statusClass = order.status || 'pending';
                    const statusText = {
                        'pending': 'รอดำเนินการ',
                        'processing': 'กำลังจัดส่ง',
                        'shipped': 'จัดส่งแล้ว',
                        'delivered': 'ได้รับสินค้า',
                        'cancelled': 'ยกเลิก'
                    }[order.status] || order.status;

                    return `
                                <tr>
                                    <td>#${order.orderNumber || order._id.slice(-6)}</td>
                                    <td>${customerName}</td>
                                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                                    <td>฿${(order.totalAmount || 0).toLocaleString()}</td>
                                    <td>${date}</td>
                                    <td>
                                        <button class="btn-tanyarat-outline" onclick="viewOrder('${order._id}')">
                                            <i class="fa fa-eye"></i>
                                        </button>
                                    </td>
                                </tr>
                            `;
                }).join('')}
                    </tbody>
                </table>
            `;
            } else {
                container.innerHTML = '<p class="text-center py-4">ยังไม่มีออเดอร์</p>';
            }
        })
        .catch(err => {
            console.error('Error loading orders:', err);
            container.innerHTML = '<p class="text-center py-4 text-danger">เกิดข้อผิดพลาด</p>';
        });
}

function loadContactsSection() {
    const container = document.getElementById('contactsContainer');
    if (!container) return;

    const authToken = localStorage.getItem('authToken');

    fetch('/api/admin/contacts', {
        headers: { 'Authorization': `Bearer ${authToken}` }
    })
        .then(res => res.json())
        .then(data => {
            if (data.success && data.contacts && data.contacts.length > 0) {
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
                                <td>${c.lineId}</td>
                                <td>${c.message?.substring(0, 50)}${c.message?.length > 50 ? '...' : ''}</td>
                                <td>${new Date(c.createdAt).toLocaleDateString('th-TH')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            } else {
                container.innerHTML = '<p class="text-center py-4">ยังไม่มีข้อความติดต่อ</p>';
            }
        })
        .catch(err => {
            console.error('Error loading contacts:', err);
            container.innerHTML = '<p class="text-center py-4 text-danger">เกิดข้อผิดพลาด</p>';
        });
}

function loadUsersSection() {
    const container = document.getElementById('usersContainer');
    if (!container) return;

    const authToken = localStorage.getItem('authToken');

    fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${authToken}` }
    })
        .then(res => res.json())
        .then(data => {
            if (data.success && data.users && data.users.length > 0) {
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
                                <td>${u.role || 'user'}</td>
                                <td>${new Date(u.createdAt).toLocaleDateString('th-TH')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            } else {
                container.innerHTML = '<p class="text-center py-4">ยังไม่มีผู้ใช้</p>';
            }
        })
        .catch(err => {
            console.error('Error loading users:', err);
            container.innerHTML = '<p class="text-center py-4 text-danger">เกิดข้อผิดพลาด</p>';
        });
}

// Initialize accessibility features for seniors
function initAccessibilityFeatures() {
    // Font size controls
    const fontSizeControls = document.createElement('div');
    fontSizeControls.className = 'font-size-controls';
    fontSizeControls.innerHTML = `
        <div class="position-fixed top-0 end-0 p-3 d-flex" style="z-index: 1050;">
            <button id="decreaseFontBtn" class="btn btn-light me-2" aria-label="ลดขนาดตัวอักษร" title="ลดขนาดตัวอักษร">
                <i class="fa fa-font"></i> -
            </button>
            <button id="increaseFontBtn" class="btn btn-light me-2" aria-label="เพิ่มขนาดตัวอักษร" title="เพิ่มขนาดตัวอักษร">
                <i class="fa fa-font"></i> +
            </button>
            <button id="textToSpeechBtn" class="btn btn-light" aria-label="อ่านข้อความ" title="อ่านข้อความ">
                <i class="fa fa-volume-up"></i>
            </button>
        </div>
    `;
    document.body.appendChild(fontSizeControls);

    // Initialize font size from localStorage if available
    const currentFontSize = localStorage.getItem('adminFontSize') || 18;
    document.documentElement.style.setProperty('--base-font-size', `${currentFontSize}px`);

    // Add event listeners for font size buttons
    document.getElementById('decreaseFontBtn').addEventListener('click', () => {
        changeFontSize(-1);
    });

    document.getElementById('increaseFontBtn').addEventListener('click', () => {
        changeFontSize(1);
    });

    // Text-to-speech toggle
    document.getElementById('textToSpeechBtn').addEventListener('click', toggleTextToSpeech);

    // Highlight focused elements
    document.addEventListener('focusin', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' ||
            e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON' ||
            e.target.tagName === 'A') {
            e.target.classList.add('highlight-focus');
        }
    });

    document.addEventListener('focusout', (e) => {
        if (e.target.classList.contains('highlight-focus')) {
            e.target.classList.remove('highlight-focus');
        }
    });

    // Add text to speech on hover for buttons
    const buttons = document.querySelectorAll('button, .btn');
    buttons.forEach(button => {
        button.addEventListener('mouseover', () => {
            if (isTextToSpeechEnabled() && button.innerText.trim() !== '') {
                speakText(button.innerText);
            }
        });
    });
}

// Change font size function
function changeFontSize(delta) {
    const html = document.documentElement;
    const currentSize = parseInt(getComputedStyle(html).getPropertyValue('--base-font-size')) || 18;
    const newSize = Math.max(14, Math.min(currentSize + delta, 24)); // Min 14px, Max 24px

    html.style.setProperty('--base-font-size', `${newSize}px`);
    localStorage.setItem('adminFontSize', newSize);

    // Update dependent styles
    const baseSizeRatio = newSize / 18; // 18 is our default
    document.documentElement.style.setProperty('--h1-size', `${32 * baseSizeRatio}px`);
    document.documentElement.style.setProperty('--h2-size', `${28 * baseSizeRatio}px`);
    document.documentElement.style.setProperty('--btn-font-size', `${18 * baseSizeRatio}px`);
}

// Toggle text-to-speech functionality
function toggleTextToSpeech() {
    const enabled = localStorage.getItem('textToSpeechEnabled') === 'true';
    localStorage.setItem('textToSpeechEnabled', !enabled);

    const ttsBtn = document.getElementById('textToSpeechBtn');
    if (!enabled) {
        ttsBtn.classList.add('btn-primary');
        ttsBtn.classList.remove('btn-light');
        speakText('การอ่านข้อความถูกเปิดใช้งาน');
    } else {
        ttsBtn.classList.remove('btn-primary');
        ttsBtn.classList.add('btn-light');
        speakText('การอ่านข้อความถูกปิดใช้งาน');
    }
}

// Check if text to speech is enabled
function isTextToSpeechEnabled() {
    return localStorage.getItem('textToSpeechEnabled') === 'true';
}

// Speak text using the Web Speech API
function speakText(text) {
    if (!('speechSynthesis' in window)) {
        console.log('Text-to-speech not supported');
        return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'th-TH'; // Thai language
    utterance.rate = 0.9; // Slightly slower rate for seniors
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
}

function showDashboard() {
    const loginSection = document.getElementById('loginSection');
    const dashboardContent = document.getElementById('dashboardSection');

    if (loginSection) loginSection.classList.add('d-none');
    if (dashboardContent) dashboardContent.classList.remove('d-none');

    console.log('Showing dashboard, initializing components...');
    // Initialize UI components and fetch data *after* login is confirmed
    initializeTabs();
    fetchOverviewData();
    fetchProducts();
    fetchOrders();
    fetchContacts();
    fetchUsers();
    loadSettings(); // Assuming loadSettings is relevant for admin
    loadPaymentSettings(); // Added from potential functions list
    setupEventHandlers();

    // Enhanced accessibility announcements
    if (isTextToSpeechEnabled()) {
        speakText('เข้าสู่ระบบสำเร็จ กำลังแสดงหน้าจัดการระบบ');
    }
}

function initializeTabs() {
    // Set active tab based on hash or default to overview
    const hash = window.location.hash || '#overview';

    // Find the nav link that corresponds to the hash and add active class
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('href') === hash) {
            link.classList.add('active', 'bg-white', 'text-dark');
        } else {
            link.classList.remove('active', 'bg-white', 'text-dark');
        }
    });

    // Handle tab clicks
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function (e) {
            document.querySelectorAll('.nav-link').forEach(l => {
                l.classList.remove('active', 'bg-white', 'text-dark');
            });
            this.classList.add('active', 'bg-white', 'text-dark');
        });
    });
}

function setupEventHandlers() {
    // Contact filter buttons
    document.querySelectorAll('#contacts .btn-group button').forEach(button => {
        button.addEventListener('click', function () {
            // Remove active class from all buttons
            document.querySelectorAll('#contacts .btn-group button').forEach(btn => {
                btn.classList.remove('active');
            });

            // Add active class to clicked button
            this.classList.add('active');

            // Get filter value
            const filter = this.getAttribute('data-filter');

            // Reload contacts with filter
            fetchContacts(filter);
        });
    });

    // Settings form submission
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', function (e) {
            e.preventDefault();
            saveSettings();
        });
    }

    // Contact detail modal save button
    const saveContactChangesBtn = document.getElementById('saveContactChanges');
    if (saveContactChangesBtn) {
        saveContactChangesBtn.addEventListener('click', function () {
            updateContactStatus();
        });
    }

    // Payment settings form
    const paymentSettingsForm = document.getElementById('paymentSettingsForm');
    if (paymentSettingsForm) {
        paymentSettingsForm.addEventListener('submit', function (e) {
            e.preventDefault();
            savePaymentSettings();
        });
    }

    // Generate QR code button
    const generateQRBtn = document.getElementById('generateQRBtn');
    if (generateQRBtn) {
        generateQRBtn.addEventListener('click', function () {
            generatePromptpayQR();
        });
    }

    // Set up webhook testing in payment settings
    const testWebhookBtn = document.createElement('button');
    testWebhookBtn.type = 'button';
    testWebhookBtn.className = 'btn btn-outline-info ms-2';
    testWebhookBtn.id = 'testWebhookBtn';
    testWebhookBtn.innerHTML = '<i class="fas fa-bolt"></i> ทดสอบ Webhook';

    // Add the button after save button
    const savePaymentBtn = document.getElementById('savePaymentSettings');
    if (savePaymentBtn) {
        savePaymentBtn.parentNode.appendChild(testWebhookBtn);

        // Event listener for testing webhook
        testWebhookBtn.addEventListener('click', function () {
            showWebhookTestModal();
        });
    }

    // Add Product button
    const addProductButton = document.querySelector('#products button.btn-primary'); // More specific selector
    if (addProductButton) {
        addProductButton.removeEventListener('click', handleAddProduct);
        addProductButton.addEventListener('click', handleAddProduct);
    }

    const saveProductButton = document.getElementById('saveProductBtn');
    if (saveProductButton) {
        saveProductButton.addEventListener('click', saveProduct);
    }
}

function fetchOverviewData() {
    console.log('Fetching overview data...');

    // Placeholder data (replace with actual API calls)
    document.getElementById('todaySales').textContent = '0 บาท';
    document.getElementById('newOrders').textContent = '0';
    document.getElementById('newContacts').textContent = '0';
    document.getElementById('totalUsers').textContent = '0';

    // Example API call
    // fetch('/api/admin/stats', {
    //     headers: {
    //         'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    //     }
    // })
    //     .then(response => response.json())
    //     .then(data => {
    //         if (data.success) {
    //             document.getElementById('todaySales').textContent = data.todaySales.toLocaleString() + ' บาท';
    //             document.getElementById('newOrders').textContent = data.newOrders;
    //             document.getElementById('newContacts').textContent = data.newContacts;
    //             document.getElementById('totalUsers').textContent = data.totalUsers;
    //         }
    //     })
    //     .catch(error => console.error('Error fetching overview data:', error));
}

function fetchProducts() {
    console.log('Fetching products for admin...');
    const productsTable = document.getElementById('productsTable');

    if (!productsTable) {
        console.error('Products table not found');
        return;
    }

    const tbody = productsTable.querySelector('tbody');
    tbody.innerHTML = '<tr><td colspan="8" class="text-center">กำลังโหลดข้อมูล...</td></tr>';

    fetch('/api/admin/products', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
    })
        .then(response => {
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    console.error('Authentication failed for fetching admin products.');
                    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">ข้อผิดพลาด: ไม่ได้รับอนุญาตให้เข้าถึงข้อมูลสินค้า</td></tr>';
                    throw new Error('Unauthorized');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success && data.products) {
                console.log('Admin products fetched:', data.products);
                renderProductsTable(data.products);
                // Setup listeners after rendering table rows
                addTableActionListeners();
            } else {
                console.error('Failed to fetch admin products:', data.message);
                tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">ไม่สามารถโหลดข้อมูลสินค้าได้: ${data.message || 'Unknown error'}</td></tr>`;
            }
        })
        .catch(error => {
            console.error('Error fetching admin products:', error);
            if (error.message !== 'Unauthorized') {
                tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">เกิดข้อผิดพลาด: ${error.message}</td></tr>`;
            }
        });
}

function renderProductsTable(products) {
    const tbody = document.querySelector('#productsTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center p-3">ไม่พบข้อมูลสินค้า</td></tr>';
        return;
    }

    products.forEach(product => {
        const row = document.createElement('tr');
        row.setAttribute('data-product-id', product._id);

        // Create cell with larger text and clearer styling
        const createCell = (content, className = '') => {
            const cell = document.createElement('td');
            cell.className = className;
            cell.innerHTML = content;
            cell.style.padding = '15px 10px';
            cell.style.verticalAlign = 'middle';
            return cell;
        };

        // Product ID
        row.appendChild(createCell(product._id.substring(0, 8) + '...'));

        // Product Image
        const imageUrl = product.images && product.images.length > 0
            ? product.images[0].url
            : 'assets/img/placeholder-product.jpg';
        row.appendChild(createCell(`
            <img src="${imageUrl}" alt="${product.name}" class="img-thumbnail" style="width: 80px; height: 80px; object-fit: cover;">
        `));

        // Product Name with larger font
        row.appendChild(createCell(`
            <span style="font-size: 18px; font-weight: 600;">${product.name}</span>
        `));

        // Price with clearer formatting
        row.appendChild(createCell(`
            <span style="font-size: 18px; font-weight: 600;">${product.price.toLocaleString()} บาท</span>
        `));

        // Stock with color indicators
        const stockClass = product.stock <= 0 ? 'text-danger' :
            product.stock < 5 ? 'text-warning' : 'text-success';
        row.appendChild(createCell(`
            <span class="${stockClass}" style="font-size: 18px; font-weight: 600;">${product.stock}</span>
        `));

        // Category
        const categoryName = product.category ? product.category.name : 'ไม่ระบุ';
        row.appendChild(createCell(`
            <span class="badge bg-secondary" style="font-size: 16px; padding: 8px 12px;">${categoryName}</span>
        `));

        // Status with larger toggle
        const statusChecked = product.isActive ? 'checked' : '';
        row.appendChild(createCell(`
            <div class="form-check form-switch">
                <input class="form-check-input product-status-toggle" type="checkbox" ${statusChecked}
                    style="width: 50px; height: 24px; cursor: pointer;" aria-label="สถานะสินค้า">
                <label class="form-check-label" style="font-size: 16px;">
                    ${product.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                </label>
            </div>
        `));

        // Actions with larger, more spaced buttons
        row.appendChild(createCell(`
            <div class="d-flex justify-content-around">
                <button class="btn btn-primary edit-product" title="แก้ไขสินค้า" aria-label="แก้ไขสินค้า" style="margin-right: 10px;">
                    <i class="fa fa-edit"></i>
                </button>
                <button class="btn btn-danger delete-product" title="ลบสินค้า" aria-label="ลบสินค้า">
                    <i class="fa fa-trash"></i>
                </button>
            </div>
        `, 'text-center'));

        tbody.appendChild(row);
    });

    // Add event listeners to new elements
    addTableActionListeners();
}

function addTableActionListeners() {
    const table = document.getElementById('productsTable');
    if (!table) return;

    // Delegate to table for better performance with many products
    table.addEventListener('click', handleTableClicks);
    table.addEventListener('change', handleTableChanges);
}

// Separate handler for click events
function handleTableClicks(event) {
    const target = event.target;
    // Edit button
    if (target.closest('.edit-product')) {
        const button = target.closest('.edit-product');
        const productId = button.getAttribute('data-product-id');
        handleEditProduct(productId); // Assuming handleEditProduct exists
    }
    // Delete button
    if (target.closest('.delete-product')) {
        const button = target.closest('.delete-product');
        const productId = button.getAttribute('data-product-id');
        handleDeleteProduct(productId); // Assuming handleDeleteProduct exists
    }
}

// Separate handler for change events (like toggle)
async function handleTableChanges(event) {
    const target = event.target;
    if (target.classList.contains('product-status-toggle')) {
        const productId = target.closest('tr').getAttribute('data-product-id');
        const newStatus = target.checked;
        console.log(`Toggling status for product ${productId} to ${newStatus}`);
        await updateProductStatus(productId, newStatus, target);
    }
}

async function updateProductStatus(productId, isActive, toggleElement) {
    try {
        const response = await fetch(`/api/admin/products/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ isActive })
        });

        if (!response.ok) {
            throw new Error('Failed to update product status');
        }

        // Update the label next to the toggle
        const label = toggleElement.nextElementSibling;
        if (label) {
            label.textContent = isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน';
        }

        // Show success message
        const successToast = document.createElement('div');
        successToast.className = 'alert alert-success position-fixed top-0 end-0 m-3';
        successToast.style.zIndex = "1050";
        successToast.textContent = `อัปเดตสถานะสินค้าเป็น "${isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}" เรียบร้อย`;
        document.body.appendChild(successToast);

        setTimeout(() => {
            successToast.remove();
        }, 3000);

    } catch (error) {
        console.error('Error updating product status:', error);

        // Show error message and revert the toggle
        toggleElement.checked = !isActive;

        const errorToast = document.createElement('div');
        errorToast.className = 'alert alert-danger position-fixed top-0 end-0 m-3';
        errorToast.style.zIndex = "1050";
        errorToast.textContent = 'ไม่สามารถอัปเดตสถานะสินค้า โปรดลองอีกครั้ง';
        document.body.appendChild(errorToast);

        setTimeout(() => {
            errorToast.remove();
        }, 3000);
    }
}

// Function to handle Edit Product button click
async function handleEditProduct(event) {
    const productId = event.currentTarget.getAttribute('data-id');
    console.log('Edit product clicked:', productId);
    const errorDiv = document.getElementById('productFormError');
    errorDiv.classList.add('d-none');
    document.getElementById('productForm').reset(); // Clear previous data

    // Fetch product data from API
    try {
        const response = await fetch(`/api/products/${productId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();

        if (result.success && result.product) {
            const product = result.product;
            // Populate the modal form
            document.getElementById('productId').value = product.id;
            document.getElementById('productName').value = product.name || '';
            document.getElementById('productCategory').value = product.category || '';
            document.getElementById('productPrice').value = product.price !== undefined ? product.price : '';
            document.getElementById('productStock').value = product.stock !== undefined ? product.stock : '';
            document.getElementById('productImageUrl').value = product.imageUrl || '';
            document.getElementById('productDescription').value = product.description || '';

            // Change modal title
            document.getElementById('productModalLabel').textContent = 'แก้ไขสินค้า';

            // Show modal
            const productModal = new bootstrap.Modal(document.getElementById('productModal'));
            productModal.show();
        } else {
            console.error('Failed to fetch product data:', result.message);
            alert('ไม่สามารถดึงข้อมูลสินค้าได้: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error fetching product for edit:', error);
        alert('เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า: ' + error.message);
    }
}

// Placeholder function for Delete Product button click
function handleDeleteProduct(event) {
    const productId = event.currentTarget.getAttribute('data-id');
    console.log('Delete product clicked:', productId);

    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบสินค้า ID: ${productId}?`)) {
        console.log('Confirmed delete for:', productId);

        // Implement logic to send DELETE request to /api/products/:id
        fetch(`/api/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        })
            .then(response => {
                if (!response.ok) {
                    // Try to parse error message from backend if available
                    return response.json().then(errData => {
                        throw new Error(errData.message || `HTTP error! status: ${response.status}`);
                    }).catch(() => {
                        // If parsing fails or no JSON body, throw generic error
                        throw new Error(`HTTP error! status: ${response.status}`);
                    });
                }
                return response.json(); // Assuming backend sends { success: true, ... }
            })
            .then(data => {
                if (data.success) {
                    console.log('Product deleted successfully');
                    // Optionally show a success message/toast
                    alert('ลบสินค้าเรียบร้อยแล้ว');
                    fetchProducts(); // Refresh table after successful deletion
                } else {
                    // Handle cases where response is ok but operation failed (e.g., { success: false, message: '...' })
                    console.error('Failed to delete product:', data.message);
                    alert('ลบสินค้าไม่สำเร็จ: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error deleting product:', error);
                alert(`เกิดข้อผิดพลาดในการลบสินค้า: ${error.message}`);
            });

    } else {
        console.log('Delete cancelled for:', productId);
    }
}

// Placeholder function for Add Product button click
function handleAddProduct() {
    console.log('Add new product clicked');
    // Reset form for adding
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = ''; // Clear ID field
    document.getElementById('productModalLabel').textContent = 'เพิ่มสินค้าใหม่';
    document.getElementById('productFormError').classList.add('d-none');

    // Show modal
    const productModal = new bootstrap.Modal(document.getElementById('productModal'));
    productModal.show();
}

// Function to handle saving product (Add or Edit)
async function saveProduct() {
    const productId = document.getElementById('productId').value;
    const name = document.getElementById('productName').value;
    const category = document.getElementById('productCategory').value;
    const price = document.getElementById('productPrice').value;
    const stock = document.getElementById('productStock').value;
    const imageUrl = document.getElementById('productImageUrl').value;
    const description = document.getElementById('productDescription').value;
    const errorDiv = document.getElementById('productFormError');

    errorDiv.classList.add('d-none'); // Hide previous errors

    // Basic Validation
    if (!name || !price || stock === '') {
        errorDiv.textContent = 'กรุณากรอกข้อมูลที่จำเป็น (*) ให้ครบถ้วน';
        errorDiv.classList.remove('d-none');
        return;
    }

    const productData = {
        name,
        category,
        price: parseFloat(price),
        stock: parseInt(stock),
        imageUrl,
        description
    };

    const url = productId
        ? `/api/products/${productId}` // URL for editing
        : '/api/products';            // URL for adding
    const method = productId ? 'PUT' : 'POST';

    console.log(`Sending ${method} request to ${url} with data:`, productData);

    const saveButton = document.getElementById('saveProductBtn');
    const originalButtonText = saveButton.textContent;
    saveButton.disabled = true;
    saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> กำลังบันทึก...';

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(productData)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            console.log('Product saved successfully:', result.product);
            bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
            fetchProducts(); // Refresh the table
            // Optionally show a success toast/message
        } else {
            console.error('Failed to save product:', result.message);
            errorDiv.textContent = `เกิดข้อผิดพลาด: ${result.message || 'ไม่สามารถบันทึกข้อมูลได้'}`;
            errorDiv.classList.remove('d-none');
        }
    } catch (error) {
        console.error('Error saving product:', error);
        errorDiv.textContent = `เกิดข้อผิดพลาดในการเชื่อมต่อ: ${error.message}`;
        errorDiv.classList.remove('d-none');
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = originalButtonText;
    }
}

function fetchOrders() {
    console.log('Fetching orders...');
    const ordersTable = document.getElementById('ordersTable');

    if (!ordersTable) return;

    const tbody = ordersTable.querySelector('tbody');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">กำลังโหลดข้อมูล...</td></tr>';

    // Placeholder for actual API call
}

function fetchContacts(filter = 'all') {
    console.log('Fetching contacts with filter:', filter);
    const contactsTable = document.getElementById('contactsTable');

    if (!contactsTable) return;

    const tbody = contactsTable.querySelector('tbody');
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">กำลังโหลดข้อมูล...</td></tr>';

    // Build query parameters based on filter
    let queryParams = 'page=1&limit=10';
    if (filter === 'unread') {
        queryParams += '&isRead=false';
    } else if (filter !== 'all') {
        queryParams += `&status=${filter}`;
    }

    // Get authentication token from localStorage
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">กรุณาเข้าสู่ระบบ</td></tr>';
        return;
    }

    // Fetch contacts from API
    fetch(`/api/contact?${queryParams}`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Populate the contacts table
            tbody.innerHTML = '';
            if (data.success && data.contacts && data.contacts.length > 0) {
                data.contacts.forEach(contact => {
                    const date = new Date(contact.createdAt).toLocaleDateString('th-TH');
                    const time = new Date(contact.createdAt).toLocaleTimeString('th-TH');
                    const shortMessage = contact.message.length > 30
                        ? contact.message.substring(0, 30) + '...'
                        : contact.message;

                    // Determine status badge class
                    let statusBadgeClass = 'bg-secondary';
                    if (contact.status === 'pending') statusBadgeClass = 'bg-warning text-dark';
                    if (contact.status === 'processed') statusBadgeClass = 'bg-info';
                    if (contact.status === 'completed') statusBadgeClass = 'bg-success';

                    // Add unread indicator
                    const unreadIndicator = !contact.isRead
                        ? '<span class="badge bg-danger rounded-pill ms-2">ใหม่</span>'
                        : '';

                    tbody.innerHTML += `
                    <tr>
                        <td>${contact._id.substring(0, 8)}...</td>
                        <td>${date} ${time}</td>
                        <td>${contact.name}</td>
                        <td>${contact.lineId}</td>
                        <td>${shortMessage}</td>
                        <td><span class="badge ${statusBadgeClass}">${getStatusText(contact.status)}</span>${unreadIndicator}</td>
                        <td>
                            <button class="btn btn-sm btn-primary view-contact" data-id="${contact._id}">
                                <i class="fas fa-eye"></i>
                            </button>
                        </td>
                    </tr>
                `;
                });

                // Add event listeners to view buttons
                document.querySelectorAll('.view-contact').forEach(button => {
                    button.addEventListener('click', function () {
                        const contactId = this.getAttribute('data-id');
                        viewContactDetails(contactId);
                    });
                });

                // Update pagination
                updatePagination(data.totalPages, data.currentPage);
            } else {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center">ไม่พบข้อความติดต่อ</td></tr>';
            }
        })
        .catch(error => {
            console.error('Error fetching contacts:', error);
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>';
        });
}

function updatePagination(totalPages, currentPage) {
    const paginationContainer = document.getElementById('contactsPagination');
    if (!paginationContainer) return;

    let paginationHTML = '<nav aria-label="Page navigation"><ul class="pagination">';

    // Previous button
    paginationHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage - 1}" aria-label="Previous">
                <span aria-hidden="true">&laquo;</span>
            </a>
        </li>
    `;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i}">${i}</a>
            </li>
        `;
    }

    // Next button
    paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage + 1}" aria-label="Next">
                <span aria-hidden="true">&raquo;</span>
            </a>
        </li>
    `;

    paginationHTML += '</ul></nav>';
    paginationContainer.innerHTML = paginationHTML;

    // Add event listeners to pagination links
    document.querySelectorAll('#contactsPagination .page-link').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const page = parseInt(this.getAttribute('data-page'));
            if (page < 1 || page > totalPages) return;

            // Get current filter
            const activeFilterBtn = document.querySelector('#contacts .btn-group button.active');
            const filter = activeFilterBtn ? activeFilterBtn.getAttribute('data-filter') : 'all';

            // Fetch contacts for the selected page
            fetchContactsPage(page, filter);
        });
    });
}

function fetchContactsPage(page, filter = 'all') {
    // Build query parameters
    let queryParams = `page=${page}&limit=10`;
    if (filter === 'unread') {
        queryParams += '&isRead=false';
    } else if (filter !== 'all') {
        queryParams += `&status=${filter}`;
    }

    // Get authentication token
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;

    // Update table to loading state
    const tbody = document.querySelector('#contactsTable tbody');
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">กำลังโหลดข้อมูล...</td></tr>';

    // Fetch contacts for the selected page
    fetch(`/api/contact?${queryParams}`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Redraw the table and pagination
                tbody.innerHTML = '';
                data.contacts.forEach(contact => {
                    // Populate table (same as in fetchContacts)
                    // ...
                });
                updatePagination(data.totalPages, data.currentPage);
            }
        })
        .catch(error => console.error('Error fetching contacts page:', error));
}

function viewContactDetails(contactId) {
    console.log('Viewing contact details for ID:', contactId);

    // Get authentication token
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;

    // Get contact details modal and content container
    const modal = new bootstrap.Modal(document.getElementById('contactDetailModal'));
    const contentContainer = document.getElementById('contactDetailContent');
    const adminNotesInput = document.getElementById('adminNotes');
    const statusSelect = document.getElementById('contactStatus');
    const saveButton = document.getElementById('saveContactChanges');

    // Clear previous content and show loading
    contentContainer.innerHTML = '<p class="text-center">กำลังโหลดข้อมูล...</p>';
    adminNotesInput.value = '';

    // Store contact ID in save button
    saveButton.setAttribute('data-id', contactId);

    // Show modal
    modal.show();

    // Fetch contact details
    fetch(`/api/contact/${contactId}`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success && data.contact) {
                const contact = data.contact;

                // Format date and time
                const date = new Date(contact.createdAt).toLocaleDateString('th-TH');
                const time = new Date(contact.createdAt).toLocaleTimeString('th-TH');

                // Populate contact details
                contentContainer.innerHTML = `
                <div class="card mb-3">
                    <div class="card-body">
                        <h5 class="card-title">ข้อมูลผู้ติดต่อ</h5>
                        <p class="card-text"><strong>ชื่อ:</strong> ${contact.name}</p>
                        <p class="card-text"><strong>Line ID:</strong> ${contact.lineId}</p>
                        <p class="card-text"><strong>วันที่ติดต่อ:</strong> ${date} ${time}</p>
                        <h6 class="mt-3">ข้อความ:</h6>
                        <p class="card-text border p-2 rounded bg-light">${contact.message}</p>
                    </div>
                </div>
            `;

                // Populate form fields
                adminNotesInput.value = contact.adminNotes || '';
                statusSelect.value = contact.status;

                // Mark as read if it was unread
                if (!contact.isRead) {
                    markContactAsRead(contactId);
                }
            } else {
                contentContainer.innerHTML = '<p class="text-center text-danger">ไม่พบข้อมูลที่ต้องการ</p>';
            }
        })
        .catch(error => {
            console.error('Error fetching contact details:', error);
            contentContainer.innerHTML = '<p class="text-center text-danger">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>';
        });
}

function markContactAsRead(contactId) {
    // Get authentication token
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;

    // Make API call to mark contact as read
    fetch(`/api/contact/${contactId}/read`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Contact marked as read');
                // Update unread count in overview
                fetchOverviewData();
            }
        })
        .catch(error => console.error('Error marking contact as read:', error));
}

function updateContactStatus() {
    // Get contact ID from save button
    const saveButton = document.getElementById('saveContactChanges');
    const contactId = saveButton.getAttribute('data-id');

    // Get form values
    const adminNotes = document.getElementById('adminNotes').value;
    const status = document.getElementById('contactStatus').value;

    // Get authentication token
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;

    // Disable save button and show loading
    saveButton.disabled = true;
    saveButton.innerHTML = '<span class="spinner-border spinner-border-sm"></span> กำลังบันทึก...';

    // Make API call to update contact
    fetch(`/api/contact/${contactId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            adminNotes,
            status
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Hide modal
                bootstrap.Modal.getInstance(document.getElementById('contactDetailModal')).hide();

                // Show success message (toast or alert)
                alert('บันทึกการเปลี่ยนแปลงเรียบร้อยแล้ว');

                // Reload contacts
                const activeFilterBtn = document.querySelector('#contacts .btn-group button.active');
                const filter = activeFilterBtn ? activeFilterBtn.getAttribute('data-filter') : 'all';
                fetchContacts(filter);
            } else {
                alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + (data.message || 'โปรดลองอีกครั้ง'));
            }
        })
        .catch(error => {
            console.error('Error updating contact:', error);
            alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + error.message);
        })
        .finally(() => {
            // Re-enable save button
            saveButton.disabled = false;
            saveButton.innerHTML = 'บันทึกการเปลี่ยนแปลง';
        });
}

function fetchUsers() {
    console.log('Fetching users...');
    // Placeholder for actual API call
}

function loadSettings() {
    console.log('Loading settings...');
    // Placeholder for loading settings from localStorage or API

    // Example of loading from localStorage
    const siteName = localStorage.getItem('siteName');
    const contactEmail = localStorage.getItem('contactEmail');
    const lineNotifyToken = localStorage.getItem('lineNotifyToken');
    const webhookUrl = localStorage.getItem('webhookUrl');
    const matrixWebhookUrl = localStorage.getItem('matrixWebhookUrl');

    if (siteName) {
        document.getElementById('siteName').value = siteName;
    }

    if (contactEmail) {
        document.getElementById('contactEmail').value = contactEmail;
    }

    if (lineNotifyToken) {
        document.getElementById('lineNotifyToken').value = lineNotifyToken;
    }

    if (webhookUrl) {
        document.getElementById('webhookUrl').value = webhookUrl;
    }

    if (matrixWebhookUrl) {
        document.getElementById('matrixWebhookUrl').value = matrixWebhookUrl;
    }

    // Also load payment settings
    loadPaymentSettings();
}

function saveSettings() {
    console.log('Saving settings...');

    // Get form values
    const siteName = document.getElementById('siteName').value;
    const contactEmail = document.getElementById('contactEmail').value;
    const lineNotifyToken = document.getElementById('lineNotifyToken').value;
    const webhookUrl = document.getElementById('webhookUrl').value;
    const matrixWebhookUrl = document.getElementById('matrixWebhookUrl').value;

    // Save to localStorage for demo purposes
    localStorage.setItem('siteName', siteName);
    localStorage.setItem('contactEmail', contactEmail);
    localStorage.setItem('lineNotifyToken', lineNotifyToken);
    localStorage.setItem('webhookUrl', webhookUrl);
    localStorage.setItem('matrixWebhookUrl', matrixWebhookUrl);

    // In a real app, you would save to API
    // fetch('/api/admin/settings', {
    //     method: 'POST',
    //     headers: {
    //         'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
    //         'Content-Type': 'application/json'
    //     },
    //     body: JSON.stringify({
    //         siteName,
    //         contactEmail,
    //         lineNotifyToken,
    //         webhookUrl,
    //         matrixWebhookUrl
    //     })
    // })
    // .then(response => response.json())
    // .then(data => {
    //     if (data.success) {
    //         alert('บันทึกการตั้งค่าเรียบร้อยแล้ว');
    //     } else {
    //         alert('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า');
    //     }
    // })
    // .catch(error => {
    //     console.error('Error saving settings:', error);
    //     alert('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า');
    // });

    alert('บันทึกการตั้งค่าเรียบร้อยแล้ว');
}

// Helper function to convert status code to display text
function getStatusText(status) {
    switch (status) {
        case 'pending': return 'รอดำเนินการ';
        case 'processed': return 'กำลังดำเนินการ';
        case 'completed': return 'เสร็จสิ้น';
        default: return status;
    }
}

// Load payment settings
function loadPaymentSettings() {
    // Get authentication token
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;

    // Show loading state
    document.getElementById('savePaymentSettings').innerHTML = '<span class="spinner-border spinner-border-sm"></span> กำลังโหลด...';

    // Fetch payment settings from API
    fetch('/api/payment/settings', {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data) {
                const settings = data.data;

                // PromptPay settings
                if (settings.promptpay) {
                    document.getElementById('promptpayEnabled').checked = settings.promptpay.enabled;
                    document.getElementById('promptpayNumber').value = settings.promptpay.accountNumber || '';
                    document.getElementById('promptpayName').value = settings.promptpay.accountName || '';
                }

                // Bank transfer settings
                if (settings.bankTransfer) {
                    document.getElementById('bankTransferEnabled').checked = settings.bankTransfer.enabled;
                    document.getElementById('bankAccountNumber').value = settings.bankTransfer.accountNumber || '';
                    document.getElementById('bankAccountName').value = settings.bankTransfer.accountName || '';

                    // Set bank name if available
                    const bankNameSelect = document.getElementById('bankName');
                    const bankName = settings.bankTransfer.bankName;
                    if (bankName && bankNameSelect) {
                        for (let i = 0; i < bankNameSelect.options.length; i++) {
                            if (bankNameSelect.options[i].text === bankName ||
                                bankNameSelect.options[i].value === bankName.toLowerCase()) {
                                bankNameSelect.selectedIndex = i;
                                break;
                            }
                        }
                    }
                }

                // Cash on delivery settings
                if (settings.cashOnDelivery) {
                    document.getElementById('codEnabled').checked = settings.cashOnDelivery.enabled;
                    document.getElementById('codFee').value = settings.cashOnDelivery.additionalFee || 0;
                }

                // Credit card settings
                if (settings.creditCard) {
                    document.getElementById('creditCardEnabled').checked = settings.creditCard.enabled;
                    document.getElementById('merchantId').value = settings.creditCard.merchantId || '';
                    // API Key is not loaded for security reasons
                }
            }

            // Reset button state
            document.getElementById('savePaymentSettings').textContent = 'บันทึกการตั้งค่า';
        })
        .catch(error => {
            console.error('Error loading payment settings:', error);
            document.getElementById('savePaymentSettings').textContent = 'บันทึกการตั้งค่า';

            // Use mock data for demonstration
            useMockPaymentSettings();
        });
}

// Save payment settings
function savePaymentSettings() {
    // Get authentication token
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;

    // Get form values
    const promptpay = {
        enabled: document.getElementById('promptpayEnabled').checked,
        accountNumber: document.getElementById('promptpayNumber').value,
        accountName: document.getElementById('promptpayName').value
    };

    const bankTransfer = {
        enabled: document.getElementById('bankTransferEnabled').checked,
        bankName: document.getElementById('bankName').options[document.getElementById('bankName').selectedIndex].text,
        accountNumber: document.getElementById('bankAccountNumber').value,
        accountName: document.getElementById('bankAccountName').value
    };

    const cashOnDelivery = {
        enabled: document.getElementById('codEnabled').checked,
        additionalFee: parseInt(document.getElementById('codFee').value) || 0
    };

    const creditCard = {
        enabled: document.getElementById('creditCardEnabled').checked,
        merchantId: document.getElementById('merchantId').value,
        apiKey: document.getElementById('apiKey').value // This would be handled securely in a real app
    };

    // Show loading state
    const saveBtn = document.getElementById('savePaymentSettings');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> กำลังบันทึก...';

    // Make API call to save settings
    fetch('/api/payment/settings', {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            promptpay,
            bankTransfer,
            cashOnDelivery,
            creditCard
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Show success message
                alert('บันทึกการตั้งค่าเรียบร้อยแล้ว');
            } else {
                // Show error message
                alert('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า: ' + (data.message || 'กรุณาลองใหม่อีกครั้ง'));
            }

            // Reset button state
            saveBtn.disabled = false;
            saveBtn.textContent = 'บันทึกการตั้งค่า';
        })
        .catch(error => {
            console.error('Error saving payment settings:', error);
            alert('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า กรุณาลองใหม่อีกครั้ง');

            // Reset button state
            saveBtn.disabled = false;
            saveBtn.textContent = 'บันทึกการตั้งค่า';

            // For demo purposes, simulate success
            setTimeout(() => {
                alert('บันทึกการตั้งค่าเรียบร้อยแล้ว (จำลอง)');
            }, 1000);
        });
}

// Generate PromptPay QR code preview
function generatePromptpayQR() {
    const promptpayNumber = document.getElementById('promptpayNumber').value;
    const promptpayName = document.getElementById('promptpayName').value;

    if (!promptpayNumber) {
        alert('กรุณากรอกเบอร์โทรศัพท์หรือหมายเลขพร้อมเพย์');
        return;
    }

    // Test amount for QR code
    const amount = 100;

    // Show QR modal
    const qrModal = new bootstrap.Modal(document.getElementById('promptpayQRModal'));

    // Update modal content
    document.getElementById('qrAmount').textContent = amount.toFixed(2);
    document.getElementById('qrAccountNumber').textContent = promptpayNumber;
    document.getElementById('qrAccountName').textContent = promptpayName || 'ธัญรัตน์ ช็อป';

    // Show loading state
    document.getElementById('qrCodeContainer').innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';

    // Show modal
    qrModal.show();

    // Fetch QR code from API
    fetch(`/api/payment/promptpay/qr?amount=${amount}`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data.qrCode) {
                // Display QR code
                document.getElementById('qrCodeContainer').innerHTML = `<img src="${data.data.qrCode}" alt="PromptPay QR Code" class="img-fluid">`;
            } else {
                // Show error
                document.getElementById('qrCodeContainer').innerHTML = '<div class="alert alert-danger">เกิดข้อผิดพลาดในการสร้าง QR Code</div>';
            }
        })
        .catch(error => {
            console.error('Error generating QR code:', error);
            // Show placeholder for demo
            document.getElementById('qrCodeContainer').innerHTML = '<img src="assets/img/qr-code-placeholder.png" alt="PromptPay QR Code" class="img-fluid">';
        });
}

// Use mock payment settings for demonstration
function useMockPaymentSettings() {
    // PromptPay settings
    document.getElementById('promptpayEnabled').checked = true;
    document.getElementById('promptpayNumber').value = '0812345678';
    document.getElementById('promptpayName').value = 'ธัญรัตน์ ช็อป';

    // Bank transfer settings
    document.getElementById('bankTransferEnabled').checked = true;
    document.getElementById('bankName').value = 'kasikorn';
    document.getElementById('bankAccountNumber').value = '123-4-56789-0';
    document.getElementById('bankAccountName').value = 'บริษัท ธัญรัตน์ จำกัด';

    // Cash on delivery settings
    document.getElementById('codEnabled').checked = true;
    document.getElementById('codFee').value = '30';

    // Credit card settings
    document.getElementById('creditCardEnabled').checked = false;
}

// Add webhook testing modal to the page when the document is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Add webhook test modal to the page
    const webhookTestModal = document.createElement('div');
    webhookTestModal.className = 'modal fade';
    webhookTestModal.id = 'webhookTestModal';
    webhookTestModal.tabIndex = '-1';
    webhookTestModal.setAttribute('aria-hidden', 'true');
    webhookTestModal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">ทดสอบ Webhook การชำระเงิน</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="webhookOrderId" class="form-label">เลขที่คำสั่งซื้อ</label>
                                <input type="text" class="form-control" id="webhookOrderId" placeholder="เลขที่คำสั่งซื้อที่ต้องการทดสอบ">
                            </div>
                            <div class="mb-3">
                                <label for="webhookPaymentMethod" class="form-label">วิธีการชำระเงิน</label>
                                <select class="form-select" id="webhookPaymentMethod">
                                    <option value="promptpay">PromptPay</option>
                                    <option value="bank_transfer">โอนผ่านธนาคาร</option>
                                    <option value="credit_card">บัตรเครดิต</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="webhookAmount" class="form-label">จำนวนเงิน (บาท)</label>
                                <input type="number" class="form-control" id="webhookAmount" placeholder="จำนวนเงิน">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="webhookTransactionId" class="form-label">เลขที่รายการ (Transaction ID)</label>
                                <input type="text" class="form-control" id="webhookTransactionId" placeholder="เลขที่รายการชำระเงิน">
                            </div>
                            <div class="mb-3">
                                <label for="webhookPayerName" class="form-label">ชื่อผู้ชำระเงิน</label>
                                <input type="text" class="form-control" id="webhookPayerName" placeholder="ชื่อผู้ชำระเงิน">
                            </div>
                            <div class="mb-3">
                                <label for="webhookPayerEmail" class="form-label">อีเมลผู้ชำระเงิน (ถ้ามี)</label>
                                <input type="email" class="form-control" id="webhookPayerEmail" placeholder="อีเมลผู้ชำระเงิน (ถ้ามี)">
                            </div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="useMatrixWebhook">
                            <label class="form-check-label" for="useMatrixWebhook">
                                ส่งการแจ้งเตือนไปยัง Matrix/Mattermost ด้วย
                            </label>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label for="webhookPreview" class="form-label">ข้อมูล Webhook ที่จะส่ง</label>
                        <textarea class="form-control" id="webhookPreview" rows="8" readonly></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">ปิด</button>
                    <button type="button" class="btn btn-outline-primary" id="generateWebhookBtn">สร้างข้อมูล</button>
                    <button type="button" class="btn btn-primary" id="sendWebhookBtn">ส่ง Webhook</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(webhookTestModal);

    // Event listener for generate webhook button
    document.getElementById('generateWebhookBtn').addEventListener('click', function () {
        generateWebhookData();
    });

    // Event listener for send webhook button
    document.getElementById('sendWebhookBtn').addEventListener('click', function () {
        sendWebhookTest();
    });

    // Update webhook preview when payment method changes
    document.getElementById('webhookPaymentMethod').addEventListener('change', function () {
        generateWebhookData();
    });
});

// Function to show webhook test modal
function showWebhookTestModal() {
    // Generate random data for testing
    document.getElementById('webhookOrderId').value = 'ORDER' + Math.floor(Math.random() * 10000000);
    document.getElementById('webhookAmount').value = Math.floor(Math.random() * 10000) + 100;
    document.getElementById('webhookTransactionId').value = 'TXN' + Math.floor(Math.random() * 1000000000);
    document.getElementById('webhookPayerName').value = 'ผู้ทดสอบ ระบบ';
    document.getElementById('webhookPayerEmail').value = 'test@example.com';

    // Generate initial webhook data
    generateWebhookData();

    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('webhookTestModal'));
    modal.show();
}

// Function to generate webhook test data
function generateWebhookData() {
    const orderId = document.getElementById('webhookOrderId').value || 'ORDER12345';
    const paymentMethod = document.getElementById('webhookPaymentMethod').value;
    const amount = document.getElementById('webhookAmount').value || '1000';
    const transactionId = document.getElementById('webhookTransactionId').value || 'TXN123456789';
    const payerName = document.getElementById('webhookPayerName').value || 'ผู้ทดสอบ ระบบ';
    const payerEmail = document.getElementById('webhookPayerEmail').value || 'test@example.com';

    // Create webhook data based on payment method
    let webhookData = {
        event: 'payment.success',
        timestamp: new Date().toISOString(),
        data: {
            orderId: orderId,
            transactionId: transactionId,
            amount: parseFloat(amount),
            currency: 'THB',
            paymentMethod: paymentMethod,
            status: 'completed',
            payer: {
                name: payerName,
                email: payerEmail
            }
        }
    };

    // Add specific details based on payment method
    if (paymentMethod === 'promptpay') {
        webhookData.data.promptpay = {
            account: '0812345678',
            reference: 'REF' + Math.floor(Math.random() * 1000000)
        };
    } else if (paymentMethod === 'bank_transfer') {
        webhookData.data.bankTransfer = {
            bankName: 'Kasikorn Bank',
            accountNumber: 'xxx-x-xxxxx-x',
            reference: 'REF' + Math.floor(Math.random() * 1000000)
        };
    } else if (paymentMethod === 'credit_card') {
        webhookData.data.creditCard = {
            last4: '4242',
            brand: 'Visa',
            expMonth: 12,
            expYear: 2025
        };
    }

    // Update preview
    document.getElementById('webhookPreview').value = JSON.stringify(webhookData, null, 2);

    return webhookData;
}

// Function to send webhook test
async function sendWebhookTest() {
    // Get webhook data
    const webhookData = generateWebhookData();

    // Get the webhook URL from settings
    const webhookUrl = document.getElementById('webhookUrl')?.value || '/api/payment/verify';

    // Check if should send to Matrix/Mattermost
    const useMatrixWebhook = document.getElementById('useMatrixWebhook').checked;

    // Show loading
    const sendBtn = document.getElementById('sendWebhookBtn');
    const originalText = sendBtn.textContent;
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> กำลังส่ง...';

    try {
        // Send to payment webhook endpoint
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(webhookData)
        });

        const result = await response.json();

        // If selected, also send to Matrix/Mattermost
        if (useMatrixWebhook) {
            // Format message for Matrix/Mattermost
            const matrixMessage = {
                text: `🔔 **การชำระเงินใหม่!**\n` +
                    `- คำสั่งซื้อ: ${webhookData.data.orderId}\n` +
                    `- จำนวนเงิน: ${webhookData.data.amount.toFixed(2)} บาท\n` +
                    `- วิธีชำระเงิน: ${getPaymentMethodText(webhookData.data.paymentMethod)}\n` +
                    `- ผู้ชำระเงิน: ${webhookData.data.payer.name}\n` +
                    `- เวลา: ${new Date().toLocaleString('th-TH')}`
            };

            // Get Matrix webhook URL from localStorage or use mockup URL
            const matrixWebhookUrl = localStorage.getItem('matrixWebhookUrl') || 'https://matrix.example.com/api/v1/webhook/incoming';

            // Send to Matrix/Mattermost
            await fetch(matrixWebhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(matrixMessage)
            }).catch(err => {
                console.warn('Failed to send to Matrix/Mattermost (expected in demo)', err);
                // Don't throw error, as this is optional and expected to fail in demo
            });
        }

        // Show success message
        alert('ส่ง webhook สำเร็จ! ผลลัพธ์: ' + (result.message || JSON.stringify(result)));

        // Reset button
        sendBtn.disabled = false;
        sendBtn.textContent = originalText;

        // Close modal
        bootstrap.Modal.getInstance(document.getElementById('webhookTestModal')).hide();

        // Refresh order data
        fetchOrders();
    } catch (error) {
        console.error('Error sending webhook:', error);
        alert('เกิดข้อผิดพลาดในการส่ง webhook: ' + error.message);

        // Reset button
        sendBtn.disabled = false;
        sendBtn.textContent = originalText;
    }
}

// Helper to get payment method text
function getPaymentMethodText(method) {
    switch (method) {
        case 'promptpay': return 'พร้อมเพย์';
        case 'bank_transfer': return 'โอนผ่านธนาคาร';
        case 'credit_card': return 'บัตรเครดิต/เดบิต';
        case 'cash_on_delivery': return 'เก็บเงินปลายทาง';
        default: return method;
    }
}

// Show success message with optional text-to-speech
function showSuccess(message, element = null) {
    const successAlert = document.createElement('div');
    successAlert.className = 'alert alert-success alert-dismissible fade show';
    successAlert.setAttribute('role', 'alert');
    successAlert.innerHTML = `
        <strong>สำเร็จ!</strong> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    if (element) {
        element.prepend(successAlert);
    } else {
        // Find an appropriate container
        const container = document.querySelector('.container') || document.body;
        container.prepend(successAlert);
    }

    // Speak success message if enabled
    if (isTextToSpeechEnabled()) {
        speakText(message);
    }

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        successAlert.classList.remove('show');
        setTimeout(() => successAlert.remove(), 150);
    }, 5000);
}

// Show error message with optional text-to-speech
function showError(message, element = null) {
    const errorAlert = document.createElement('div');
    errorAlert.className = 'alert alert-danger alert-dismissible fade show';
    errorAlert.setAttribute('role', 'alert');
    errorAlert.innerHTML = `
        <strong>ข้อผิดพลาด!</strong> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    if (element) {
        element.prepend(errorAlert);
    } else {
        // Find an appropriate container
        const container = document.querySelector('.container') || document.body;
        container.prepend(errorAlert);
    }

    // Speak error message if enabled
    if (isTextToSpeechEnabled()) {
        speakText(message);
    }

    // Auto-dismiss after 8 seconds
    setTimeout(() => {
        errorAlert.classList.remove('show');
        setTimeout(() => errorAlert.remove(), 150);
    }, 8000);
}