const mongoose = require('mongoose');
const sinon = require('sinon');
const { expect } = require('chai');
const Advert = require('../../../../models/Advert');

describe('My API', () => {
  const id = '1';
  const id2= '2'
  it('should make a call to find an ad by ID', async () => {
    //Create a stub for the `findById` method of the Advert model
    const findByIdStub = sinon
      .stub(Advert, 'findById')
      .resolves({ name: 'Advert 1' });

    const result = await Advert.findById(id);

    // Verify that a call was made to the `findById` method of the Advert model.
    expect(findByIdStub.calledOnce).to.be.true;

    // Verify that the function returned the expected result
    expect(result).to.deep.equal({ name: 'Advert 1' });

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
  it('should make a call to delete an ad by ID', async () => {
    // Creates a stub for the `findByIdAndDelete` method of the Advert model
    const findByIdAndDeleteStub = sinon
      .stub(Advert, 'findByIdAndDelete')
      .resolves({ name: 'Advert 2' });

    const result = await Advert.findByIdAndDelete(id2);

    expect(findByIdAndDeleteStub.calledOnce).to.be.true;
    expect(result).to.deep.equal({ name: 'Advert 2' });

    // Restores the original behaviour of the `findByIdAndDelete` method.
    findByIdAndDeleteStub.restore();
  });
  
});
