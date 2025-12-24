// Shop Page JavaScript
document.addEventListener('DOMContentLoaded', () => {
    console.log('Shop page script loaded');
    
    // Elements
    const productsContainer = document.getElementById('product-grid') || document.getElementById('products-container');
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorDisplay = document.getElementById('error-message');
    const paginationContainer = document.getElementById('pagination');
    const categoryFilters = document.querySelectorAll('.category-filter');
    const priceMinInput = document.getElementById('min-price');
    const priceMaxInput = document.getElementById('max-price');
    const priceFilterBtn = document.getElementById('price-filter-btn');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const clearFiltersBtn = document.getElementById('clear-filters');
    const sortSelect = document.getElementById('sort-options');
    const totalProductsDisplay = document.getElementById('total-products');
    
    // Config
    const API_BASE_URL = '/api/shop/products';
    const ITEMS_PER_PAGE = 12;
    
    // State with defaults
    let state = {
        currentPage: 1,
        totalPages: 1,
        filters: {
            category: '',
            minPrice: 0,
            maxPrice: 10000,
            search: '',
            sort: '-createdAt' // Default sort by newest
        },
        isLoading: false,
        lastResponse: null
    };
    
    // Load saved state from localStorage if available
    initializeState();
    
    // Initialize
    loadCategories();
    initializeFilters();
    loadProducts();
    
    // Event listeners
    
    // Search
    if (searchInput && searchButton) {
        // Search on button click
        searchButton.addEventListener('click', function() {
            handleSearch();
        });
        
        // Search on Enter key
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch();
            }
        });
    }
    
    // Category filters
    if (categoryFilters && categoryFilters.length > 0) {
        categoryFilters.forEach(filter => {
            filter.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Toggle active class
                categoryFilters.forEach(f => f.classList.remove('active'));
                this.classList.add('active');
                
                const category = this.getAttribute('data-category');
                state.filters.category = category === 'all' ? '' : category;
                state.currentPage = 1;
                saveState();
                loadProducts();
            });
        });
    }
    
    // Price filter
    if (priceMinInput && priceMaxInput && priceFilterBtn) {
        priceFilterBtn.addEventListener('click', function() {
            const min = parseInt(priceMinInput.value) || 0;
            const max = parseInt(priceMaxInput.value) || 10000;
            
            if (min > max) {
                showToast('ราคาต่ำสุดต้องน้อยกว่าราคาสูงสุด', 'warning');
                return;
            }
            
            state.filters.minPrice = min;
            state.filters.maxPrice = max;
            state.currentPage = 1;
            saveState();
            loadProducts();
        });
    }
    
    // Sort options
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            state.filters.sort = this.value;
            state.currentPage = 1;
            saveState();
            loadProducts();
        });
    }
    
    // Clear filters
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', function() {
            // Reset all filters in UI
            resetFiltersUI();
            
            // Reset state
            state.filters = {
                category: '',
                minPrice: 0,
                maxPrice: 10000,
                search: '',
                sort: '-createdAt'
            };
            state.currentPage = 1;
            
            // Save and reload
            saveState();
            loadProducts();
        });
    }
    
    // Functions
    
    /**
     * Initialize state from localStorage or URL params
     */
    function initializeState() {
        // Try to load from localStorage
        const savedState = localStorage.getItem('shopState');
        if (savedState) {
            try {
                const parsedState = JSON.parse(savedState);
                // Merge with default state
                state = {
                    ...state,
                    filters: {
                        ...state.filters,
                        ...parsedState.filters
                    }
                };
            } catch (error) {
                console.error('Error parsing saved state:', error);
            }
        }
        
        // URL params override localStorage
        const urlParams = new URLSearchParams(window.location.search);
        
        if (urlParams.has('page')) {
            state.currentPage = parseInt(urlParams.get('page')) || 1;
        }
        
        if (urlParams.has('category')) {
            state.filters.category = urlParams.get('category');
        }
        
        if (urlParams.has('search')) {
            state.filters.search = urlParams.get('search');
        }
        
        if (urlParams.has('minPrice')) {
            state.filters.minPrice = parseInt(urlParams.get('minPrice')) || 0;
        }
        
        if (urlParams.has('maxPrice')) {
            state.filters.maxPrice = parseInt(urlParams.get('maxPrice')) || 10000;
        }
        
        if (urlParams.has('sort')) {
            state.filters.sort = urlParams.get('sort');
        }
    }
    
    /**
     * Save current state to localStorage
     */
    function saveState() {
        try {
            localStorage.setItem('shopState', JSON.stringify({
                filters: state.filters
            }));
        } catch (error) {
            console.error('Error saving state:', error);
        }
    }
    
    /**
     * Initialize UI filters based on state
     */
    function initializeFilters() {
        // Set category from state
        if (state.filters.category && categoryFilters) {
            categoryFilters.forEach(filter => {
                if (filter.getAttribute('data-category') === state.filters.category) {
                    filter.classList.add('active');
                } else {
                    filter.classList.remove('active');
                }
            });
        }
        
        // Set price inputs
        if (priceMinInput && priceMaxInput) {
            priceMinInput.value = state.filters.minPrice;
            priceMaxInput.value = state.filters.maxPrice;
        }
        
        // Set search input
        if (searchInput) {
            searchInput.value = state.filters.search;
        }
        
        // Set sort select
        if (sortSelect) {
            sortSelect.value = state.filters.sort;
        }
    }
    
    /**
     * Reset UI filters
     */
    function resetFiltersUI() {
        // Reset category filters
        if (categoryFilters) {
            categoryFilters.forEach(filter => {
                filter.classList.remove('active');
                if (filter.getAttribute('data-category') === 'all') {
                    filter.classList.add('active');
                }
            });
        }
        
        // Reset price inputs
        if (priceMinInput && priceMaxInput) {
            priceMinInput.value = 0;
            priceMaxInput.value = 10000;
        }
        
        // Reset search input
        if (searchInput) {
            searchInput.value = '';
        }
        
        // Reset sort select
        if (sortSelect) {
            sortSelect.value = '-createdAt';
        }
    }
    
    /**
     * Handle search input
     */
    function handleSearch() {
        const query = searchInput.value.trim();
        state.filters.search = query;
        state.currentPage = 1;
        saveState();
        loadProducts();
    }
    
    /**
     * Load categories from API
     */
    async function loadCategories() {
        // Get the categories container
        const categoriesContainer = document.getElementById('category-filters');
        const categoryLoading = document.getElementById('category-loading');
        
        if (!categoriesContainer) return;
        
        try {
            if (categoryLoading) {
                categoryLoading.classList.remove('d-none');
            }
            
            const response = await fetch(`${API_BASE_URL}/categories`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch categories');
            }
            
            const data = await response.json();
            
            if (!data.success || !data.categories || data.categories.length === 0) {
                return;
            }
            
            // Add categories to filter
            data.categories.forEach(category => {
                const categoryItem = document.createElement('div');
                categoryItem.className = 'form-check mb-2';
                categoryItem.innerHTML = `
                    <input class="form-check-input category-filter" type="radio" name="category" 
                           id="category-${category.slug}" value="${category.slug}" 
                           ${state.filters.category === category.slug ? 'checked' : ''}>
                    <label class="form-check-label" for="category-${category.slug}">
                        ${category.name}
                    </label>
                `;
                
                // Add event listener
                const input = categoryItem.querySelector('input');
                input.addEventListener('change', function() {
                    if (this.checked) {
                        state.filters.category = this.value;
                        state.currentPage = 1;
                        saveState();
                        loadProducts();
                    }
                });
                
                categoriesContainer.appendChild(categoryItem);
            });
        } catch (error) {
            console.error('Error loading categories:', error);
        } finally {
            if (categoryLoading) {
                categoryLoading.classList.add('d-none');
            }
        }
    }
    
    /**
     * Load products from API
     */
    async function loadProducts() {
        if (!productsContainer) return;
        
        // Set loading state
        state.isLoading = true;
        showLoading(true);
        
        try {
            // Build query string
            const queryParams = new URLSearchParams();
            queryParams.append('page', state.currentPage);
            queryParams.append('limit', ITEMS_PER_PAGE);
            
            if (state.filters.category) {
                queryParams.append('category', state.filters.category);
            }
            
            if (state.filters.search) {
                queryParams.append('search', state.filters.search);
            }
            
            if (state.filters.minPrice > 0) {
                queryParams.append('minPrice', state.filters.minPrice);
            }
            
            if (state.filters.maxPrice < 10000) {
                queryParams.append('maxPrice', state.filters.maxPrice);
            }
            
            if (state.filters.sort) {
                queryParams.append('sort', state.filters.sort);
            }
            
            // Update URL with filters for shareable links
            const newUrl = `${window.location.pathname}?${queryParams.toString()}`;
            window.history.replaceState({}, '', newUrl);
            
            // Fetch products
            const response = await fetch(`${API_BASE_URL}?${queryParams.toString()}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch products');
            }
            
            const data = await response.json();
            
            // Store response
            state.lastResponse = data;
            
            // Update state
            state.totalPages = data.totalPages || 1;
            
            // Render products
            renderProducts(data.products);
            
            // Update pagination
            renderPagination(data.totalPages, state.currentPage);
            
            // Update results count
            updateResultsCount(data.total);
            
        } catch (error) {
            console.error('Error loading products:', error);
            showError('ไม่สามารถโหลดสินค้าได้ กรุณาลองใหม่อีกครั้ง');
            
            // Show empty state
            productsContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="mb-4">
                        <i class="fas fa-exclamation-circle fa-3x text-muted"></i>
                    </div>
                    <h4>เกิดข้อผิดพลาด</h4>
                    <p>ไม่สามารถโหลดข้อมูลสินค้าได้ กรุณาลองใหม่อีกครั้ง</p>
                    <button class="btn btn-primary mt-3" onclick="window.location.reload()">
                        <i class="fas fa-sync-alt me-2"></i> โหลดข้อมูลใหม่
                    </button>
                </div>
            `;
        } finally {
            state.isLoading = false;
            showLoading(false);
        }
    }
    
    /**
     * Render products to container
     */
    function renderProducts(products) {
        if (!productsContainer) return;
        
        if (!products || products.length === 0) {
            productsContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="mb-4">
                        <i class="fas fa-search fa-3x text-muted"></i>
                    </div>
                    <h4>ไม่พบสินค้าที่ค้นหา</h4>
                    <p>ลองปรับเงื่อนไขการค้นหาใหม่</p>
                    <button id="clear-search" class="btn btn-outline-primary mt-3">
                        <i class="fas fa-times me-2"></i> ล้างการค้นหา
                    </button>
                </div>
            `;
            
            // Add event listener to clear search button
            const clearSearchBtn = document.getElementById('clear-search');
            if (clearSearchBtn) {
                clearSearchBtn.addEventListener('click', function() {
                    resetFiltersUI();
                    state.filters = {
                        category: '',
                        minPrice: 0,
                        maxPrice: 10000,
                        search: '',
                        sort: '-createdAt'
                    };
                    state.currentPage = 1;
                    saveState();
                    loadProducts();
                });
            }
            
            return;
        }
        
        productsContainer.innerHTML = '';
        
        products.forEach(product => {
            // Calculate discount percentage
            const discountPercent = product.discountPercentage || 0;
            const hasDiscount = product.salePrice > 0 && product.salePrice < product.price;
            
            // Get stock status
            const stockStatus = getStockStatusDisplay(product);
            
            // Get product image
            const productImage = getProductImage(product);
            
            const productCard = document.createElement('div');
            productCard.className = 'col-lg-3 col-md-4 col-sm-6 mb-4';
            productCard.innerHTML = `
                <div class="card h-100 product-card">
                    <div class="product-image-wrapper">
                        <a href="product-detail.html?id=${product._id}">
                            <img src="${productImage}" 
                                class="card-img-top" alt="${product.name}" loading="lazy">
                        </a>
                        ${hasDiscount ? `<div class="discount-badge">-${discountPercent}%</div>` : ''}
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title product-title">${product.name}</h5>
                        <p class="card-text text-muted small">${product.shortDescription || ''}</p>
                        <div class="d-flex justify-content-between align-items-center mt-auto">
                            <div>
                                ${hasDiscount 
                                    ? `<span class="text-decoration-line-through text-muted me-2">${product.price.toLocaleString()} บาท</span>
                                       <span class="text-primary fw-bold">${product.salePrice.toLocaleString()} บาท</span>` 
                                    : `<span class="text-primary fw-bold">${product.price.toLocaleString()} บาท</span>`
                                }
                            </div>
                            <div>${stockStatus}</div>
                        </div>
                    </div>
                    <div class="card-footer bg-transparent border-top-0">
                        <div class="d-grid gap-2">
                            <a href="product-detail.html?id=${product._id}" class="btn btn-outline-primary">ดูรายละเอียด</a>
                            ${product.stock > 0 
                                ? `<button class="btn btn-primary add-to-cart-btn" data-product-id="${product._id}">
                                    <i class="fas fa-cart-plus me-1"></i> เพิ่มลงตะกร้า
                                   </button>` 
                                : `<button class="btn btn-secondary" disabled>สินค้าหมด</button>`
                            }
                        </div>
                    </div>
                </div>
            `;
            
            productsContainer.appendChild(productCard);
        });
        
        // Add event listeners to "Add to Cart" buttons
        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', function() {
                const productId = this.getAttribute('data-product-id');
                addToCart(productId, 1);
            });
        });
    }
    
    /**
     * Get product image URL
     */
    function getProductImage(product) {
        if (!product.images || product.images.length === 0) {
            return 'assets/img/placeholder.jpg';
        }
        
        // Find main image first
        const mainImage = product.images.find(img => img.isMain);
        if (mainImage) {
            return mainImage.url;
        }
        
        // Fallback to first image
        return product.images[0].url;
    }
    
    /**
     * Get stock status display
     */
    function getStockStatusDisplay(product) {
        if (product.stock <= 0) {
            return '<span class="badge bg-danger">สินค้าหมด</span>';
        } else if (product.stock < 5) {
            return '<span class="badge bg-warning text-dark">เหลือน้อย</span>';
        } else {
            return '<span class="badge bg-success">มีสินค้า</span>';
        }
    }
    
    /**
     * Render pagination
     */
    function renderPagination(totalPages, currentPage) {
        if (!paginationContainer) return;
        
        paginationContainer.innerHTML = '';
        
        if (totalPages <= 1) return;
        
        const pagination = document.createElement('nav');
        pagination.setAttribute('aria-label', 'Product pagination');
        
        const ul = document.createElement('ul');
        ul.className = 'pagination justify-content-center';
        
        // Previous button
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
        
        const prevLink = document.createElement('a');
        prevLink.className = 'page-link';
        prevLink.href = '#';
        prevLink.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevLink.setAttribute('aria-label', 'Previous');
        prevLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentPage > 1) {
                state.currentPage--;
                saveState();
                loadProducts();
                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
        
        prevLi.appendChild(prevLink);
        ul.appendChild(prevLi);
        
        // Page numbers
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        
        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const pageLi = document.createElement('li');
            pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
            
            const pageLink = document.createElement('a');
            pageLink.className = 'page-link';
            pageLink.href = '#';
            pageLink.textContent = i;
            pageLink.addEventListener('click', (e) => {
                e.preventDefault();
                state.currentPage = i;
                saveState();
                loadProducts();
                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            
            pageLi.appendChild(pageLink);
            ul.appendChild(pageLi);
        }
        
        // Next button
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
        
        const nextLink = document.createElement('a');
        nextLink.className = 'page-link';
        nextLink.href = '#';
        nextLink.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextLink.setAttribute('aria-label', 'Next');
        nextLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentPage < totalPages) {
                state.currentPage++;
                saveState();
                loadProducts();
                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
        
        nextLi.appendChild(nextLink);
        ul.appendChild(nextLi);
        
        pagination.appendChild(ul);
        paginationContainer.appendChild(pagination);
    }
    
    /**
     * Update results count display
     */
    function updateResultsCount(total) {
        if (!totalProductsDisplay) return;
        
        totalProductsDisplay.textContent = `พบ ${total.toLocaleString()} รายการ`;
    }
    
    /**
     * Show/hide loading indicator
     */
    function showLoading(isLoading) {
        if (loadingIndicator) {
            loadingIndicator.style.display = isLoading ? 'block' : 'none';
        }
        
        if (productsContainer) {
            productsContainer.style.opacity = isLoading ? '0.5' : '1';
        }
    }
    
    /**
     * Show error message
     */
    function showError(message) {
        if (errorDisplay) {
            errorDisplay.textContent = message;
            errorDisplay.style.display = 'block';
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                errorDisplay.style.display = 'none';
            }, 5000);
        }
    }
    
    /**
     * Add product to cart
     */
    function addToCart(productId, quantity) {
        // Use the cart.js functionality (assuming it exists)
        if (typeof window.addToCart === 'function') {
            window.addToCart(productId, quantity)
                .then(() => {
                    // Show toast or notification
                    showToast('เพิ่มสินค้าลงตะกร้าเรียบร้อยแล้ว', 'success');
                })
                .catch(error => {
                    console.error('Error adding to cart:', error);
                    showToast('ไม่สามารถเพิ่มสินค้าลงตะกร้าได้', 'danger');
                });
        } else {
            // Fallback if cart.js is not available
            console.error('Cart functionality not available');
            showToast('ระบบตะกร้าสินค้ายังไม่พร้อมใช้งาน', 'warning');
        }
    }
    
    /**
     * Show toast notification
     */
    function showToast(message, type = 'info') {
        // Create toast container if it doesn't exist
        let toastContainer = document.getElementById('toast-container');
        
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'position-fixed bottom-0 end-0 p-3';
            toastContainer.style.zIndex = '1050';
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
        
        // Initialize and show the toast
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