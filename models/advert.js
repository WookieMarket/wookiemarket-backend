const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Create Schema Adverts

const advertSchema = mongoose.Schema({
  name: { type: String, index: true },
  onSale: { type: Boolean, index: true },
  price: { type: Number, min: 0.01, max: Infinity, index: true },
  image: String,
  category: { type: [String], index: true },
  description: String,
  status: { type: String, index: true },
  coin: { type: String, default: '€', index: true },
});

//Create model

const Advert = mongoose.model('Advert', advertSchema);

// Export model
module.exports = Advert;
