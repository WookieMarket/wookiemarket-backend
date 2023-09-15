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
  userId: { type: String, index: true },
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
advertSchema.statics.countAds = function (filter) {
  return this.countDocuments(filter).exec();
};

// Método estático para obtener elementos únicos en la matriz 'category'
advertSchema.statics.getUniqueCategories = function () {
  const categories = this.distinct('category');
  return categories.exec();
};

//Find an advert by id
advertSchema.statics.findById = async function (id) {
  return await this.findOne({ _id: id });
};

advertSchema.statics.updateAd = function (adId) {
  const adNew = Advert.findById(adId);
  return adNew.exec();
};

// Create & exports model
const Advert = mongoose.model('Advert', advertSchema);

// Configura la emisión de eventos de cambio
const changeStream = Advert.watch();

changeStream.on('change', change => {
  console.log('Cambio detectado:', change);
  // Emite eventos de cambio aquí
});

// Export model
module.exports = Advert;
