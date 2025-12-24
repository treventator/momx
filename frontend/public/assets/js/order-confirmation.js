document.addEventListener('DOMContentLoaded', function() {
    // API URL
    const API_URL = '/api';
    
    // Get order ID from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    
    // Order elements
    const orderNumberEl = document.getElementById('orderNumber');
    const orderDateEl = document.getElementById('orderDate');
    const orderItemsEl = document.getElementById('orderItems');
    const subtotalEl = document.getElementById('subtotal');
    const shippingEl = document.getElementById('shipping');
    const taxEl = document.getElementById('tax');
    const totalEl = document.getElementById('total');
    const shippingAddressEl = document.getElementById('shippingAddress');
    const shippingMethodEl = document.getElementById('shippingMethod');
    const paymentMethodEl = document.getElementById('paymentMethod');
    const paymentInstructionsEl = document.getElementById('paymentInstructions');
    
    // Status step elements
    const paymentStepEl = document.getElementById('paymentStep');
    const processingStepEl = document.getElementById('processingStep');
    const shippedStepEl = document.getElementById('shippedStep');
    const deliveredStepEl = document.getElementById('deliveredStep');
    const trackingInfoEl = document.getElementById('trackingInfo');
    const trackingNumberEl = document.getElementById('trackingNumber');
    const trackingLinkEl = document.getElementById('trackingLink');
    
    // Load order details
    if (orderId) {
        loadOrderDetails(orderId);
    } else {
        // For demo purposes, show mock data if no order ID is provided
        showMockOrderData();
    }
    
    async function loadOrderDetails(id) {
        try {
            const response = await fetch(`${API_URL}/shop/orders/${id}`);
            
            if (!response.ok) {
                throw new Error('Failed to load order details');
            }
            
            const data = await response.json();
            
            if (data.status === 'success' && data.data) {
                displayOrderDetails(data.data);
            }
        } catch (error) {
            console.error('Error loading order details:', error);
            // For demo purposes, use mock data if API fails
            showMockOrderData();
        }
    }
    
    function showMockOrderData() {
        // Mock order data for testing
        const mockOrder = {
            _id: '614c5ab29b15b33e40b11e21',
            orderNumber: 'TY2408100123',
            createdAt: '2024-08-15T03:30:45.000Z',
            status: 'pending',
            isPaid: false,
            isDelivered: false,
            orderItems: [
                {
                    name: 'แชมพูออแกนิค',
                    qty: 2,
                    image: 'assets/img/IMG_5759 2.jpg',
                    price: 250,
                    subtotal: 500
                },
                {
                    name: 'ครีมอาบน้ำ',
                    qty: 1,
                    image: 'assets/img/S__10067985_0.jpg',
                    price: 200,
                    subtotal: 200
                }
            ],
            shippingAddress: {
                fullName: 'ธนา ใจดี',
                addressLine1: '123 หมู่ 4 ถ.พหลโยธิน',
                addressLine2: '',
                city: 'คลองหลวง',
                province: 'ปทุมธานี',
                postalCode: '12120',
                phoneNumber: '081-234-5678'
            },
            paymentMethod: 'bank_transfer',
            shippingMethod: 'standard',
            itemsPrice: 700,
            taxPrice: 49,
            shippingPrice: 60,
            totalPrice: 809
        };
        
        displayOrderDetails(mockOrder);
    }
    
    function displayOrderDetails(order) {
        // Display order number and date
        orderNumberEl.textContent = order.orderNumber || `TY${order._id.substring(0, 8)}`;
        
        const orderDate = new Date(order.createdAt);
        const formattedDate = new Intl.DateTimeFormat('th-TH', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(orderDate);
        
        orderDateEl.textContent = formattedDate;
        
        // Display order items
        let itemsHtml = '';
        
        order.orderItems.forEach(item => {
            itemsHtml += `
            <div class="d-flex mb-3">
                <div class="flex-shrink-0" style="width: 60px; height: 60px;">
                    <img src="${item.image || 'assets/img/placeholder.jpg'}" 
                         class="img-fluid rounded" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div class="flex-grow-1 ms-3">
                    <h6 class="mb-0">${item.name}</h6>
                    <div class="d-flex justify-content-between">
                        <span class="text-muted small">จำนวน: ${item.qty}</span>
                        <span>฿${item.subtotal.toFixed(2)}</span>
                    </div>
                </div>
            </div>
            `;
        });
        
        orderItemsEl.innerHTML = itemsHtml;
        
        // Display prices
        subtotalEl.textContent = `฿${order.itemsPrice.toFixed(2)}`;
        shippingEl.textContent = `฿${order.shippingPrice.toFixed(2)}`;
        taxEl.textContent = `฿${order.taxPrice.toFixed(2)}`;
        totalEl.textContent = `฿${order.totalPrice.toFixed(2)}`;
        
        // Display shipping address
        let addressText = `${order.shippingAddress.fullName}<br>${order.shippingAddress.addressLine1}`;
        if (order.shippingAddress.addressLine2) {
            addressText += `<br>${order.shippingAddress.addressLine2}`;
        }
        addressText += `<br>${order.shippingAddress.city}, ${order.shippingAddress.province} ${order.shippingAddress.postalCode}<br>โทร: ${order.shippingAddress.phoneNumber}`;
        
        shippingAddressEl.innerHTML = addressText;
        
        // Display shipping method
        const shippingMethodText = order.shippingMethod === 'standard' 
            ? 'จัดส่งแบบมาตรฐาน (3-5 วัน)' 
            : 'จัดส่งแบบด่วน (1-2 วัน)';
        
        shippingMethodEl.textContent = shippingMethodText;
        
        // Display payment method
        let paymentMethodText = '';
        
        switch(order.paymentMethod) {
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
        
        paymentMethodEl.textContent = paymentMethodText;
        
        // Update order status steps
        updateOrderStatusDisplay(order);
    }
    
    function updateOrderStatusDisplay(order) {
        // Update payment step
        if (order.isPaid) {
            paymentStepEl.classList.remove('active');
            paymentStepEl.classList.add('completed');
            paymentStepEl.querySelector('.timeline-step-circle').innerHTML = '<i class="fa fa-check"></i>';
            paymentStepEl.querySelector('h6').textContent = 'ชำระเงินแล้ว';
            paymentInstructionsEl.innerHTML = `<p class="text-muted mb-0"><small>ชำระเมื่อ ${new Date(order.paidAt).toLocaleString('th-TH')}</small></p>`;
            
            // If paid, activate processing step
            processingStepEl.classList.add('active');
        } else {
            // Show payment instructions based on payment method
            if (order.paymentMethod === 'bank_transfer') {
                paymentInstructionsEl.innerHTML = `
                <div class="alert alert-info mt-2 mb-0">
                    <p class="mb-2"><small>โอนเงินมาที่:</small></p>
                    <p class="mb-1"><small>ธนาคารกสิกรไทย</small></p>
                    <p class="mb-1"><small>เลขที่บัญชี: 123-4-56789-0</small></p>
                    <p class="mb-1"><small>ชื่อบัญชี: บริษัท ธัญรัตน์ จำกัด</small></p>
                    <p class="mb-2"><small>จำนวนเงิน: ฿${order.totalPrice.toFixed(2)}</small></p>
                    <p class="mb-0"><small>หลังจากโอนเงินแล้ว กรุณาส่งสลิปมาที่ Line: @tanyarat หรืออีเมล info@tanyarat.online</small></p>
                </div>
                `;
            } else if (order.paymentMethod === 'promptpay') {
                paymentInstructionsEl.innerHTML = `
                <div class="alert alert-info mt-2 mb-0">
                    <p class="mb-2"><small>สแกน QR Code เพื่อชำระเงิน:</small></p>
                    <div class="text-center mb-2" id="promptpayQRContainer">
                        <div class="spinner-border spinner-border-sm text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </div>
                    <p class="mb-0"><small>หลังจากชำระเงินแล้ว กรุณาส่งสลิปมาที่ Line: @tanyarat</small></p>
                </div>
                `;
                
                // Fetch PromptPay QR code from API
                fetch(`${API_URL}/payment/promptpay/qr?amount=${order.totalPrice}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success && data.data.qrCode) {
                        // Display QR code
                        document.getElementById('promptpayQRContainer').innerHTML = `
                            <img src="${data.data.qrCode}" alt="PromptPay QR Code" class="img-fluid" style="max-width: 200px;">
                            <p class="mt-2 mb-0"><small>พร้อมเพย์: ${data.data.accountNumber}</small></p>
                            <p class="mb-0"><small>ชื่อบัญชี: ${data.data.accountName}</small></p>
                            <p class="mb-0"><small>จำนวนเงิน: ฿${data.data.amount}</small></p>
                        `;
                    } else {
                        // Show error or placeholder
                        document.getElementById('promptpayQRContainer').innerHTML = `
                            <img src="assets/img/qr-code-placeholder.png" alt="PromptPay QR Code" class="img-fluid" style="max-width: 200px;">
                            <p class="mt-2 mb-0 text-danger"><small>ไม่สามารถสร้าง QR Code ได้ กรุณาติดต่อร้านค้า</small></p>
                        `;
                    }
                })
                .catch(error => {
                    console.error('Error generating QR code:', error);
                    // Show placeholder
                    document.getElementById('promptpayQRContainer').innerHTML = `
                        <img src="assets/img/qr-code-placeholder.png" alt="PromptPay QR Code" class="img-fluid" style="max-width: 200px;">
                        <p class="mt-2 mb-0"><small>พร้อมเพย์: 081-234-5678</small></p>
                        <p class="mb-0"><small>ชื่อบัญชี: บริษัท ธัญรัตน์ จำกัด</small></p>
                        <p class="mb-0"><small>จำนวนเงิน: ฿${order.totalPrice.toFixed(2)}</small></p>
                    `;
                });
            } else if (order.paymentMethod === 'cash_on_delivery') {
                paymentInstructionsEl.innerHTML = `
                <p class="text-muted mb-0"><small>ชำระเงินเมื่อได้รับสินค้า จำนวน ฿${order.totalPrice.toFixed(2)}</small></p>
                `;
                // For COD, skip payment step
                paymentStepEl.classList.remove('active');
                paymentStepEl.classList.add('completed');
                paymentStepEl.querySelector('.timeline-step-circle').innerHTML = '<i class="fa fa-check"></i>';
                processingStepEl.classList.add('active');
            }
        }
        
        // Update processing step
        if (order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered') {
            processingStepEl.classList.remove('active');
            processingStepEl.classList.add('completed');
            processingStepEl.querySelector('.timeline-step-circle').innerHTML = '<i class="fa fa-check"></i>';
            
            // If processing complete, activate shipped step
            if (order.status === 'shipped' || order.status === 'delivered') {
                shippedStepEl.classList.add('active');
            }
        }
        
        // Update shipped step
        if (order.shippingInfo && order.shippingInfo.trackingNumber) {
            trackingNumberEl.textContent = order.shippingInfo.trackingNumber;
            
            // Set tracking link based on carrier
            let trackingUrl = '#';
            if (order.shippingInfo.carrier === 'thailandpost') {
                trackingUrl = `https://track.thailandpost.co.th/?trackNumber=${order.shippingInfo.trackingNumber}`;
            } else if (order.shippingInfo.carrier === 'kerry') {
                trackingUrl = `https://th.kerryexpress.com/th/track/?track=${order.shippingInfo.trackingNumber}`;
            } else if (order.shippingInfo.carrier === 'flash') {
                trackingUrl = `https://www.flashexpress.co.th/tracking/?se=${order.shippingInfo.trackingNumber}`;
            }
            
            trackingLinkEl.href = trackingUrl;
            trackingInfoEl.classList.remove('d-none');
            
            // If shipped, activate shipped step
            shippedStepEl.classList.remove('active');
            shippedStepEl.classList.add('completed');
            shippedStepEl.querySelector('.timeline-step-circle').innerHTML = '<i class="fa fa-check"></i>';
            
            // If delivered, activate delivered step
            if (order.isDelivered) {
                deliveredStepEl.classList.add('active');
            }
        }
        
        // Update delivered step
        if (order.isDelivered) {
            deliveredStepEl.classList.remove('active');
            deliveredStepEl.classList.add('completed');
            deliveredStepEl.querySelector('.timeline-step-circle').innerHTML = '<i class="fa fa-check"></i>';
            deliveredStepEl.innerHTML += `<p class="text-muted mb-0"><small>จัดส่งเมื่อ ${new Date(order.deliveredAt).toLocaleString('th-TH')}</small></p>`;
        }
    }
}); 