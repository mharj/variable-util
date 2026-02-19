import {describe, expect, it} from 'vitest';
import {buildStringObject} from '../src';

describe('buildStringObject', function () {
	it('should build valid object', function () {
		expect(buildStringObject({})).to.be.eql({});
		expect(buildStringObject({flag: true, name: 'value', num: 1})).to.be.eql({flag: 'true', name: 'value', num: '1'});
		const start = new Date();
		expect(buildStringObject({name: 'value', num: 1, start})).to.be.eql({name: 'value', num: '1', start: start.toJSON()});
		expect(buildStringObject({name: 'value', num: 1, sub: {demo: 'string'}})).to.be.eql({name: 'value', num: '1', sub: '{"demo":"string"}'});
		expect(buildStringObject({name: 'value', num: 1, sub: null})).to.be.eql({name: 'value', num: '1'});
	});
});
