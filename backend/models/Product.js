const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
  category: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0, default: 0 },
  price: { type: Number, required: true, min: 0 },
  reorderLevel: { type: Number, min: 0, default: 10 },
  description: { type: String, default: "" }
}, { timestamps: true });
module.exports = mongoose.model("Product", schema);