const mongoose = require('mongoose');
const sinon = require('sinon');
const { expect } = require('chai');
const Advert = require('../../../../models/Advert');

describe('My API', () => {
  it('should make a call to find an ad by ID', async () => {
    //Create a stub for the `findById` method of the Advert model
    const id = '1';
    const findByIdStub = sinon.stub(Advert, 'findById').resolves({ name: 'Anuncio 1' });

    const result = await Advert.findById(id);

    // Verify that a call was made to the `findById` method of the Advert model.
    expect(findByIdStub.calledOnce).to.be.true;

    // Verify that the function returned the expected result
    expect(result).to.deep.equal({ name: 'Anuncio 1' });

    // Restore original behavior of `findById` method
    findByIdStub.restore();
  });
});