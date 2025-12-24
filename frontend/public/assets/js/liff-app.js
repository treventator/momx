/**
 * TANYARAT LIFF Application
 * ระบบสมาชิกผ่าน LINE LIFF
 */

// Configuration - เปลี่ยน LIFF_ID เมื่อได้รับจาก LINE Developers
const LIFF_ID = 'YOUR_LIFF_ID_HERE'; // TODO: เปลี่ยนเป็น LIFF ID จริง
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:4455/api' 
  : '/api';

// Global state
let liffProfile = null;
let userData = null;
let authToken = null;

/**
 * Initialize LIFF
 */
async function initializeLiff() {
  try {
    console.log('Initializing LIFF...');
    
    await liff.init({ liffId: LIFF_ID });
    
    console.log('LIFF initialized successfully');
    console.log('Is in LINE client:', liff.isInClient());
    console.log('Is logged in:', liff.isLoggedIn());
    
    // Check if user is logged in
    if (!liff.isLoggedIn()) {
      console.log('User not logged in, redirecting to LINE login...');
      liff.login();
      return;
    }
    
    // Get LINE profile
    await getLiffProfile();
    
    // Authenticate with backend
    await authenticateWithBackend();
    
    // Hide loading screen and show main content
    hideLoading();
    showSection('mainSection');
    
  } catch (error) {
    console.error('LIFF initialization failed:', error);
    showError('ไม่สามารถเชื่อมต่อกับ LINE ได้: ' + error.message);
  }
}

/**
 * Get LINE profile from LIFF
 */
async function getLiffProfile() {
  try {
    liffProfile = await liff.getProfile();
    console.log('LINE Profile:', liffProfile);
    
    // Update UI with LINE profile
    updateProfileUI(liffProfile);
    
  } catch (error) {
    console.error('Failed to get LINE profile:', error);
    throw error;
  }
}

/**
 * Authenticate with backend using LINE access token
 */
