const mongoose = require('mongoose');

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
  createdAt: { type: String, index: true },
  username: { type: String, index: true },
});

// Static methods filter adverts
advertSchema.statics.list = function (filter, skip, limit, sort, fields) {
  const query = Advert.find(filter);
  query.skip(skip);
  query.limit(limit);
  query.sort(sort);
  query.select(fields);

  return query.exec();
};

//How many ads are there?
advertSchema.statics.count = function (filter) {
  return Advert.countDocuments(filter).exec();
};

//Categories
advertSchema.statics.distinctCategories = function () {
  const query = Advert.distinct('category');
  return query.exec();
};

//Find an advert by id
advertSchema.statics.findById = async function (id) {
  return await this.findOne({ _id: id });
};

//Create model

const Advert = mongoose.model('Advert', advertSchema);

// Export model
module.exports = Advert;
