const dataLoader = require('../data/dataLoader');

class CatalogController {
  // Lấy danh sách 6 nhóm sự cố (issue_categories.csv)
  static getCategories(req, res) {
    try {
      const categories = dataLoader.getIssueCategories();
      return res.status(200).json({
        success: true,
        total: categories.length,
        data: categories,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // Lấy danh sách 6 trung tâm bảo hành (service_centers.csv)
  static getCenters(req, res) {
    try {
      const centers = dataLoader.getServiceCenters();
      return res.status(200).json({
        success: true,
        total: centers.length,
        data: centers,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // Lấy danh mục sản phẩm bảo hành (products.csv)
  static getProducts(req, res) {
    try {
      const { search } = req.query;
      let prods = dataLoader.getProducts();

      if (search) {
        const q = search.toLowerCase();
        prods = prods.filter(p => p.product_name.toLowerCase().includes(q) || p.product_code.toLowerCase().includes(q));
      }

      return res.status(200).json({
        success: true,
        total: prods.length,
        data: prods.slice(0, 50), // Phân trang 50 mục
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = CatalogController;
