const router = require("express").Router();
const Product = require("../models/Product");
const StockTransaction = require("../models/StockTransaction");
const auth = require("../middleware/auth");
router.get("/", auth, async (req, res) => {
  try {
    const [productCount, lowStockCount, units, value, recentTransactions] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ $expr: { $lte: ["$quantity", "$reorderLevel"] } }),
      Product.aggregate([{ $group: { _id: null, total: { $sum: "$quantity" } } }]),
      Product.aggregate([{ $group: { _id: null, total: { $sum: { $multiply: ["$quantity", "$price"] } } } }]),
      StockTransaction.find().populate("product", "name sku").sort({ createdAt: -1 }).limit(6)
    ]);
    res.json({ productCount, lowStockCount, totalUnits: units[0]?.total || 0, inventoryValue: value[0]?.total || 0, recentTransactions });
  } catch (e) { res.status(500).json({ message: e.message }); }
});
module.exports = router;