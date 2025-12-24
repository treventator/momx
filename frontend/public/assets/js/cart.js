/**
 * Cart Management Functions
 * This file contains functions to handle the shopping cart functionality
 */

// Get cart from localStorage or initialize empty array
function getCart() {
    const cartData = localStorage.getItem('cart');
    return cartData ? JSON.parse(cartData) : [];
}

// Save cart to localStorage
function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

// Add item to cart
function addToCart(product, quantity = 1) {
    const cart = getCart();
    
    // Check if product already exists in cart
    const existingItemIndex = cart.findIndex(item => item.id === product.id);
    
    if (existingItemIndex > -1) {
        // Update quantity if item exists
        cart[existingItemIndex].quantity += quantity;
    } else {
        // Add new item if it doesn't exist
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: quantity
        });
    }
    
    saveCart(cart);
    return cart;
}

// Update cart item quantity
function updateCartItemQuantity(productId, newQuantity) {
    const cart = getCart();
    const itemIndex = cart.findIndex(item => item.id === productId);
    
    if (itemIndex > -1) {
        cart[itemIndex].quantity = newQuantity;
        saveCart(cart);
    }
    
    return cart;
}

// Remove item from cart
function removeFromCart(productId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== productId);
    saveCart(cart);
    return cart;
}

// Clear the entire cart
function clearCart() {
    localStorage.removeItem('cart');
    updateCartCount();
    return [];
}

// Get specific cart item
function getCartItem(productId) {
    const cart = getCart();
    return cart.find(item => item.id === productId);
}

// Calculate cart total value
function getCartTotal() {
    const cart = getCart();
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// Get cart count
function getCartCount() {
    const cart = getCart();
    return cart.reduce((count, item) => count + item.quantity, 0);
}

// Update cart count badge
function updateCartCount() {
    const cartCountElements = document.querySelectorAll('#cart-count');
    const count = getCartCount();
    
    cartCountElements.forEach(element => {
        element.textContent = count;
        
        // Hide badge if count is 0
        if (count === 0) {
            element.style.display = 'none';
        } else {
            element.style.display = 'inline-block';
        }
    });
}

// Initialize cart count when page loads
document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
}); 