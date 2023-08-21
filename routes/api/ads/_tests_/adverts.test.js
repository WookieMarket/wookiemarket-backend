const mongoose = require('mongoose');
const sinon = require('sinon');
const { expect } = require('chai');
const Advert = require('../../../../models/Advert');

describe('My API', () => {
  it('should make a call to find an ad by ID', async () => {
    // Crear un stub para el método `findById` del modelo Advert
    const id = '1';
    const findByIdStub = sinon.stub(Advert, 'findById').resolves({ name: 'Anuncio 1' });

    // Llamar a la función que quieres probar
    const result = await Advert.findById(id);

    // Verificar que se hizo una llamada al método `findById` del modelo Advert
    expect(findByIdStub.calledOnce).to.be.true;

    // Verificar que la función devolvió el resultado esperado
    expect(result).to.deep.equal({ name: 'Anuncio 1' });

    // Restaurar el comportamiento original del método `findById`
    findByIdStub.restore();
  });
});





/*const request = require('supertest');
const app = require('../../../../app');

//Mock advert simulations
jest.mock('../_mocks_/Adverts');

//Mock DB simulation
jest.mock('mongoose', () => ({
  connect: jest.fn(),
  set: jest.fn(),
  connection: {
    on: jest.fn(),
    once: jest.fn(),
  },
  Schema: jest.fn(() => ({
    statics: {},
  })),
  model: jest.fn(() => ({})),
}));

//Othe mocks simulations
jest.mock('http-errors', () => jest.fn());
const mockExpress = () => {
  const app = {
    use: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    listen: jest.fn(),
  };
  return app;
};
mockExpress.Router = () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
});

jest.mock('express', () => mockExpress);

jest.mock('path', () => ({
  join: jest.fn(),
}));
jest.mock('cookie-parser', () => jest.fn());
jest.mock('morgan', () => jest.fn());
jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

//Testing
describe('GET /api/ads/adverts/:id', () => {
  it('should return the details of an ad', async () => {
    const res = await request(app).get('/anuncio/1').expect(200);
    expect(res.body).toHaveProperty('title');
    expect(res.body).toHaveProperty('description');
  });
});*/