async function authenticateWithBackend() {
  try {
    const accessToken = liff.getAccessToken();
    const idToken = liff.getIDToken();
    
    console.log('Authenticating with backend...');
    
    const response = await fetch(`${API_BASE_URL}/line/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        accessToken,
        idToken
      })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Authentication failed');
    }
    
    console.log('Backend authentication successful:', data);
    
    // Store auth token and user data
    authToken = data.user.token;
    userData = data.user;
    
    // Save to localStorage for persistence
    localStorage.setItem('liff_token', authToken);
    localStorage.setItem('liff_user', JSON.stringify(userData));
    
    // Update UI with user data
    updateUserUI(userData);
    
  } catch (error) {
    console.error('Backend authentication failed:', error);
    // Continue anyway - user can still use basic features
  }
}

/**
 * Update profile UI with LINE profile data
 */
function updateProfileUI(profile) {
  const avatarEl = document.getElementById('profileAvatar');
  const nameEl = document.getElementById('profileName');
  const statusEl = document.getElementById('profileStatus');
  
  if (avatarEl && profile.pictureUrl) {
    avatarEl.src = profile.pictureUrl;
  }
  
  if (nameEl) {
    nameEl.textContent = profile.displayName || 'สมาชิก';
  }
  
  if (statusEl && profile.statusMessage) {
    statusEl.textContent = profile.statusMessage;
  }
}

/**
 * Update UI with backend user data
 */
function updateUserUI(user) {
  // Update form fields
  const firstNameEl = document.getElementById('inputFirstName');
  const lastNameEl = document.getElementById('inputLastName');
  const phoneEl = document.getElementById('inputPhone');
  const emailEl = document.getElementById('inputEmail');
  const membershipBadge = document.getElementById('membershipBadge');
  const memberSince = document.getElementById('memberSince');
  
  if (firstNameEl) firstNameEl.value = user.firstName || '';
  if (lastNameEl) lastNameEl.value = user.lastName || '';
  if (phoneEl) phoneEl.value = user.phoneNumber || '';
  if (emailEl) emailEl.value = user.email || '';
  
  // Update membership badge
  if (membershipBadge) {
    const membership = user.membership || 'none';
    membershipBadge.textContent = getMembershipText(membership);
    membershipBadge.className = 'membership-badge ' + membership;
  }
  
  // Update points
  const totalPointsEl = document.getElementById('totalPoints');
  if (totalPointsEl) {
    totalPointsEl.textContent = (user.points || 0).toLocaleString();
  }
  
  // Calculate months since registration
  if (memberSince && user.createdAt) {
    const created = new Date(user.createdAt);
    const now = new Date();
    const months = Math.floor((now - created) / (1000 * 60 * 60 * 24 * 30));
    memberSince.textContent = months || 1;
  }
  
  // Load orders if available
  loadUserOrders();
  
  // Load addresses if available
  loadUserAddresses(user);
}

/**
 * Get membership text in Thai
 */
function getMembershipText(membership) {
  const texts = {
    'none': 'สมาชิกทั่วไป',
    'basic': 'สมาชิก Basic',
    'premium': 'สมาชิก Premium'
  };
  return texts[membership] || 'สมาชิก';
}

/**
 * Load user orders
 */
async function loadUserOrders() {
  try {
    if (!authToken) return;
    
    const response = await fetch(`${API_BASE_URL}/shop/orders/my-orders`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    
    if (data.success && data.orders) {
      // Update total orders count
      const totalOrdersEl = document.getElementById('totalOrders');
      if (totalOrdersEl) {
        totalOrdersEl.textContent = data.orders.length;
      }
      
      // Render orders list
      renderOrdersList(data.orders);
    }
    
  } catch (error) {
    console.error('Failed to load orders:', error);
  }
}

/**
 * Render orders list
 */
function renderOrdersList(orders) {
  const container = document.getElementById('ordersList');
  if (!container) return;
  
  if (!orders || orders.length === 0) {
    container.innerHTML = `
      <div class="text-center py-5">
        <i class="fa fa-shopping-bag fa-3x text-muted mb-3"></i>
        <p class="text-muted">ยังไม่มีคำสั่งซื้อ</p>
        <a href="shop.html" class="btn btn-line">
          <i class="fa fa-shopping-cart me-2"></i>เริ่มช้อปปิ้ง
        </a>
      </div>
    `;
    return;
  }
  
  const statusTexts = {
    'pending': 'รอการยืนยัน',
    'confirmed': 'ยืนยันแล้ว',
    'processing': 'กำลังเตรียมสินค้า',
    'shipped': 'จัดส่งแล้ว',
    'delivered': 'จัดส่งสำเร็จ',
    'cancelled': 'ยกเลิก'
  };
  
  container.innerHTML = orders.map(order => `
    <div class="order-card">
      <div class="d-flex justify-content-between align-items-start mb-2">
        <div>
          <strong>#${order.orderNumber || order._id.slice(-8)}</strong>
          <br>
          <small class="text-muted">${new Date(order.createdAt).toLocaleDateString('th-TH')}</small>
        </div>
        <span class="order-status ${order.status}">${statusTexts[order.status] || order.status}</span>
      </div>
      <div class="d-flex justify-content-between">
        <span class="text-muted">${order.items?.length || 0} รายการ</span>
        <strong>฿${(order.total || 0).toLocaleString()}</strong>
      </div>
    </div>
  `).join('');
}

/**
 * Load user addresses
 */
function loadUserAddresses(user) {
  if (!user.addresses || user.addresses.length === 0) return;
  
  const address = user.addresses.find(a => a.isDefault) || user.addresses[0];
  
  const address1El = document.getElementById('inputAddress1');
  const address2El = document.getElementById('inputAddress2');
  const cityEl = document.getElementById('inputCity');
  const stateEl = document.getElementById('inputState');
  const postalCodeEl = document.getElementById('inputPostalCode');
  
  if (address1El) address1El.value = address.addressLine1 || '';
  if (address2El) address2El.value = address.addressLine2 || '';
  if (cityEl) cityEl.value = address.city || '';
  if (stateEl) stateEl.value = address.state || '';
  if (postalCodeEl) postalCodeEl.value = address.postalCode || '';
}

/**
 * Show section
 */
function showSection(sectionId) {
  // Hide all sections
  document.querySelectorAll('.liff-section').forEach(section => {
    section.classList.remove('active');
  });
  
  // Show target section
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.add('active');
  }
}

/**
 * Hide loading screen
 */
function hideLoading() {
  const loadingScreen = document.getElementById('loadingScreen');
  if (loadingScreen) {
    loadingScreen.classList.add('hidden');
  }
}

/**
 * Show error
 */
function showError(message) {
  hideLoading();
  showSection('errorSection');
  
  const errorMessageEl = document.getElementById('errorMessage');
  if (errorMessageEl) {
    errorMessageEl.textContent = message;
  }
}

/**
 * Show alert in form section
 */
function showAlert(containerId, message, type = 'success') {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.className = `alert alert-liff alert-${type}`;
  container.textContent = message;
  container.classList.remove('d-none');
  
  // Auto hide after 3 seconds
  setTimeout(() => {
    container.classList.add('d-none');
  }, 3000);
}

/**
 * Update profile
 */
async function updateProfile(e) {
  e.preventDefault();
  
  try {
    const firstName = document.getElementById('inputFirstName').value;
    const lastName = document.getElementById('inputLastName').value;
    const phoneNumber = document.getElementById('inputPhone').value;
    const email = document.getElementById('inputEmail').value;
    
    const response = await fetch(`${API_BASE_URL}/line/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        firstName,
        lastName,
        phoneNumber,
        email
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showAlert('profileAlert', 'บันทึกข้อมูลสำเร็จ', 'success');
      userData = { ...userData, ...data.user };
      localStorage.setItem('liff_user', JSON.stringify(userData));
    } else {
      showAlert('profileAlert', data.message || 'เกิดข้อผิดพลาด', 'danger');
    }
    
  } catch (error) {
    console.error('Update profile error:', error);
    showAlert('profileAlert', 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'danger');
  }
}

