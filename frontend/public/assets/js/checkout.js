document.addEventListener('DOMContentLoaded', function() {
    // API URL
    const API_URL = '/api';
    
    // Elements
    const steps = document.querySelectorAll('.step');
    const stepForms = document.querySelectorAll('[id^="step"]');
    
    // Navigation buttons
    const nextToShipping = document.getElementById('nextToShipping');
    const nextToPayment = document.getElementById('nextToPayment');
    const nextToReview = document.getElementById('nextToReview');
    const backToAddress = document.getElementById('backToAddress');
    const backToShipping = document.getElementById('backToShipping');
    const backToPayment = document.getElementById('backToPayment');
    const placeOrder = document.getElementById('placeOrder');
    
    // REVISED Elements for Order Summary
    const subtotalEl = document.getElementById('checkout-subtotal'); // Correct ID
    const shippingEl = document.getElementById('checkout-shipping'); // Correct ID
    // const taxEl = document.getElementById('tax'); // Commented out: No matching ID found in HTML for tax display
    const totalEl = document.getElementById('checkout-total');       // Correct ID
    
    // Form elements
    const paymentCards = document.querySelectorAll('.payment-method-card');
    const selectedPaymentMethod = document.getElementById('selectedPaymentMethod');
    
    // Review elements
    const reviewAddress = document.getElementById('reviewAddress');
    const reviewShipping = document.getElementById('reviewShipping');
    const reviewPayment = document.getElementById('reviewPayment');
    const reviewItems = document.getElementById('reviewItems');
    
    // Cart data
    let cartData = null;
    
    // // Load cart data // Comment out or remove the original call here
    // loadCart();
    
    // Event listeners
    if (nextToShipping) {
        nextToShipping.addEventListener('click', function() {
            if (validateAddressForm()) {
                goToStep(2);
            }
        });
    }
    
    if (nextToPayment) {
        nextToPayment.addEventListener('click', function() {
            goToStep(3);
        });
    }
    
    if (nextToReview) {
        nextToReview.addEventListener('click', function() {
            if (validatePaymentMethod()) {
                updateOrderReview();
                goToStep(4);
            }
        });
    }
    
    if (backToAddress) {
        backToAddress.addEventListener('click', function() {
            goToStep(1);
        });
    }
    
    if (backToShipping) {
        backToShipping.addEventListener('click', function() {
            goToStep(2);
        });
    }
    
    if (backToPayment) {
        backToPayment.addEventListener('click', function() {
            goToStep(3);
        });
    }
    
    if (placeOrder) {
        placeOrder.addEventListener('click', submitOrder);
    }
    
    // Setup shipping method change listeners
    document.querySelectorAll('input[name="shippingMethod"]').forEach(elem => {
        elem.addEventListener('change', updateOrderSummary);
    });
    
    // Setup payment method selection
    paymentCards.forEach(card => {
        card.addEventListener('click', function() {
            paymentCards.forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            selectedPaymentMethod.value = this.getAttribute('data-payment');
        });
    });
    
    // Functions
    function goToStep(stepNumber) {
        steps.forEach((step, index) => {
            if (index + 1 < stepNumber) {
                step.classList.remove('active');
                step.classList.add('completed');
            } else if (index + 1 === stepNumber) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else {
                step.classList.remove('active', 'completed');
            }
        });
        
        stepForms.forEach((form, index) => {
            if (index + 1 === stepNumber) {
                form.classList.remove('d-none');
            } else {
                form.classList.add('d-none');
            }
        });
    }
    
    function validateAddressForm() {
        const form = document.getElementById('addressForm');
        if (!form.checkValidity()) {
            // Trigger browser's native validation
            form.reportValidity();
            return false;
        }
        return true;
    }
    
    function validatePaymentMethod() {
        if (!selectedPaymentMethod.value) {
            alert('กรุณาเลือกวิธีการชำระเงิน');
            return false;
        }
        return true;
    }
    
    function updateOrderReview() {
        // Update shipping address
        const fullName = document.getElementById('fullName').value;
        const addressLine1 = document.getElementById('addressLine1').value;
        const addressLine2 = document.getElementById('addressLine2').value;
        const city = document.getElementById('city').value;
        const province = document.getElementById('province').value;
        const postalCode = document.getElementById('postalCode').value;
        const phoneNumber = document.getElementById('phoneNumber').value;
        
        let addressText = `${fullName}<br>${addressLine1}`;
        if (addressLine2) addressText += `<br>${addressLine2}`;
        addressText += `<br>${city}, ${province} ${postalCode}<br>โทร: ${phoneNumber}`;
        
        reviewAddress.innerHTML = addressText;
        
        // Update shipping method
        const shippingMethod = document.querySelector('input[name="shippingMethod"]:checked').value;
        const shippingMethodText = shippingMethod === 'standard' 
            ? 'จัดส่งแบบมาตรฐาน (3-5 วัน)' 
            : 'จัดส่งแบบด่วน (1-2 วัน)';
        
        reviewShipping.textContent = shippingMethodText;
        
        // Update payment method
        const paymentMethod = selectedPaymentMethod.value;
        let paymentMethodText = '';
        
        switch(paymentMethod) {
            case 'credit_card':
                paymentMethodText = 'บัตรเครดิต/เดบิต';
                break;
            case 'bank_transfer':
                paymentMethodText = 'โอนเงินผ่านธนาคาร';
                break;
            case 'promptpay':
                paymentMethodText = 'พร้อมเพย์';
                break;
            case 'cash_on_delivery':
                paymentMethodText = 'เก็บเงินปลายทาง';
                break;
        }
        
        reviewPayment.textContent = paymentMethodText;
        
        // Update cart items
        if (cartData && cartData.items && cartData.items.length > 0) {
            let itemsHtml = '';
            
            cartData.items.forEach(item => {
                // Use optional chaining and provide default image
                const imageUrl = item.product?.images?.[0] || 'assets/img/placeholder.jpg';
                const productName = item.product?.name || 'Unknown Product';
                const itemPrice = item.price || 0; // Use item price directly
                const itemQuantity = item.quantity || 0;

                itemsHtml += `
                <div class="d-flex mb-3">
                    <div class="flex-shrink-0" style="width: 60px; height: 60px;">
                        <img src="${imageUrl}"
                             class="img-fluid rounded" alt="${productName}" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <div class="flex-grow-1 ms-3">
                        <h6 class="mb-0">${productName}</h6>
                        <div class="d-flex justify-content-between">
                            <span class="text-muted small">จำนวน: ${itemQuantity}</span>
                            <span>฿${(itemPrice * itemQuantity).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                `;
            });
            
            reviewItems.innerHTML = itemsHtml;
        } else {
            // Use the new empty cart message function or keep simple text
            displayEmptyCartMessage(); // Or reviewItems.innerHTML = '<p class="text-muted text-center">ไม่มีสินค้าในตะกร้า</p>';
        }
    }
    
    // Helper function to get a cookie value by name
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            const cookieValue = parts.pop().split(';').shift();
            // Decode the cookie value in case it's URI encoded
             try {
                return decodeURIComponent(cookieValue);
             } catch (e) {
                 console.error(`Error decoding cookie "${name}":`, e);
                 return cookieValue; // Return raw value if decoding fails
             }
        }
        return null; // Return null if cookie not found
    }

    // REVISED: Function to check user login status
    function isUserLoggedIn() {
        // Check for the existence of the 'token' cookie used by the backend middleware
        const token = getCookie('token');
        console.log("Token cookie check:", token ? "Found" : "Not Found"); // Keep for debugging
        return token !== null && token !== ''; // Returns true if the 'token' cookie exists and is not empty
    }
    
    // NEW: Function to load cart from localStorage for guests
    function loadCartFromLocalStorage() {
        try {
            const localCart = getCart(); // Use function from cart.js (ensure cart.js is loaded first)
            if (localCart && localCart.length > 0) {
                // Convert localStorage format to the format needed by checkout.js
                cartData = {
                    items: localCart.map(item => ({
                        product: {
                            _id: item.id,       // Use localStorage item id
                            name: item.name,
                            images: item.image ? [item.image] : ['assets/img/placeholder.jpg'], // Handle missing image
                            price: item.price    // Include product price if available/needed
                        },
                        quantity: item.quantity,
                        price: item.price        // Price per item
                    }))
                };
                console.log('Cart loaded from localStorage:', cartData);
                updateOrderSummary();
                updateOrderReview();
            } else {
                // Cart is empty
                cartData = { items: [] };
                console.log('Cart is empty (loaded from localStorage).');
                updateOrderSummary();
                updateOrderReview();
                displayEmptyCartMessage();
            }
        } catch (error) {
            console.error('Error loading cart from localStorage:', error);
            cartData = { items: [] }; // Default to empty cart on error
            updateOrderSummary();
            updateOrderReview();
            displayEmptyCartMessage();
        }
    }
    
    // REVISED: Load cart data based on login status
    async function loadCart() {
        const loggedIn = isUserLoggedIn();

        if (loggedIn) {
            // User is logged in - try loading from API
            try {
                const response = await fetch(`${API_URL}/shop/cart`); // Assuming API endpoint exists
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`API Error ${response.status}: ${errorText}`);
                    throw new Error(`Failed to load cart from API (status: ${response.status})`);
                }
                const data = await response.json();
                if (data.status === 'success' && data.data && data.data.items) {
                    cartData = data.data; // API should return data in the expected format
                    console.log('Cart loaded from API:', cartData);
                    updateOrderSummary();
                    updateOrderReview();
                } else {
                    // Handle cases where API call succeeded but data is not as expected
                    console.warn('API returned success status but cart data is missing or invalid:', data);
                    // Fallback to localStorage or show error? For now, treat as empty.
                    loadCartFromLocalStorage(); // Fallback to localStorage if API data is bad
                    // throw new Error(data.message || 'Invalid cart data received from API');
                }
            } catch (error) {
                console.error('Error loading cart from API, falling back to localStorage:', error);
                // Fallback to localStorage if API fails
                loadCartFromLocalStorage();
            }
        } else {
            // User is not logged in - load from localStorage
            console.log('User not logged in, loading cart from localStorage.');
            loadCartFromLocalStorage();
        }
    }
    
    // NEW: Function to display empty cart message and update UI
    function displayEmptyCartMessage() {
        const summaryList = document.getElementById('checkout-summary-list');
        const reviewItemsContainer = document.getElementById('reviewItems'); // Target container for items
        const placeOrderButton = document.getElementById('place-order-button') || document.getElementById('placeOrder'); // Get the correct button ID
        const checkoutFormContainer = document.querySelector('.checkout-form'); // Get main form container

        // Update summary list
        if (summaryList) {
            summaryList.innerHTML = '<li class="list-group-item text-center text-muted">ตะกร้าสินค้าของคุณว่างเปล่า</li>';
        }

        // Update review items section
        if (reviewItemsContainer) {
            reviewItemsContainer.innerHTML = '<p class="text-center text-muted py-3">ไม่มีสินค้าในตะกร้า</p>';
        }

        // Update total amounts in summary
        if (subtotalEl) subtotalEl.textContent = '฿0.00';
        if (shippingEl) shippingEl.textContent = '฿0.00';
        if (totalEl) totalEl.textContent = '฿0.00';

        // Disable place order button
        if (placeOrderButton) {
            placeOrderButton.disabled = true;
            placeOrderButton.textContent = 'ตะกร้าว่างเปล่า'; // Change button text
            placeOrderButton.classList.add('disabled', 'btn-secondary'); // Add classes for styling
            placeOrderButton.classList.remove('btn-success');
        }

        // Optionally hide parts of the checkout form or show a message
        if (checkoutFormContainer) {
            // Example: Hide the form steps if cart is empty
            // const stepsContainer = checkoutFormContainer.querySelector('.checkout-steps');
            // const stepForms = checkoutFormContainer.querySelectorAll('.checkout-step-form');
            // if(stepsContainer) stepsContainer.style.display = 'none';
            // stepForms.forEach(form => form.style.display = 'none');
            // Add a message indicating the cart is empty maybe?
            // const emptyCartMsgDiv = document.createElement('div');
            // emptyCartMsgDiv.className = 'alert alert-warning text-center';
            // emptyCartMsgDiv.textContent = 'กรุณาเพิ่มสินค้าลงในตะกร้าก่อนทำการสั่งซื้อ';
            // checkoutFormContainer.prepend(emptyCartMsgDiv); // Add message at the top
        }
        console.log('Displayed empty cart message and disabled checkout.');
    }
    
    function updateOrderSummary() {
        // Ensure cartData and items exist before proceeding
        if (!cartData || !cartData.items || cartData.items.length === 0) {
            console.log('updateOrderSummary called with empty or invalid cartData.');
            // Use the empty cart display logic if cart is empty here too
            displayEmptyCartMessage(); // Ensure summary reflects empty cart
            // Set totals to 0 explicitly as well
            if (subtotalEl) subtotalEl.textContent = '฿0.00';
            if (shippingEl) shippingEl.textContent = '฿0.00';
            // if (taxEl) taxEl.textContent = '฿0.00'; // No tax element
            if (totalEl) totalEl.textContent = '฿0.00';
            return; // Stop further calculation
        }

        // Calculate subtotal from cartData.items
        const subtotal = cartData.items.reduce((total, item) => {
            const itemPrice = item.price || 0;
            const itemQuantity = item.quantity || 0;
            return total + (itemPrice * itemQuantity);
        }, 0);

        // Get shipping cost
        const shippingMethodInput = document.querySelector('input[name="shippingMethod"]:checked');
        // Assuming cost is stored in data attributes or fixed values in HTML labels
         // Let's get cost from the label text for simplicity if data-cost is not set
         const standardShippingLabel = document.querySelector('label[for="standardShipping"]')?.textContent || '';
         const expressShippingLabel = document.querySelector('label[for="expressShipping"]')?.textContent || '';

         // Function to extract cost from label text like "... - ฿50.00"
         const getCostFromLabel = (label) => {
              const match = label.match(/฿([\d,]+\.?\d*)/);
              return match ? parseFloat(match[1].replace(/,/g, '')) : 0;
          };

         const standardShippingCost = getCostFromLabel(standardShippingLabel) || 50; // Fallback to 50
         const expressShippingCost = getCostFromLabel(expressShippingLabel) || 100; // Fallback to 100


        let shippingCost = standardShippingCost; // Default to standard
        if (shippingMethodInput) {
            shippingCost = shippingMethodInput.value === 'express' ? expressShippingCost : standardShippingCost;
        } else {
            console.warn("Shipping method radio button not found or not checked. Using default.");
            // Optionally select standard shipping visually
             const standardRadio = document.getElementById('standardShipping');
             if (standardRadio) standardRadio.checked = true;
        }

        // Calculate tax (example: 7% VAT)
        let tax = Math.round(subtotal * 0.07); // Calculate tax value

        // Calculate total (includes tax)
        const total = subtotal + tax + shippingCost;

        // Update display elements using corrected selectors
        if (subtotalEl) {
            subtotalEl.textContent = `฿${subtotal.toFixed(2)}`;
        } else {
            console.warn("Subtotal element (#checkout-subtotal) not found in HTML.");
        }

        if (shippingEl) {
            shippingEl.textContent = `฿${shippingCost.toFixed(2)}`;
        } else {
            console.warn("Shipping element (#checkout-shipping) not found in HTML.");
        }

        // Do not attempt to update taxEl as it doesn't exist
        // console.log(`Calculated Tax (not displayed): ฿${tax.toFixed(2)}`);

        if (totalEl) {
            totalEl.textContent = `฿${total.toFixed(2)}`;
        } else {
            console.warn("Total element (#checkout-total) not found in HTML.");
        }

        // Re-enable order button if cart is not empty
        const placeOrderButton = document.getElementById('place-order-button') || document.getElementById('placeOrder'); // Check both possible IDs
        if(placeOrderButton && cartData.items.length > 0) {
            placeOrderButton.disabled = false;
            // Ensure correct button text is restored (check HTML for original text)
             placeOrderButton.textContent = document.getElementById('place-order-button') ? 'สั่งซื้อสินค้า' : 'ยืนยันการสั่งซื้อ';
            placeOrderButton.classList.remove('disabled', 'btn-secondary');
            // Ensure correct success class is added (check HTML)
             placeOrderButton.classList.add(document.getElementById('place-order-button') ? 'btn-success' : 'btn-primary');
        } else if (placeOrderButton) {
            // Explicitly disable if cart becomes empty after initial load
            displayEmptyCartMessage();
        }
    }
    
    async function submitOrder() {
        // Disable the button to prevent multiple submissions
        // Use the correct button ID from the form step ('place-order-btn') or summary ('place-order-button')
         const submitBtn = document.getElementById('place-order-btn') || document.getElementById('place-order-button');
         if (submitBtn) {
             submitBtn.disabled = true;
             submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>กำลังทำรายการ...';
         } else {
              console.error("Submit button not found!");
              return; // Stop if button not found
         }

        const loggedIn = isUserLoggedIn();

        try {
            // Collect common order data first
            const shippingAddress = {
                // Use correct IDs from HTML form: address, address2, province, district, postalCode, phone
                // Note: HTML seems to have firstName, lastName, email, phone in a separate "customer-info-form" (step 1)
                // And address fields in "shipping-address-form" (step 2). Need to collect from both if they are separate steps.
                // Let's assume step 1 fields are stored or passed somehow, or we collect them here if visible.
                fullName: `${document.getElementById('firstName')?.value || ''} ${document.getElementById('lastName')?.value || ''}`.trim(), // Combine first/last name
                addressLine1: document.getElementById('address')?.value || '',
                addressLine2: document.getElementById('address2')?.value || '',
                // city: ??? - Need city input in HTML - using district for now
                city: document.getElementById('district')?.value || '', // Assuming district is city equivalent here
                province: document.getElementById('province')?.value || '',
                postalCode: document.getElementById('postalCode')?.value || '',
                phoneNumber: document.getElementById('phone')?.value || '', // Get phone from step 1 form
                email: document.getElementById('email')?.value || '' // Get email from step 1 form
            };

            // Basic validation for required fields before proceeding
            if (!shippingAddress.fullName || !shippingAddress.addressLine1 || !shippingAddress.city || !shippingAddress.province || !shippingAddress.postalCode || !shippingAddress.phoneNumber || !shippingAddress.email) {
                alert('กรุณากรอกข้อมูลลูกค้าและที่อยู่จัดส่งให้ครบถ้วน');
                submitBtn.disabled = false;
                submitBtn.innerHTML = document.getElementById('place-order-button') ? 'สั่งซื้อสินค้า' : 'ยืนยันการสั่งซื้อ';
                return;
            }

            const orderData = {
                shippingAddress: shippingAddress,
                // Get shippingMethod using value from radio button (standard/express)
                shippingMethod: document.querySelector('input[name="shippingMethod"]:checked')?.value || 'standard',
                // Get paymentMethod using value from radio button (credit/banking/promptpay)
                paymentMethod: document.querySelector('input[name="paymentMethod"]:checked')?.value || '',
                // Note: HTML has id 'orderNote', but it's not visible in the provided snippet. Add if needed.
                note: document.getElementById('orderNote')?.value || '',
                // Include cart items if it's a guest order and API needs them
                // For logged-in users, API might get cart from session/backend
                items: (!loggedIn && cartData && cartData.items) ? cartData.items.map(item => ({ // Map to expected API format if needed
                    productId: item.product._id,
                    quantity: item.quantity,
                    price: item.price // Send price at time of order
                })) : undefined // Don't send items if logged in (API gets from backend) or cart is empty
            };

            // Add customer details for guest checkout if API requires it
            if (!loggedIn) {
                orderData.customerDetails = {
                    firstName: document.getElementById('firstName')?.value || '',
                    lastName: document.getElementById('lastName')?.value || '',
                    email: document.getElementById('email')?.value || '',
                    phone: document.getElementById('phone')?.value || '',
                    // Handle account creation intention
                    createAccount: document.getElementById('createAccount')?.checked || false,
                    password: document.getElementById('createAccount')?.checked ? document.getElementById('password')?.value : undefined
                };
                // Basic validation for password if createAccount is checked
                if (orderData.customerDetails.createAccount) {
                    const password = document.getElementById('password')?.value;
                    const confirmPassword = document.getElementById('confirmPassword')?.value;
                    if (!password || password !== confirmPassword) {
                        alert('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน หรือไม่ได้กรอก');
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = document.getElementById('place-order-button') ? 'สั่งซื้อสินค้า' : 'ยืนยันการสั่งซื้อ';
                        return;
                    }
                }
            }

            // Determine API endpoint based on login status (if different endpoints exist)
            const orderApiUrl = loggedIn ? `${API_URL}/shop/orders` : `${API_URL}/shop/guest-orders`; // Example: use a different endpoint for guests

            // Check if payment method is selected
            if (!orderData.paymentMethod) {
                alert('กรุณาเลือกวิธีการชำระเงิน');
                submitBtn.disabled = false;
                submitBtn.innerHTML = document.getElementById('place-order-button') ? 'สั่งซื้อสินค้า' : 'ยืนยันการสั่งซื้อ';
                return;
            }

            // Make API call to create order
            const response = await fetch(orderApiUrl, { // Use determined URL
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // REVISED: Add authorization header using cookie check
                    ...(loggedIn && getCookie('token') ? { 'Authorization': `Bearer ${getCookie('token')}` } : {})
                },
                body: JSON.stringify(orderData)
            });

            const result = await response.json();

            if (response.ok && result.status === 'success') {
                // Order successful
                // Clear local cart for guest users AFTER successful order
                if (!loggedIn) {
                    clearCart(); // Call clearCart from cart.js
                }
                // Redirect to order confirmation page
                window.location.href = `/order-confirmation.html?orderId=${result.data._id}`; // Use the actual order ID from response
            } else {
                // Handle error from API
                alert(`เกิดข้อผิดพลาดในการสั่งซื้อ: ${result.message || 'กรุณาลองใหม่อีกครั้ง'}`);
                submitBtn.disabled = false;
                submitBtn.innerHTML = document.getElementById('place-order-button') ? 'สั่งซื้อสินค้า' : 'ยืนยันการสั่งซื้อ';
            }
        } catch (error) {
            console.error('Error submitting order:', error);
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อสั่งซื้อ กรุณาลองใหม่อีกครั้ง');
            submitBtn.disabled = false;
            submitBtn.innerHTML = document.getElementById('place-order-button') ? 'สั่งซื้อสินค้า' : 'ยืนยันการสั่งซื้อ';
        }
    }

    // --- Initialize ---
    document.addEventListener('DOMContentLoaded', function() {
        // Select elements inside DOMContentLoaded to ensure they are found
        const createAccountCheckbox = document.getElementById('createAccount');
        const passwordFields = document.getElementById('password-fields');
        const customerInfoForm = document.getElementById('customer-info-form'); // Step 1 form container
        const shippingAddressForm = document.getElementById('shipping-address-form'); // Step 2 form container
        const paymentMethodForm = document.getElementById('payment-method-form'); // Step 3 form container

        // Check login status and adjust UI accordingly
        if (!isUserLoggedIn()) {
            console.log("Setting up UI for guest user.");
            // Guest user: Show 'Create Account' option
            if (createAccountCheckbox) {
                createAccountCheckbox.parentElement.style.display = 'block'; // Ensure the form-check div is visible
            } else {
                console.warn("Create account checkbox not found.");
            }

            if (passwordFields) {
                passwordFields.style.display = 'none'; // Hide password fields initially
                // Add event listener for the checkbox
                if (createAccountCheckbox) {
                    createAccountCheckbox.addEventListener('change', function() {
                        passwordFields.style.display = this.checked ? 'block' : 'none';
                        const passwordInput = document.getElementById('password');
                        const confirmPasswordInput = document.getElementById('confirmPassword');
                        // Add/remove 'required' based on checkbox state
                        if (passwordInput) passwordInput.required = this.checked;
                        if (confirmPasswordInput) confirmPasswordInput.required = this.checked;
                    });
                }
            } else {
                console.warn("Password fields container not found.");
            }

            // Make sure customer info fields are clear for guest (no pre-fill)
            document.getElementById('customer-form')?.reset(); // Reset step 1 form if it exists

        } else {
            console.log("Setting up UI for logged-in user.");
            // Logged-in user: Hide 'Create Account' option
            if (createAccountCheckbox) {
                createAccountCheckbox.parentElement.style.display = 'none';
            } else {
                console.warn("Create account checkbox not found (for hiding).");
            }
            // Optionally: Fetch user data and pre-fill forms
            // fetchUserDataAndFillForm(); // You would need to implement this function
            // Example:
            // fetch('/api/user/profile').then(res => res.json()).then(data => {
            //     if(data.success) {
            //         document.getElementById('firstName').value = data.user.firstName;
            //         document.getElementById('lastName').value = data.user.lastName;
            //         document.getElementById('email').value = data.user.email;
            //         // ... pre-fill address if available ...
            //     }
            // });
        }

        // Load cart data (must be called after DOM is ready and isUserLoggedIn is defined)
        loadCart();

        // Add event listeners for step navigation (using the correct IDs from HTML)
        const customerInfoNextBtn = document.getElementById('customer-info-next');
        const shippingPrevBtn = document.getElementById('shipping-prev');
        const shippingNextBtn = document.getElementById('shipping-next');
        const paymentPrevBtn = document.getElementById('payment-prev');
        const placeOrderBtn = document.getElementById('place-order-btn'); // Correct ID for final submit in payment step
        const placeOrderButtonSummary = document.getElementById('place-order-button'); // Button in summary section

        // --- Step Navigation Logic ---
        // Example using the provided HTML structure with 3 steps
        // Step 1 -> Step 2
        if (customerInfoNextBtn) {
            customerInfoNextBtn.addEventListener('click', () => {
                // Validate Step 1 form before proceeding
                const form = document.getElementById('customer-form');
                if (form && form.checkValidity()) {
                    if (isUserLoggedIn() || !document.getElementById('createAccount').checked || validatePasswordMatch()) { // Check password match if creating account
                        goToStepNew(2);
                    }
                } else if (form) {
                    form.reportValidity(); // Show native validation errors
                } else {
                    goToStepNew(2); // Allow proceeding if form not found (should not happen)
                }
            });
        }

        // Step 2 -> Step 1
        if (shippingPrevBtn) {
            shippingPrevBtn.addEventListener('click', () => goToStepNew(1));
        }

        // Step 2 -> Step 3
        if (shippingNextBtn) {
            shippingNextBtn.addEventListener('click', () => {
                // Validate Step 2 form
                const form = document.getElementById('shipping-form');
                if (form && form.checkValidity()) {
                    goToStepNew(3);
                } else if (form) {
                    form.reportValidity();
                } else {
                    goToStepNew(3);
                }
            });
        }

        // Step 3 -> Step 2
        if (paymentPrevBtn) {
            paymentPrevBtn.addEventListener('click', () => goToStepNew(2));
        }

        // Step 3 - Place Order (using form submit or button click)
        const paymentForm = document.getElementById('payment-form');
        if (paymentForm) {
            paymentForm.addEventListener('submit', (event) => {
                event.preventDefault(); // Prevent default form submission
                // Validate payment method selection and terms checkbox
                const paymentMethodSelected = document.querySelector('input[name="paymentMethod"]:checked');
                const termsCheckbox = document.getElementById('terms');

                if (!paymentMethodSelected) {
                    alert('กรุณาเลือกวิธีการชำระเงิน');
                    return;
                }
                if (paymentMethodSelected.value === 'credit' && !validateCreditCardForm()) { // Add validation for CC if selected
                    return;
                }
                if (!termsCheckbox || !termsCheckbox.checked) {
                    alert('กรุณายอมรับเงื่อนไขการใช้บริการและนโยบายความเป็นส่วนตัว');
                    termsCheckbox?.focus(); // Focus the checkbox if it exists
                    return;
                }

                // If all validations pass, submit the order
                submitOrder();
            });
        }

        // Also handle click on the summary section's order button if it's separate
        if (placeOrderButtonSummary && placeOrderButtonSummary !== placeOrderBtn) {
            placeOrderButtonSummary.addEventListener('click', (event) => {
                event.preventDefault();
                // Trigger the submit event on the actual payment form
                paymentForm?.requestSubmit(); // Use requestSubmit for better form handling
                // Alternatively, manually check validity and call submitOrder
                // if (paymentForm && paymentForm.checkValidity() && ...) { submitOrder(); }
            });
        }

        // Helper function for step navigation based on the 3-step structure in HTML
        function goToStepNew(stepNumber) {
            const steps = document.querySelectorAll('.checkout-steps .step');
            const stepForms = [customerInfoForm, shippingAddressForm, paymentMethodForm]; // Array of form containers

            steps.forEach((step, index) => {
                step.classList.remove('active', 'completed');
                if (index + 1 < stepNumber) {
                    step.classList.add('completed');
                } else if (index + 1 === stepNumber) {
                    step.classList.add('active');
                }
            });

            stepForms.forEach((form, index) => {
                if (form) { // Check if form element exists
                    form.style.display = (index + 1 === stepNumber) ? 'block' : 'none';
                }
            });
            window.scrollTo(0, 0); // Scroll to top when changing steps
        }

        // Initial setup: show step 1
        goToStepNew(1);

        // Add listeners for payment method changes (to show/hide specific forms like CC, Bank Transfer)
        const paymentMethodRadios = document.querySelectorAll('input[name="paymentMethod"]');
        const creditCardFormDiv = document.getElementById('credit-card-form');
        const bankTransferInfoDiv = document.getElementById('bank-transfer-info');
        const promptpayInfoDiv = document.getElementById('promptpay-info');

        paymentMethodRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                const selectedValue = this.value;
                if (creditCardFormDiv) creditCardFormDiv.style.display = (selectedValue === 'credit') ? 'block' : 'none';
                if (bankTransferInfoDiv) bankTransferInfoDiv.style.display = (selectedValue === 'banking') ? 'block' : 'none';
                if (promptpayInfoDiv) promptpayInfoDiv.style.display = (selectedValue === 'promptpay') ? 'block' : 'none';

                // Add/remove required attributes for credit card fields
                const cardNameInput = document.getElementById('cardName');
                const cardNumberInput = document.getElementById('cardNumber');
                const expiryDateInput = document.getElementById('expiryDate');
                const cvvInput = document.getElementById('cvv');

                const isCreditCard = selectedValue === 'credit';
                if(cardNameInput) cardNameInput.required = isCreditCard;
                if(cardNumberInput) cardNumberInput.required = isCreditCard;
                if(expiryDateInput) expiryDateInput.required = isCreditCard;
                if(cvvInput) cvvInput.required = isCreditCard;

            });
        });
        // Trigger change event initially to set correct display based on default checked radio
        document.querySelector('input[name="paymentMethod"]:checked')?.dispatchEvent(new Event('change'));

        // Add helper function for password match validation
        function validatePasswordMatch() {
            const passwordInput = document.getElementById('password');
            const confirmPasswordInput = document.getElementById('confirmPassword');
            if (passwordInput && confirmPasswordInput && passwordInput.value !== confirmPasswordInput.value) {
                alert('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
                confirmPasswordInput.focus();
                return false;
            }
            return true;
        }

        // Add helper function for basic credit card form validation (expand as needed)
        function validateCreditCardForm() {
            const cardName = document.getElementById('cardName')?.value;
            const cardNumber = document.getElementById('cardNumber')?.value;
            const expiryDate = document.getElementById('expiryDate')?.value;
            const cvv = document.getElementById('cvv')?.value;

            if (!cardName || !cardNumber || !expiryDate || !cvv) {
                alert('กรุณากรอกข้อมูลบัตรเครดิตให้ครบถ้วน');
                return false;
            }
            // Add more specific validation (e.g., Luhn algorithm for card number, date format, CVV length) if desired
            return true;
        }

        // Add listeners for shipping method changes to update summary
        document.querySelectorAll('input[name="shippingMethod"]').forEach(radio => {
            radio.addEventListener('change', updateOrderSummary);
        });

        // Add listener for discount code input/button if needed
        // ...

    }); // End of DOMContentLoaded
}); 