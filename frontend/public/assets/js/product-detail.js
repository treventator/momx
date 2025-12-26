// Product Detail Page JavaScript
document.addEventListener('DOMContentLoaded', () => {
    console.log('Product detail page script loaded');
    
    // Get product ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (!productId) {
        console.error('No product ID in URL');
        showError('ไม่พบรหัสสินค้า กรุณาลองใหม่อีกครั้ง');
        return;
    }
    
    // Elements
    const loadingElement = document.getElementById('loading');
    const errorContainer = document.getElementById('error-container');
    const errorMessage = document.getElementById('error-message');
    const productDetailElement = document.getElementById('product-detail');
    const productNameElement = document.getElementById('product-name');
    const productNameBreadcrumb = document.getElementById('product-title-breadcrumb');
    const productPriceElement = document.getElementById('product-price');
    const productStockStatusElement = document.getElementById('product-stock-status');
    const productDescriptionElement = document.getElementById('product-description');
    const mainProductImage = document.getElementById('main-product-image');
    const productThumbnails = document.getElementById('product-thumbnails');
    const quantityInput = document.getElementById('quantity');
    const decreaseButton = document.getElementById('decrease-quantity');
    const increaseButton = document.getElementById('increase-quantity');
    const addToCartButton = document.getElementById('add-to-cart');
    const buyNowButton = document.getElementById('buy-now');
    const relatedProductsContainer = document.getElementById('related-products');
    const relatedProductsLoading = document.getElementById('related-products-loading');
    
    // Fetch product details
    fetchProductDetails();
    
    // Quantity controls
    if (decreaseButton) {
        decreaseButton.addEventListener('click', () => {
            const currentValue = parseInt(quantityInput.value);
            if (currentValue > 1) {
                quantityInput.value = currentValue - 1;
            }
        });
    }
    
    if (increaseButton) {
        increaseButton.addEventListener('click', () => {
            const currentValue = parseInt(quantityInput.value);
            quantityInput.value = currentValue + 1;
        });
    }
    
    // Ensure quantity is always at least 1
    if (quantityInput) {
        quantityInput.addEventListener('change', () => {
            const value = parseInt(quantityInput.value);
            if (isNaN(value) || value < 1) {
                quantityInput.value = 1;
            }
        });
    }
    
    // Add to cart button
    if (addToCartButton) {
        addToCartButton.addEventListener('click', () => {
            const quantity = parseInt(quantityInput.value);
            addToCart(productId, quantity);
        });
    }
    
    // Buy now button
    if (buyNowButton) {
        buyNowButton.addEventListener('click', () => {
            const quantity = parseInt(quantityInput.value);
            buyNow(productId, quantity);
        });
    }
    
    async function fetchProductDetails() {
        if (!loadingElement || !productDetailElement) return;
        
        try {
            showLoading(true);
            
            // Fetch product data
            const response = await fetch(`/api/products/${productId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.success || !data.product) {
                throw new Error('Failed to fetch product details');
            }
            
            // Render product details
            renderProductDetails(data.product);
            
            // Fetch related products
            fetchRelatedProducts(data.product.category);
            
        } catch (error) {
            console.error('Error fetching product details:', error);
            showError('ไม่สามารถโหลดข้อมูลสินค้าได้ กรุณาลองใหม่อีกครั้ง');
        } finally {
            showLoading(false);
        }
    }
    
    function renderProductDetails(product) {
        if (!productDetailElement) return;
        
        // Update product name
        if (productNameElement) {
            productNameElement.textContent = product.name;
        }
        
        // Update breadcrumb
        if (productNameBreadcrumb) {
            productNameBreadcrumb.textContent = product.name;
        }
        
        // Update price
        if (productPriceElement) {
            if (product.salePrice && product.salePrice < product.price) {
                productPriceElement.innerHTML = `
                    <span class="text-decoration-line-through text-muted me-2">${product.price.toLocaleString()} บาท</span>
                    <span class="text-primary">${product.salePrice.toLocaleString()} บาท</span>
                `;
            } else {
                productPriceElement.textContent = `${product.price.toLocaleString()} บาท`;
            }
        }
        
        // Update stock status
        if (productStockStatusElement) {
            if (product.stock > 0) {
                productStockStatusElement.className = 'badge bg-success ms-2';
                productStockStatusElement.textContent = 'มีสินค้า';
                
                // Enable add to cart and buy now buttons
                if (addToCartButton) addToCartButton.disabled = false;
                if (buyNowButton) buyNowButton.disabled = false;
            } else {
                productStockStatusElement.className = 'badge bg-danger ms-2';
                productStockStatusElement.textContent = 'สินค้าหมด';
                
                // Disable add to cart and buy now buttons
                if (addToCartButton) addToCartButton.disabled = true;
                if (buyNowButton) buyNowButton.disabled = true;
            }
        }
        
        // Update description
        if (productDescriptionElement) {
            productDescriptionElement.innerHTML = product.description;
        }
        
        // Update main image
        if (mainProductImage && product.images && product.images.length > 0) {
            mainProductImage.src = product.images[0].url;
            mainProductImage.alt = product.name;
        }
        
        // Update thumbnails
        if (productThumbnails && product.images && product.images.length > 0) {
            productThumbnails.innerHTML = '';
            
            product.images.forEach((image, index) => {
                const col = document.createElement('div');
                col.className = 'col-3';
                
                const thumbnail = document.createElement('img');
                thumbnail.src = image.url;
                thumbnail.alt = `${product.name} - ${index + 1}`;
                thumbnail.className = 'img-thumbnail';
                thumbnail.style.cursor = 'pointer';
                thumbnail.addEventListener('click', () => {
                    if (mainProductImage) {
                        mainProductImage.src = image.url;
                        mainProductImage.alt = product.name;
                    }
                });
                
                col.appendChild(thumbnail);
                productThumbnails.appendChild(col);
            });
        }
        
        // Show product detail section
        productDetailElement.style.display = 'flex';
    }
    
    async function fetchRelatedProducts(categoryId) {
        if (!relatedProductsContainer || !relatedProductsLoading) return;
        
        try {
            relatedProductsLoading.style.display = 'block';
            
            // Fetch related products (products in the same category, excluding current product)
            const response = await fetch(`/api/products?category=${categoryId}&limit=4`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error('Failed to fetch related products');
            }
            
            // Filter out current product
            const relatedProducts = data.products.filter(product => product._id !== productId);
            
            // Render related products
            renderRelatedProducts(relatedProducts.slice(0, 4)); // Show up to 4 related products
            
        } catch (error) {
            console.error('Error fetching related products:', error);
            // Hide related products section on error (optional)
            relatedProductsContainer.innerHTML = '';
        } finally {
            relatedProductsLoading.style.display = 'none';
        }
    }
    
    function renderRelatedProducts(products) {
        if (!relatedProductsContainer) return;
        
        relatedProductsContainer.innerHTML = '';
        
        if (!products || products.length === 0) {
            relatedProductsContainer.innerHTML = '<div class="col-12 text-center">ไม่พบสินค้าที่เกี่ยวข้อง</div>';
            return;
        }
        
        products.forEach(product => {
            const hasDiscount = product.salePrice > 0 && product.salePrice < product.price;
            
            const productCol = document.createElement('div');
            productCol.className = 'col-md-3 col-sm-6 mb-4';
            productCol.innerHTML = `
                <div class="card h-100">
                    <a href="product-detail.html?id=${product._id}">
                        <img src="${product.images && product.images.length > 0 ? product.images[0].url : 'assets/img/placeholder.jpg'}" 
                            class="card-img-top" alt="${product.name}" style="height: 200px; object-fit: cover;">
                    </a>
                    <div class="card-body">
                        <h5 class="card-title"><a href="product-detail.html?id=${product._id}" class="text-decoration-none">${product.name}</a></h5>
                        <p class="card-text">
                            ${hasDiscount 
                                ? `<span class="text-decoration-line-through text-muted me-2">${product.price.toLocaleString()} บาท</span>
                                   <span class="text-primary">${product.salePrice.toLocaleString()} บาท</span>` 
                                : `<span class="text-primary">${product.price.toLocaleString()} บาท</span>`
                            }
                        </p>
                        <a href="product-detail.html?id=${product._id}" class="btn btn-sm btn-outline-primary">ดูรายละเอียด</a>
                    </div>
                </div>
            `;
            
            relatedProductsContainer.appendChild(productCol);
        });
    }
    
    function showLoading(isLoading) {
        if (loadingElement) {
            loadingElement.style.display = isLoading ? 'block' : 'none';
        }
        
        if (productDetailElement) {
            productDetailElement.style.display = isLoading ? 'none' : 'flex';
        }
    }
    
    function showError(message) {
        if (errorContainer && errorMessage) {
            errorMessage.textContent = message;
            errorContainer.style.display = 'block';
        }
        
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }
    
    // Cart functions
    function addToCart(productId, quantity) {
        // Use cart.js or implement cart functionality
        if (typeof window.addToCart === 'function') {
            window.addToCart(productId, quantity)
                .then(() => {
                    showToast('เพิ่มสินค้าลงตะกร้าเรียบร้อยแล้ว', 'success');
                })
                .catch(error => {
                    console.error('Error adding to cart:', error);
                    showToast('ไม่สามารถเพิ่มสินค้าลงตะกร้าได้', 'danger');
                });
        } else {
            // Fallback if cart.js is not loaded
            console.log('Adding to cart:', productId, quantity);
            showToast('เพิ่มสินค้าลงตะกร้าเรียบร้อยแล้ว', 'success');

            // Update cart count in navbar
            updateCartCount(1);
        }
    }
    
    function buyNow(productId, quantity) {
        // Add to cart then redirect to checkout
        addToCart(productId, quantity);
        
        // Redirect to checkout page
        setTimeout(() => {
            window.location.href = '/checkout.html';
        }, 1000);
    }
    
    function updateCartCount(increment = 0) {
        const cartCountElement = document.querySelector('.cart-count');
        if (cartCountElement) {
            const currentCount = parseInt(cartCountElement.textContent) || 0;
            cartCountElement.textContent = currentCount + increment;
        }
    }
    
    function showToast(message, type = 'info') {
        // Create toast container if it doesn't exist
        let toastContainer = document.getElementById('toast-container');
        
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'position-fixed bottom-0 end-0 p-3';
            document.body.appendChild(toastContainer);
        }
        
        // Create toast element
        const toastId = 'toast-' + Date.now();
        const toast = document.createElement('div');
        toast.id = toastId;
        toast.className = `toast bg-${type} text-white`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        
        toast.innerHTML = `
            <div class="toast-header bg-${type} text-white">
                <strong class="me-auto">แจ้งเตือน</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        // Initialize Bootstrap toast
        const bsToast = new bootstrap.Toast(toast, {
            autohide: true,
            delay: 3000
        });
        
        bsToast.show();
        
        // Remove toast after it's hidden
        toast.addEventListener('hidden.bs.toast', function() {
            toast.remove();
        });
    }
}); 