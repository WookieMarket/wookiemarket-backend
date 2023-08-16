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

// Static methods filter adverts
advertSchema.statics.list = function (filter, skip, limit, sort, fields) {
  const query = Advert.find(filter);
  query.skip(skip);
  query.limit(limit);
  query.sort(sort);
  query.select(fields);
  return query.exec();
};

/*advertSchema.statics.price = function (price) {
    const newPrice = price.split('-');
    const price1 = newPrice[0];
    const price2 = newPrice[1];
    const exactPrice = price;

    if (price1 && price2) {
        const query = Advert.find({ price: { $gte: price1, $lte: price2 } });
        return query.exec();
    } else if (price1) {
        const query = Advert.find({ price: { $gte: price1 } });
        return query.exec();
    } else if (price2) {
        const query = Advert.find({ price: { $lte: price2 } });
        return query.exec();
    } else if (exactPrice) {
        const query = Advert.find({ price: { $eq: exactPrice } });
        return query.exec();
    }
};*/

advertSchema.statics.distinctCategories = function () {
  const query = Advert.distinct('category');
  return query.exec();
};

//Create model

const Advert = mongoose.model('Advert', advertSchema);

// Export model
module.exports = Advert;