/**
 * Update address
 */
async function updateAddress(e) {
  e.preventDefault();
  
  try {
    const addressData = {
      addressLine1: document.getElementById('inputAddress1').value,
      addressLine2: document.getElementById('inputAddress2').value,
      city: document.getElementById('inputCity').value,
      state: document.getElementById('inputState').value,
      postalCode: document.getElementById('inputPostalCode').value,
      country: 'Thailand',
      isDefault: true
    };
    
    const response = await fetch(`${API_BASE_URL}/users/address`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(addressData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      showAlert('addressAlert', 'บันทึกที่อยู่สำเร็จ', 'success');
    } else {
      showAlert('addressAlert', data.message || 'เกิดข้อผิดพลาด', 'danger');
    }
    
  } catch (error) {
    console.error('Update address error:', error);
    showAlert('addressAlert', 'เกิดข้อผิดพลาดในการบันทึกที่อยู่', 'danger');
  }
}

/**
 * Share app via LINE
 */
async function shareApp() {
  if (!liff.isApiAvailable('shareTargetPicker')) {
    alert('ฟีเจอร์แชร์ไม่รองรับในเบราว์เซอร์นี้');
    return;
  }
  
  try {
    await liff.shareTargetPicker([
      {
        type: 'flex',
        altText: 'แนะนำร้าน TANYARAT Shop',
        contents: {
          type: 'bubble',
          hero: {
            type: 'image',
            url: 'https://yourdomain.com/assets/img/shop-banner.jpg',
            size: 'full',
            aspectRatio: '20:13',
            aspectMode: 'cover'
          },
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '🎉 แนะนำร้านดี!',
                weight: 'bold',
                size: 'xl'
              },
              {
                type: 'text',
                text: 'TANYARAT Shop - ผลิตภัณฑ์ดูแลสุขภาพและความงาม',
                size: 'sm',
                color: '#666666',
                margin: 'md',
                wrap: true
              }
            ]
          },
          footer: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'button',
                action: {
                  type: 'uri',
                  label: 'เข้าชมร้านค้า',
                  uri: `https://liff.line.me/${LIFF_ID}`
                },
                style: 'primary'
              }
            ]
          }
        }
      }
    ]);
    
  } catch (error) {
    console.error('Share error:', error);
  }
}

/**
 * Close LIFF window
 */
function closeLiff() {
  if (liff.isInClient()) {
    liff.closeWindow();
  } else {
    window.close();
  }
}

/**
 * Send message to LINE chat (if in LIFF)
 */
async function sendMessage(message) {
  if (!liff.isInClient()) {
    console.log('Not in LINE client, cannot send message');
    return { success: false, reason: 'not_in_client' };
  }
  
  try {
    await liff.sendMessages([
      {
        type: 'text',
        text: message
      }
    ]);
    return { success: true };
  } catch (error) {
    console.error('Send message error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * ส่งข้อความยืนยันการอัพเดทโปรไฟล์กลับแชท
 */
async function sendProfileUpdateConfirmation() {
  if (!liff.isInClient()) return;
  
  try {
    await liff.sendMessages([
      {
        type: 'flex',
        altText: '✅ อัพเดทข้อมูลสำเร็จ',
        contents: {
          type: 'bubble',
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '✅ อัพเดทข้อมูลสำเร็จ',
                weight: 'bold',
                size: 'lg',
                color: '#1DB446'
              },
              {
                type: 'text',
                text: 'ข้อมูลส่วนตัวของคุณได้รับการอัพเดทเรียบร้อยแล้ว',
                size: 'sm',
                color: '#666666',
                margin: 'md',
                wrap: true
              }
            ]
          }
        }
      }
    ]);
  } catch (error) {
    console.error('Send confirmation error:', error);
  }
}

/**
 * ส่งข้อความยืนยันการสั่งซื้อกลับแชท
 * @param {Object} order - Order data
 */
