/**
 * Mock API for development and testing
 * This file provides mock data and API functions when working in development without a real backend
 */

(function() {
    // Check if we're in development mode
    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         window.location.href.indexOf('file://') === 0;
    
    // Mock categories
    const categories = [
        { _id: 'cat1', name: 'แชมพู', slug: 'shampoo', description: 'แชมพูออร์แกนิคจากธรรมชาติ' },
        { _id: 'cat2', name: 'ครีมอาบน้ำ', slug: 'shower-cream', description: 'ครีมอาบน้ำจากธรรมชาติ' },
        { _id: 'cat3', name: 'เซรั่มบำรุงผิว', slug: 'skin-serum', description: 'เซรั่มบำรุงผิวจากธรรมชาติ' },
        { _id: 'cat4', name: 'สบู่', slug: 'soap', description: 'สบู่จากธรรมชาติ' }
    ];
    
    // Mock products
    const products = [
        {
            _id: 'prod1',
            name: 'แชมพูออร์แกนิคสูตรผมนุ่มสลวย',
            sku: 'SHMP001',
            description: 'แชมพูออร์แกนิคจากธรรมชาติ 100% ช่วยให้ผมนุ่มสลวยเงางาม ลดการหลุดร่วงของเส้นผม มีส่วนผสมจากน้ำมันมะพร้าวและอาร์แกน ไม่มีสารเคมีอันตราย',
            price: 450,
            salePrice: 399,
            discountPercentage: 11,
            memberPrice: 379,
            stock: 25,
            images: [
                { url: 'assets/img/products/shampoo1.jpg', alt: 'แชมพูออร์แกนิคสูตรผมนุ่มสลวย' }
            ],
            category: categories[0],
            isFeatured: true,
            isNew: true,
            rating: 4.8,
            numReviews: 24
        },
        {
            _id: 'prod2',
            name: 'แชมพูผสมคอนดิชันเนอร์เพื่อผมแห้งเสีย',
            sku: 'SHMP002',
            description: 'แชมพูผสมคอนดิชันเนอร์สำหรับผมแห้งเสีย มีส่วนผสมจากน้ำมันโจโจบาและว่านหางจระเข้ ช่วยบำรุงเส้นผมที่แห้งเสียให้กลับมานุ่มชุ่มชื้นอีกครั้ง ปราศจากซิลิโคน',
            price: 520,
            salePrice: 0,
            discountPercentage: 0,
            memberPrice: 490,
            stock: 15,
            images: [
                { url: 'assets/img/products/shampoo2.jpg', alt: 'แชมพูผสมคอนดิชันเนอร์เพื่อผมแห้งเสีย' }
            ],
            category: categories[0],
            isFeatured: false,
            isNew: true,
            rating: 4.5,
            numReviews: 12
        },
        {
            _id: 'prod3',
            name: 'ครีมอาบน้ำกลิ่นลาเวนเดอร์',
            sku: 'SCRM001',
            description: 'ครีมอาบน้ำกลิ่นลาเวนเดอร์จากธรรมชาติ ให้ความชุ่มชื้นแก่ผิว พร้อมกลิ่นหอมผ่อนคลายจากน้ำมันหอมระเหยลาเวนเดอร์แท้ ไม่มีส่วนผสมของสารเคมีที่เป็นอันตรายต่อผิว',
            price: 390,
            salePrice: 350,
            discountPercentage: 10,
            memberPrice: 330,
            stock: 30,
            images: [
                { url: 'assets/img/products/shower1.jpg', alt: 'ครีมอาบน้ำกลิ่นลาเวนเดอร์' }
            ],
            category: categories[1],
            isFeatured: true,
            isNew: false,
            rating: 4.9,
            numReviews: 32
        },
        {
            _id: 'prod4',
            name: 'ครีมอาบน้ำสูตรเพิ่มความขาว',
            sku: 'SCRM002',
            description: 'ครีมอาบน้ำสูตรเพิ่มความขาวกระจ่างใส มีส่วนผสมของวิตามินซีและสารสกัดจากมะขามป้อมช่วยให้ผิวขาวกระจ่างใส ลดเลือนจุดด่างดำ ผิวนุ่มชุ่มชื้น',
            price: 420,
            salePrice: 0,
            discountPercentage: 0,
            memberPrice: 390,
            stock: 0,
            images: [
                { url: 'assets/img/products/shower2.jpg', alt: 'ครีมอาบน้ำสูตรเพิ่มความขาว' }
            ],
            category: categories[1],
            isFeatured: false,
            isNew: false,
            rating: 4.6,
            numReviews: 17
        },
        {
            _id: 'prod5',
            name: 'เซรั่มบำรุงผิวหน้าวิตามินซี',
            sku: 'SERUM001',
            description: 'เซรั่มบำรุงผิวหน้าที่มีส่วนผสมของวิตามินซีเข้มข้น ช่วยลดเลือนริ้วรอย จุดด่างดำ ทำให้ผิวหน้ากระจ่างใส เรียบเนียน เพิ่มความชุ่มชื้นให้แก่ผิว',
            price: 890,
            salePrice: 790,
            discountPercentage: 11,
            memberPrice: 750,
            stock: 20,
            images: [
                { url: 'assets/img/products/serum1.jpg', alt: 'เซรั่มบำรุงผิวหน้าวิตามินซี' }
            ],
            category: categories[2],
            isFeatured: true,
            isNew: true,
            rating: 4.7,
            numReviews: 42
        },
        {
            _id: 'prod6',
            name: 'เซรั่มน้ำนมข้าว',
            sku: 'SERUM002',
            description: 'เซรั่มน้ำนมข้าวสกัดจากข้าวหอมมะลิ ช่วยฟื้นฟูผิวให้แข็งแรง ลดการอักเสบ ทำให้ผิวนุ่มชุ่มชื้น เหมาะสำหรับผิวแห้งและแพ้ง่าย',
            price: 750,
            salePrice: 0,
            discountPercentage: 0,
            memberPrice: 700,
            stock: 15,
            images: [
                { url: 'assets/img/products/serum2.jpg', alt: 'เซรั่มน้ำนมข้าว' }
            ],
            category: categories[2],
            isFeatured: false,
            isNew: false,
            rating: 4.4,
            numReviews: 29
        },
        {
            _id: 'prod7',
            name: 'สบู่สมุนไพรขมิ้นชัน',
            sku: 'SOAP001',
            description: 'สบู่สมุนไพรขมิ้นชัน ผลิตจากสมุนไพรธรรมชาติ 100% ช่วยลดการอักเสบของผิว รักษาสิว ลดรอยแดงจากสิว ทำให้ผิวกระจ่างใส',
            price: 120,
            salePrice: 99,
            discountPercentage: 17,
            memberPrice: 90,
            stock: 50,
            images: [
                { url: 'assets/img/products/soap1.jpg', alt: 'สบู่สมุนไพรขมิ้นชัน' }
            ],
            category: categories[3],
            isFeatured: true,
            isNew: false,
            rating: 4.8,
            numReviews: 56
        },
        {
            _id: 'prod8',
            name: 'สบู่น้ำผึ้งผสมโยเกิร์ต',
            sku: 'SOAP002',
            description: 'สบู่น้ำผึ้งผสมโยเกิร์ต ช่วยทำความสะอาดผิวอย่างอ่อนโยน มอบความชุ่มชื้นให้แก่ผิว ทำให้ผิวนุ่มละมุน เหมาะสำหรับผู้ที่มีผิวแห้ง',
            price: 150,
            salePrice: 0,
            discountPercentage: 0,
            memberPrice: 135,
            stock: 40,
            images: [
                { url: 'assets/img/products/soap2.jpg', alt: 'สบู่น้ำผึ้งผสมโยเกิร์ต' }
            ],
            category: categories[3],
            isFeatured: false,
            isNew: true,
            rating: 4.5,
            numReviews: 38
        }
    ];
    
    /**
     * Get all products with optional filtering
     * @param {Object} options - Filter options
     * @param {string} options.category - Category ID or slug
     * @param {number} options.limit - Maximum number of products to return
     * @param {string} options.search - Search term
     * @param {string} options.sort - Sort option (price_asc, price_desc, name_asc, name_desc, newest)
     * @param {boolean} options.featured - Filter by featured products
     * @returns {Promise<Object>} Promise resolving to products data
     */
    function getAllProducts(options = {}) {
        return new Promise((resolve) => {
            // Apply a small delay to simulate network request
            setTimeout(() => {
                let filteredProducts = [...products];
                
                // Filter by category
                if (options.category) {
                    filteredProducts = filteredProducts.filter(product => 
                        product.category._id === options.category || 
                        product.category.slug === options.category
                    );
                }
                
                // Filter by search term
                if (options.search) {
                    const searchTerm = options.search.toLowerCase();
                    filteredProducts = filteredProducts.filter(product => 
                        product.name.toLowerCase().includes(searchTerm) || 
                        product.description.toLowerCase().includes(searchTerm)
                    );
                }
                
                // Filter by featured
                if (options.featured) {
                    filteredProducts = filteredProducts.filter(product => product.isFeatured);
                }
                
                // Sort products
                if (options.sort) {
                    switch (options.sort) {
                        case 'price_asc':
                            filteredProducts.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
                            break;
                        case 'price_desc':
                            filteredProducts.sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
                            break;
                        case 'name_asc':
                            filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
                            break;
                        case 'name_desc':
                            filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
                            break;
                        case 'newest':
                            filteredProducts.sort((a, b) => b.isNew - a.isNew);
                            break;
                        default:
                            break;
                    }
                }
                
                // Apply limit
                if (options.limit && options.limit > 0) {
                    filteredProducts = filteredProducts.slice(0, options.limit);
                }
                
                resolve({
                    success: true,
                    count: filteredProducts.length,
                    products: filteredProducts
                });
            }, 500);
        });
    }
    
    /**
     * Get a single product by ID
     * @param {string} productId - Product ID
     * @returns {Promise<Object>} Promise resolving to product data
     */
    function getProductById(productId) {
        return new Promise((resolve) => {
            // Apply a small delay to simulate network request
            setTimeout(() => {
                const product = products.find(p => p._id === productId);
                
                if (product) {
                    resolve({
                        success: true,
                        product
                    });
                } else {
                    resolve({
                        success: false,
                        message: 'Product not found'
                    });
                }
            }, 500);
        });
    }
    
    /**
     * Get all categories
     * @returns {Promise<Object>} Promise resolving to categories data
     */
    function getAllCategories() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    count: categories.length,
                    categories
                });
            }, 300);
        });
    }
    
    // Expose the mock API globally if in development mode
    if (isDevelopment) {
        window.mockApi = {
            isDevelopment,
            getAllProducts,
            getProductById,
            getAllCategories
        };
        
        console.log('Mock API initialized in development mode');
    }

    /* --- Temporarily Disable Mock API Fetch Override --- 
    // Override the global fetch function to intercept API calls
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
        console.log(`Mock API intercepted fetch: ${url}`);

        const urlString = url.toString();

        // Mock /api/products
        if (urlString.includes('/api/products') && !urlString.includes('/reviews')) {
            const params = new URLSearchParams(urlString.split('?')[1] || '');
            const queryOptions = {
                category: params.get('category'),
                limit: parseInt(params.get('limit'), 10) || 0,
                search: params.get('search'),
                sort: params.get('sort'),
                featured: params.has('featured')
            };
             console.log('Mocking /api/products with options:', queryOptions);
             return getAllProducts(queryOptions)
                     .then(data => new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } }));
        }

        // Mock /api/products/:id
        if (urlString.match(/\/api\/products\/([^\/]+)$/) && options?.method !== 'POST') {
            const productId = urlString.match(/\/api\/products\/([^\/]+)$/)[1];
            console.log(`Mocking /api/products/${productId}`);
             return getProductById(productId)
                     .then(data => new Response(JSON.stringify(data), { status: data.success ? 200 : 404, headers: { 'Content-Type': 'application/json' } }));
        }

        // Mock /api/categories
        if (urlString.includes('/api/categories')) {
            console.log('Mocking /api/categories');
             return getAllCategories()
                     .then(data => new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } }));
        }

        console.log('Mock API did not intercept, passing to original fetch');
        return originalFetch(url, options);
    };
    */ // --- End of Disabled Mock API Fetch Override ---

})(); // Immediately Invoked Function Expression 