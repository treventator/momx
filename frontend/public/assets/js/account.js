document.addEventListener('DOMContentLoaded', function () {
    // API URL
    const API_URL = '/api';

    // DOM Elements
    const logoutButton = document.getElementById('logoutButton');
    const logoutTabButton = document.getElementById('v-pills-logout-tab');
    const orderHistoryContainer = document.getElementById('orderHistory');
    const profileForm = document.getElementById('editProfileForm');
    const profileAlert = document.getElementById('editProfileAlert');

    // Navigation elements
    const navLogin = document.getElementById('navLogin');
    const navRegister = document.getElementById('navRegister');
    const navAccount = document.getElementById('navAccount');
    const navAdmin = document.getElementById('navAdmin');

    // User profile elements
    const userNameDisplay = document.getElementById('userNameDisplay');
    const userEmailDisplay = document.getElementById('userEmailDisplay');
    const userPhoneDisplay = document.getElementById('userPhoneDisplay');
    const userJoinDateDisplay = document.getElementById('userJoinDateDisplay');

    // Edit profile form elements
    const editFirstName = document.getElementById('editFirstName');
    const editLastName = document.getElementById('editLastName');
    const editEmail = document.getElementById('editEmail');
    const editPhone = document.getElementById('editPhone');
    const editCurrentPassword = document.getElementById('editCurrentPassword');
    const editNewPassword = document.getElementById('editNewPassword');
    const editConfirmPassword = document.getElementById('editConfirmPassword');

    // Check if user is logged in
    checkAuthStatus();

    // Load user profile data
    loadUserProfile();

    // Load order history
    loadOrderHistory();

    // Event Listeners
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }

    if (logoutTabButton) {
        logoutTabButton.addEventListener('click', handleLogout);
    }

    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }

    // Functions
    async function checkAuthStatus() {
        const token = localStorage.getItem('token');

        if (!token) {
            // Redirect to login if not logged in
            window.location.href = 'login.html';
            return;
        }

        try {
            const response = await fetch(`${API_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Authentication failed');
            }

            const data = await response.json();

            if (data.success) {
                // Update navigation
                navLogin.classList.add('d-none');
                navRegister.classList.add('d-none');
                navAccount.classList.remove('d-none');

                // Show admin link if admin
                if (data.user.role === 'admin') {
                    navAdmin.classList.remove('d-none');
                }
            } else {
                // If auth fails, clear token and redirect
                localStorage.removeItem('token');
                window.location.href = 'login.html';
            }
        } catch (error) {
            console.error('Auth check error:', error);

            // For demo purposes
            navLogin.classList.add('d-none');
            navRegister.classList.add('d-none');
            navAccount.classList.remove('d-none');
        }
    }

    async function loadUserProfile() {
        const token = localStorage.getItem('token');

        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load profile');
            }

            const data = await response.json();

            if (data.success && data.user) {
                // Display profile data
                displayUserProfile(data.user);

                // Fill edit form
                if (editFirstName) editFirstName.value = data.user.firstName || '';
                if (editLastName) editLastName.value = data.user.lastName || '';
                if (editEmail) editEmail.value = data.user.email || '';
                if (editPhone) editPhone.value = data.user.phoneNumber || '';
            }
        } catch (error) {
            console.error('Load profile error:', error);

            // For demo purposes
            const mockUser = {
                firstName: 'ธนา',
                lastName: 'รักษ์ไทย',
                email: 'thana@example.com',
                phoneNumber: '081-234-5678',
                createdAt: '2024-01-15T10:30:00Z'
            };

            displayUserProfile(mockUser);

            // Fill edit form
            if (editFirstName) editFirstName.value = mockUser.firstName;
            if (editLastName) editLastName.value = mockUser.lastName;
            if (editEmail) editEmail.value = mockUser.email;
            if (editPhone) editPhone.value = mockUser.phoneNumber;
        }
    }

    function displayUserProfile(user) {
        if (userNameDisplay) {
            // Support LINE profile displayName and regular firstName/lastName
            const displayName = user.lineProfile?.displayName ||
                user.displayName ||
                (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` :
                    user.firstName || 'ไม่ระบุชื่อ');
            userNameDisplay.textContent = displayName;
        }

        // Update profile picture if LINE user
        const profilePicDisplay = document.getElementById('profilePicDisplay');
        if (profilePicDisplay && (user.lineProfile?.pictureUrl || user.pictureUrl)) {
            profilePicDisplay.src = user.lineProfile?.pictureUrl || user.pictureUrl;
        }

        if (userEmailDisplay) {
            userEmailDisplay.textContent = user.email || 'ไม่ระบุ';
        }

        if (userPhoneDisplay) {
            userPhoneDisplay.textContent = user.phoneNumber || 'ไม่ระบุ';
        }

        if (userJoinDateDisplay && user.createdAt) {
            const joinDate = new Date(user.createdAt);
            userJoinDateDisplay.textContent = new Intl.DateTimeFormat('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }).format(joinDate);
        }
    }

    async function loadOrderHistory() {
        const token = localStorage.getItem('token');

        if (!token || !orderHistoryContainer) return;

        // Show loading
        orderHistoryContainer.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">กำลังโหลด...</p></div>';

        try {
            const response = await fetch(`${API_URL}/shop/orders`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load orders');
            }

            const data = await response.json();

            if (data.status === 'success' && data.data) {
                displayOrderHistory(data.data);
            } else {
                orderHistoryContainer.innerHTML = '<p class="text-center text-muted">ไม่พบรายการสั่งซื้อ</p>';
            }
        } catch (error) {
            console.error('Load orders error:', error);

            // For demo purposes
            const mockOrders = [
                {
                    _id: '614c5ab29b15b33e40b11e21',
                    orderNumber: 'TY2408100123',
                    createdAt: '2024-08-15T03:30:45.000Z',
                    status: 'pending',
                    isPaid: false,
                    totalPrice: 809,
                    orderItems: [
                        {
                            name: 'แชมพูออแกนิค',
                            qty: 2,
                            image: 'assets/img/IMG_5759 2.jpg',
                            price: 250
                        },
                        {
                            name: 'ครีมอาบน้ำ',
                            qty: 1,
                            image: 'assets/img/S__10067985_0.jpg',
                            price: 200
                        }
                    ]
                },
                {
                    _id: '614c5ac29b15b33e40b11e22',
                    orderNumber: 'TY2407300078',
                    createdAt: '2024-07-30T14:20:15.000Z',
                    status: 'delivered',
                    isPaid: true,
                    paidAt: '2024-07-30T14:35:22.000Z',
                    totalPrice: 1250,
                    orderItems: [
                        {
                            name: 'เซรั่มบำรุงผิว',
                            qty: 1,
                            image: 'assets/img/S__10067976_0.jpg',
                            price: 450
                        },
                        {
                            name: 'แชมพูออแกนิค',
                            qty: 2,
                            image: 'assets/img/IMG_5759 2.jpg',
                            price: 250
                        },
                        {
                            name: 'ครีมอาบน้ำ',
                            qty: 1,
                            image: 'assets/img/S__10067985_0.jpg',
                            price: 200
                        }
                    ],
                    shippingInfo: {
                        trackingNumber: 'TH123456789',
                        carrier: 'thailandpost',
                        shippedAt: '2024-07-31T09:15:30.000Z'
                    },
                    deliveredAt: '2024-08-02T14:20:15.000Z'
                }
            ];

            displayOrderHistory(mockOrders);
        }
    }

    function displayOrderHistory(orders) {
        if (!orderHistoryContainer || !orders.length) {
            orderHistoryContainer.innerHTML = '<p class="text-center text-muted">ไม่พบรายการสั่งซื้อ</p>';
            return;
        }

        let html = '';

        orders.forEach(order => {
            // Format date
            const orderDate = new Date(order.createdAt);
            const formattedDate = new Intl.DateTimeFormat('th-TH', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }).format(orderDate);

            // Determine status badge
            let statusBadge = '';
            let statusText = '';

            if (order.status === 'delivered') {
                statusBadge = 'bg-success';
                statusText = 'จัดส่งแล้ว';
            } else if (order.status === 'shipped') {
                statusBadge = 'bg-info';
                statusText = 'กำลังจัดส่ง';
            } else if (order.status === 'processing') {
                statusBadge = 'bg-primary';
                statusText = 'กำลังเตรียมสินค้า';
            } else if (order.status === 'cancelled') {
                statusBadge = 'bg-danger';
                statusText = 'ยกเลิก';
            } else if (order.isPaid) {
                statusBadge = 'bg-warning';
                statusText = 'ชำระเงินแล้ว';
            } else {
                statusBadge = 'bg-secondary';
                statusText = 'รอชำระเงิน';
            }

            // Build a compact item summary
            let itemSummary = '';
            if (order.orderItems.length > 0) {
                const firstItem = order.orderItems[0];
                itemSummary = firstItem.name;

                if (order.orderItems.length > 1) {
                    itemSummary += ` และอีก ${order.orderItems.length - 1} รายการ`;
                }
            }

            html += `
            <div class="order-item">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <div class="d-flex align-items-center mb-2">
                            <span class="badge ${statusBadge} me-2">${statusText}</span>
                            <h6 class="mb-0">หมายเลขคำสั่งซื้อ: ${order.orderNumber || `#${order._id.substring(0, 8)}`}</h6>
                        </div>
                        <p class="small mb-1"><strong>วันที่สั่งซื้อ:</strong> ${formattedDate}</p>
                        <p class="small mb-1"><strong>สินค้า:</strong> ${itemSummary}</p>
                        <p class="small mb-0"><strong>ยอดรวม:</strong> ฿${order.totalPrice.toFixed(2)}</p>
                    </div>
                    <div class="col-md-4 text-md-end mt-3 mt-md-0">
                        <a href="order-confirmation.html?orderId=${order._id}" class="btn btn-outline-primary btn-sm">
                            ดูรายละเอียด
                        </a>
                        ${order.status === 'shipped' && order.shippingInfo && order.shippingInfo.trackingNumber ?
                    `<a href="#" class="btn btn-outline-info btn-sm ms-2" data-tracking="${order.shippingInfo.trackingNumber}">
                                ติดตามพัสดุ
                            </a>` : ''}
                    </div>
                </div>
            </div>
            `;
        });

        orderHistoryContainer.innerHTML = html;

        // Add event listeners for tracking buttons
        const trackingButtons = orderHistoryContainer.querySelectorAll('[data-tracking]');
        trackingButtons.forEach(button => {
            button.addEventListener('click', function (e) {
                e.preventDefault();
                const trackingNumber = this.getAttribute('data-tracking');
                window.open(`https://track.thailandpost.co.th/?trackNumber=${trackingNumber}`, '_blank');
            });
        });
    }

    async function handleProfileUpdate(e) {
        e.preventDefault();

        // Validate passwords match if provided
        if (editNewPassword.value && editNewPassword.value !== editConfirmPassword.value) {
            showAlert('รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน', 'danger');
            return;
        }

        // Collect form data
        const userData = {
            firstName: editFirstName.value,
            lastName: editLastName.value,
            phoneNumber: editPhone.value
        };

        // Add password data if provided
        if (editNewPassword.value && editCurrentPassword.value) {
            userData.currentPassword = editCurrentPassword.value;
            userData.newPassword = editNewPassword.value;
        }

        const token = localStorage.getItem('token');

        if (!token) {
            showAlert('กรุณาเข้าสู่ระบบใหม่', 'danger');
            return;
        }

        // Show loading state
        const submitButton = profileForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> กำลังบันทึก...';

        try {
            const response = await fetch(`${API_URL}/users/update-profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showAlert('บันทึกข้อมูลเรียบร้อยแล้ว', 'success');

                // Clear password fields
                editCurrentPassword.value = '';
                editNewPassword.value = '';
                editConfirmPassword.value = '';

                // Reload user profile
                loadUserProfile();
            } else {
                showAlert(data.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'danger');
            }
        } catch (error) {
            console.error('Update profile error:', error);
            showAlert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์', 'danger');

            // For demo purposes, simulate success
            setTimeout(() => {
                showAlert('บันทึกข้อมูลเรียบร้อยแล้ว (สำหรับการทดสอบ)', 'success');

                // Clear password fields
                editCurrentPassword.value = '';
                editNewPassword.value = '';
                editConfirmPassword.value = '';
            }, 1000);
        } finally {
            // Restore button
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        }
    }

    function showAlert(message, type) {
        if (!profileAlert) return;

        profileAlert.className = `alert alert-${type}`;
        profileAlert.textContent = message;
        profileAlert.classList.remove('d-none');

        // Auto-hide after 5 seconds
        setTimeout(() => {
            profileAlert.classList.add('d-none');
        }, 5000);
    }

    function handleLogout() {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    }
}); 