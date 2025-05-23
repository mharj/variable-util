import {describe, expect, it} from 'vitest';
import {buildPartialHiddenValueString} from '../src';

const uuidValue = '326ef604-7570-443a-bbea-fe68f21f84be';
const shortKey = 'someSecretKey';

describe('Test', function () {
	describe('Test', function () {
		it('buildPartialHiddenValueString', function () {
			expect(buildPartialHiddenValueString(uuidValue, 'prefix')).to.equal('326*********************************').and.lengthOf(uuidValue.length);
			expect(buildPartialHiddenValueString(uuidValue, 'suffix')).to.equal('*********************************4be').and.lengthOf(uuidValue.length);
			expect(buildPartialHiddenValueString(uuidValue, 'prefix-suffix')).to.equal('32********************************be').and.lengthOf(uuidValue.length);

			expect(buildPartialHiddenValueString(shortKey, 'prefix')).to.equal('so***********').and.lengthOf(shortKey.length);
			expect(buildPartialHiddenValueString(shortKey, 'suffix')).to.equal('***********ey').and.lengthOf(shortKey.length);
			expect(buildPartialHiddenValueString(shortKey, 'prefix-suffix')).to.equal('s***********y').and.lengthOf(shortKey.length);
		});
	});
});
