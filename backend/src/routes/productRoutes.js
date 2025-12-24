const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { auth } = require('../middlewares/authMiddleware');

// Public routes - Product listing and details
router.get('/', productController.getProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/new-arrivals', productController.getNewArrivals);
router.get('/bestsellers', productController.getBestSellers);
router.get('/categories', productController.getActiveCategories);

// Search API (using POST for complex search queries)
router.post('/search', productController.searchProducts);

// Product detail routes
router.get('/slug/:slug', productController.getProductBySlug);
router.get('/:id', productController.getProductById);
router.get('/:id/related', productController.getRelatedProducts);

// Review routes
router.get('/:id/reviews', productController.getProductReviews);
router.post('/:id/reviews', auth, productController.createProductReview);
router.delete('/:id/reviews', auth, productController.deleteProductReview);

module.exports = router; 