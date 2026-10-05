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
      const { search, phonesOnly, brand, limit } = req.query;
      let prods = dataLoader.getProducts();

      if (phonesOnly === 'true' || phonesOnly === '1') {
        prods = prods.filter(p => p.nhom_san_pham && p.nhom_san_pham.includes('Điện thoại'));
      }

      if (brand && brand !== 'ALL') {
        prods = prods.filter(p => p.thuong_hieu && p.thuong_hieu.toLowerCase() === brand.toLowerCase());
      }

      if (search) {
        const q = search.toLowerCase().trim();
        prods = prods.filter(p =>
          (p.product_name && p.product_name.toLowerCase().includes(q)) ||
          (p.product_code && p.product_code.toLowerCase().includes(q)) ||
          (p.thuong_hieu && p.thuong_hieu.toLowerCase().includes(q))
        );
      }

      const maxLimit = limit === 'all' ? prods.length : (Number(limit) || prods.length);

      return res.status(200).json({
        success: true,
        total: prods.length,
        data: prods.slice(0, maxLimit),
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = CatalogController;
