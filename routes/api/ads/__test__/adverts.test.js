const mongoose = require('mongoose');
const sinon = require('sinon');
const { expect } = require('chai');
const Advert = require('../../../../models/advert');

describe('My API', () => {
  const id = '1';
  it('should make a call to find an ad by ID', async () => {
    //Create a stub for the `findById` method of the Advert model
    const findByIdStub = sinon
      .stub(Advert, 'findById')
      .resolves({ name: 'Anuncio 1' });

    const result = await Advert.findById(id);

    // Verify that a call was made to the `findById` method of the Advert model.
    expect(findByIdStub.calledOnce).to.be.true;

    // Verify that the function returned the expected result
    expect(result).to.deep.equal({ name: 'Anuncio 1' });

    // Restore original behavior of `findById` method
    findByIdStub.restore();
  });
  it('should handle an error when finding an ad by ID', async () => {
    // Create a stub for the `findById` method of the Advert model
    const error = new Error('Database error');
    const findByIdStub = sinon.stub(Advert, 'findById').rejects(error);

    // Call the function you want to test and handle the error
    let result;
    try {
      result = await Advert.findById(id);
    } catch (err) {
      expect(err).to.equal(error);
    }

    expect(findByIdStub.calledOnce).to.be.true;

    // Verify that no result was returned
    expect(result).to.be.undefined;

    findByIdStub.restore();
  });
});