async function sendOrderConfirmationToChat(order) {
  if (!liff.isInClient()) {
    console.log('Not in LINE client, skipping chat message');
    return;
  }
  
  try {
    await liff.sendMessages([
      {
        type: 'flex',
        altText: `🛒 สั่งซื้อสำเร็จ #${order.orderNumber || order._id}`,
        contents: {
          type: 'bubble',
          header: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '🛒 สั่งซื้อสำเร็จ!',
                weight: 'bold',
                size: 'lg',
                color: '#FFFFFF'
              }
            ],
            backgroundColor: '#1DB446',
            paddingAll: 'lg'
          },
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: `หมายเลข: #${order.orderNumber || order._id.slice(-8)}`,
                size: 'sm',
                color: '#666666'
              },
              {
                type: 'text',
                text: `ยอดรวม: ฿${(order.total || order.totalPrice || 0).toLocaleString()}`,
                weight: 'bold',
                size: 'lg',
                margin: 'md'
              },
              {
                type: 'text',
                text: '⏳ รอการชำระเงิน',
                size: 'sm',
                color: '#FF8C00',
                margin: 'md'
              }
            ]
          },
          footer: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'button',
                action: {
                  type: 'uri',
                  label: 'ดูรายละเอียด',
                  uri: `https://liff.line.me/${LIFF_ID}`
                },
                style: 'primary',
                color: '#1DB446'
              }
            ]
          }
        }
      }
    ]);
    console.log('Order confirmation sent to chat');
  } catch (error) {
    console.error('Send order confirmation error:', error);
  }
}

/**
 * ส่งข้อความแจ้งว่ากำลังรอติดต่อกลับ (สำหรับฟอร์มติดต่อ)
 * @param {string} subject - หัวข้อที่ติดต่อ
 */
async function sendContactConfirmationToChat(subject) {
  if (!liff.isInClient()) return;
  
  try {
    await liff.sendMessages([
      {
        type: 'flex',
        altText: '📩 ส่งข้อความสำเร็จ',
        contents: {
          type: 'bubble',
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '📩 ส่งข้อความสำเร็จ',
                weight: 'bold',
                size: 'lg',
                color: '#1DB446'
              },
              {
                type: 'text',
                text: `เรื่อง: ${subject}`,
                size: 'sm',
                color: '#666666',
                margin: 'md'
              },
              {
                type: 'text',
                text: 'ทีมงานจะติดต่อกลับโดยเร็วที่สุดค่ะ',
                size: 'sm',
                color: '#888888',
                margin: 'md',
                wrap: true
              }
            ]
          }
        }
      }
    ]);
  } catch (error) {
    console.error('Send contact confirmation error:', error);
  }
}

/**
 * ส่งข้อความแสดงแต้มสะสมกลับแชท
 */
async function sendPointsSummaryToChat() {
  if (!liff.isInClient() || !userData) return;
  
  try {
    await liff.sendMessages([
      {
        type: 'flex',
        altText: `⭐ แต้มสะสมของคุณ: ${userData.points || 0} แต้ม`,
        contents: {
          type: 'bubble',
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '⭐ แต้มสะสม',
                weight: 'bold',
                size: 'lg'
              },
              {
                type: 'text',
                text: `${userData.points || 0}`,
                size: 'xxl',
                weight: 'bold',
                color: '#FF6B35',
                align: 'center',
                margin: 'lg'
              },
              {
                type: 'text',
                text: 'แต้ม',
                size: 'sm',
                color: '#666666',
                align: 'center'
              },
              {
                type: 'separator',
                margin: 'lg'
              },
              {
                type: 'text',
                text: '💡 สะสม 100 แต้ม แลกส่วนลด 50 บาท',
                size: 'xs',
                color: '#888888',
                margin: 'md',
                wrap: true
              }
            ]
          }
        }
      }
    ]);
  } catch (error) {
    console.error('Send points summary error:', error);
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Initialize LIFF
  initializeLiff();
  
  // Profile form
  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', updateProfile);
  }
  
  // Address form
  const addressForm = document.getElementById('addressForm');
  if (addressForm) {
    addressForm.addEventListener('submit', updateAddress);
  }
});

// Export functions for global access
window.showSection = showSection;
window.shareApp = shareApp;
window.closeLiff = closeLiff;
window.sendMessage = sendMessage;
window.sendOrderConfirmationToChat = sendOrderConfirmationToChat;
window.sendProfileUpdateConfirmation = sendProfileUpdateConfirmation;
window.sendContactConfirmationToChat = sendContactConfirmationToChat;
window.sendPointsSummaryToChat = sendPointsSummaryToChat;

