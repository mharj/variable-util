import {describe, expect, it} from 'vitest';
import {buildStringObject} from '../src';

describe('buildStringObject', function () {
	it('should build valid object', function () {
		expect(buildStringObject({})).to.be.eql({});
		expect(buildStringObject({name: 'value', num: 1, flag: true})).to.be.eql({name: 'value', num: '1', flag: 'true'});
		const start = new Date();
		expect(buildStringObject({name: 'value', num: 1, start})).to.be.eql({name: 'value', num: '1', start: start.toString()});
	});
});
