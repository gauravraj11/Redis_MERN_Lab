require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const products = [
  { name: 'Wireless Mouse', price: 799, category: 'Electronics', description: 'Ergonomic 2.4 GHz mouse' },
  { name: 'Mechanical Keyboard', price: 3499, category: 'Electronics', description: 'Blue switches, backlit' },
  { name: 'USB-C Hub', price: 1599, category: 'Electronics', description: '6-in-1 with HDMI' },
  { name: 'Notebook (A5)', price: 149, category: 'Stationery', description: '200 ruled pages' },
  { name: 'Gel Pen Pack', price: 99, category: 'Stationery', description: 'Pack of 5, blue' },
  { name: 'Steel Water Bottle', price: 549, category: 'Lifestyle', description: '1 litre, insulated' },
  { name: 'Laptop Backpack', price: 1899, category: 'Lifestyle', description: 'Fits 15.6 inch laptops' },
  { name: 'Desk Lamp', price: 1199, category: 'Home', description: 'LED with 3 brightness levels' },
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Product.deleteMany({});
    await Product.insertMany(products);
    console.log(`🌱 Seeded ${products.length} products`);
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
