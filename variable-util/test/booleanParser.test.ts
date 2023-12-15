import 'mocha';
import * as chai from 'chai';
import {booleanParser} from '../src';

const expect = chai.expect;

describe('Test boolean parser', function () {
	it('should parse values', async function () {
		expect(await booleanParser().parse('key', 'true')).to.equal(true);
		expect(await booleanParser().parse('key', true as unknown as string)).to.equal(true);
	});
});
