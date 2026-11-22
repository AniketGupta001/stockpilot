const router = require("express").Router();
const Product = require("../models/Product");
const StockTransaction = require("../models/StockTransaction");
const auth = require("../middleware/auth");
router.use(auth);

router.post("/:id", async (req, res) => {
  try {
    const { type, quantity, note = "" } = req.body;
    if (!["IN", "OUT"].includes(type)) return res.status(400).json({ message: "Type must be IN or OUT" });
    if (!Number.isInteger(quantity) || quantity < 1) return res.status(400).json({ message: "Quantity must be a positive integer" });
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ message: "Product not found" });
    if (type === "OUT" && p.quantity < quantity) return res.status(400).json({ message: "Insufficient stock" });
    p.quantity += type === "IN" ? quantity : -quantity;
    await p.save();
    const transaction = await StockTransaction.create({ product: p._id, type, quantity, note, performedBy: req.user.id });
    res.status(201).json({ product: p, transaction });
  } catch (e) { res.status(400).json({ message: e.message }); }
});
router.get("/history", async (req, res) => {
  try {
    res.json(await StockTransaction.find().populate("product", "name sku").populate("performedBy", "name").sort({ createdAt: -1 }).limit(100));
  } catch (e) { res.status(500).json({ message: e.message }); }
});
module.exports = router;