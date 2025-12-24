/**
 * featuredProducts.js
 * Script สำหรับดึงข้อมูลสินค้าแนะนำจาก API และแสดงบนหน้าแรก
 */

document.addEventListener('DOMContentLoaded', function() {
    // ตรวจสอบว่ามี mockApi หรือไม่
    // ดึงข้อมูลสินค้าแนะนำจาก API
    fetchFeaturedProducts();
});

/**
 * ดึงข้อมูลสินค้าแนะนำจาก API
 */
async function fetchFeaturedProducts() {
    try {
        let data;
        
        // ใช้ mock API ถ้ากำลังพัฒนาบนเครื่องท้องถิ่น
        if (window.mockApi && window.mockApi.isDevelopment) {
            console.log('Using mock API for featured products');
            data = await window.mockApi.fetchFeaturedProducts();
        } else {
            // ใช้ API จริงเมื่ออยู่บนเซิร์ฟเวอร์
            const apiUrl = '/api/products/featured';
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            data = await response.json();
        }
        
        renderFeaturedProducts(data.products || []);
    } catch (error) {
        console.error('Error fetching featured products:', error);
        displayErrorMessage('ไม่สามารถโหลดสินค้าแนะนำได้ในขณะนี้');
    }
}

/**
 * แสดงสินค้าแนะนำบนหน้าเว็บ
 * @param {Array} products - รายการสินค้าที่ได้จาก API
 */
function renderFeaturedProducts(products) {
    const container = document.getElementById('featured-products-container');
    
    if (!container) {
        console.error('Featured products container not found');
        return;
    }
    
    // เคลียร์ content เดิม
    container.innerHTML = '';
    
    if (products.length === 0) {
        container.innerHTML = '<div class="col-12 text-center"><p>ไม่พบสินค้าแนะนำในขณะนี้</p></div>';
        return;
    }
    
    // สร้าง HTML สำหรับแต่ละสินค้า
    products.forEach(product => {
        const productCard = createProductCard(product);
        container.appendChild(productCard);
    });
}

/**
 * สร้าง element สำหรับแสดงสินค้าแต่ละชิ้น
 * @param {Object} product - ข้อมูลสินค้า
 * @returns {HTMLDivElement} - HTML element ของสินค้า
 */
function createProductCard(product) {
    const colDiv = document.createElement('div');
    colDiv.className = 'col-md-4 mb-4';
    
    // กำหนดรูปภาพสินค้า (ใช้รูปแรกหรือรูป default)
    const imageUrl = product.images && product.images.length > 0 
        ? product.images[0].url 
        : 'assets/img/products/default-product.jpg';
    
    // คำนวณราคาที่จะแสดง
    const displayPrice = product.salePrice && product.salePrice > 0 
        ? `<del class="text-muted me-2">${product.price.toFixed(2)} บาท</del><span class="text-primary">${product.salePrice.toFixed(2)} บาท</span>` 
        : `<span class="text-primary">${product.price.toFixed(2)} บาท</span>`;
    
    // สร้าง HTML ของการ์ดสินค้า
    colDiv.innerHTML = `
        <div class="card h-100 border-0 shadow-sm product-card">
            <div class="position-relative">
                ${product.salePrice ? '<div class="badge bg-warning text-white position-absolute" style="top: 10px; right: 10px;">ลดราคา</div>' : ''}
                ${product.isFeatured ? '<div class="badge bg-primary text-white position-absolute" style="top: 10px; left: 10px;">แนะนำ</div>' : ''}
                <img src="${imageUrl}" class="card-img-top" alt="${product.name}" style="height: 200px; object-fit: cover;">
            </div>
            <div class="card-body p-4">
                <h5 class="card-title fw-bold">${product.name}</h5>
                <p class="card-text text-muted mb-3">${product.description.substring(0, 80)}${product.description.length > 80 ? '...' : ''}</p>
                <div class="d-flex justify-content-between align-items-center">
                    <div>${displayPrice}</div>
                    <a href="/api/shop/product/${product._id}" class="btn btn-primary btn-sm">รายละเอียด</a>
                </div>
                ${product.stock > 0 
                    ? `<div class="text-success mt-2"><small>มีสินค้า</small></div>` 
                    : `<div class="text-danger mt-2"><small>สินค้าหมด</small></div>`}
            </div>
        </div>
    `;
    
    return colDiv;
}

/**
 * แสดงข้อความ error
 * @param {string} message - ข้อความ error
 */
function displayErrorMessage(message) {
    const container = document.getElementById('featured-products-container');
    
    if (!container) return;
    
    container.innerHTML = `
        <div class="col-12">
            <div class="alert alert-warning" role="alert">
                ${message}
            </div>
        </div>
    `;
} 