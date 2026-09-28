const express = require('express');
const router = express.Router();
const CatalogController = require('../controllers/catalogController');

router.get('/categories', CatalogController.getCategories);
router.get('/centers', CatalogController.getCenters);
router.get('/products', CatalogController.getProducts);

module.exports = router;
