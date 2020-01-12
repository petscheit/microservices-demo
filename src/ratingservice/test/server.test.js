var expect = require('chai').expect;
var should = require('chai').should();
const fs = require('fs');

const { addRating, getRatings } = require('../server');

const writeInitialTestRatings = () => {
    const data = JSON.stringify({
        "0PUK6V6EV0": {
            "amount": 2,
            "average": 3.5
        }
    });
    fs.writeFileSync('test/ratings.json', data);
}


beforeEach('Setting up ratings', function () {
    writeInitialTestRatings();
});

afterEach('Reseting ratings', function () {
    writeInitialTestRatings();
});

describe('GetRatings Testing', function () {
    it('should return ratingMetaItem for valid productId', function () {
        getRatings({
            request: {
                product_id: '0PUK6V6EV0'
            }
        }, (_, rating) => {
            rating.amount.should.equal(2);
            rating.average.should.equal(3.5);
        });
    });
    it('should return default ratingMetaItem for unknown productId', function () {
        getRatings({
            request: {
                product_id: 'XXX'
            }
        }, (_, rating) => {
            rating.amount.should.equal(0);
            rating.average.should.equal(0);
        });
    });
});

describe('AddRating Testing', function () {
    it('should add rating for valid input', function () {
        const product_id = '0PUK6V6EV0'
        let ratingsAmount = null;
        getRatings({
            request: {
                product_id
            }
        }, (_, rating) => {
            ratingsAmount = rating.amount;
        });
        addRating({
            request: {
                rating: {
                    product_id,
                    rating: 2
                }
            }
        }, () => { });
        getRatings({
            request: {
                product_id
            }
        }, (_, rating) => {
            rating.amount.should.equal(ratingsAmount + 1);
        });
    });
    it('should throw error trying to add rating with invalid star amount', function () {
        expect(function () {
            addRating({
                request: {
                    rating: {
                        product_id: '0PUK6V6EV0',
                        rating: 6
                    }
                }
            }, () => { });
        }).to.throw('invalid ratingItem');
    })
    it('should throw error trying to add rating with invalid productId', function () {
        expect(function () {
            addRating({
                request: {
                    rating: {
                        product_id: 1,
                        rating: 6
                    }
                }
            }, () => { });
        }).to.throw('invalid ratingItem');
    })
});
