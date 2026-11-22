const router = require("express").Router();
const Product = require("../models/Product");
const StockTransaction = require("../models/StockTransaction");
const auth = require("../middleware/auth");
router.use(auth);

router.get("/", async (req, res) => {
  try {
    const q = String(req.query.search || "");
    const filter = q ? { $or: [{ name: { $regex: q, $options: "i" } }, { sku: { $regex: q, $options: "i" } }, { category: { $regex: q, $options: "i" } }] } : {};
    res.json(await Product.find(filter).sort({ createdAt: -1 }));
  } catch (e) { res.status(500).json({ message: e.message }); }
});
router.get("/low-stock", async (req, res) => {
  try { res.json(await Product.find({ $expr: { $lte: ["$quantity", "$reorderLevel"] } }).sort({ quantity: 1 })); }
  catch (e) { res.status(500).json({ message: e.message }); }
});
router.post("/", async (req, res) => {
  try {
    const { name, sku, category, quantity, price, reorderLevel, description } = req.body;
    if (!name || !sku || !category || quantity === undefined || price === undefined)
      return res.status(400).json({ message: "Name, SKU, category, quantity and price are required" });
    res.status(201).json(await Product.create({ name, sku, category, quantity, price, reorderLevel, description }));
  } catch (e) { res.status(400).json({ message: e.code === 11000 ? "SKU already exists" : e.message }); }
});
router.put("/:id", async (req, res) => {
  try {
    const allowed = ["name", "sku", "category", "price", "reorderLevel", "description"];
    const updates = Object.fromEntries(allowed.filter(k => req.body[k] !== undefined).map(k => [k, req.body[k]]));
    const p = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!p) return res.status(404).json({ message: "Product not found" });
    res.json(p);
  } catch (e) { res.status(400).json({ message: e.code === 11000 ? "SKU already exists" : e.message }); }
});
router.delete("/:id", async (req, res) => {
  try {
    const p = await Product.findByIdAndDelete(req.params.id);
    if (!p) return res.status(404).json({ message: "Product not found" });
    await StockTransaction.deleteMany({ product: p._id });
    res.json({ message: "Product deleted" });
  } catch (e) { res.status(400).json({ message: e.message }); }
});
module.exports = router;