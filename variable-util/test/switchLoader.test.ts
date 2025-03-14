import {spy} from 'sinon';
import {beforeEach, describe, expect, it} from 'vitest';
import {ConfigMap, stringParser, SwitchLoader} from '../src';

const updateSpy = spy();

type TestEnv = {
	DEMO?: string;
	ANOTHER?: string;
};

const switchLoader = new SwitchLoader<TestEnv, 'switch1' | 'switch2'>(
	{
		switch1: {
			DEMO: 'value',
		},
		switch2: {
			DEMO: 'value2',
		},
	},
	undefined,
	'unit-test',
);
switchLoader.on('updated', updateSpy);

const switcher = switchLoader.getLoader;

const config = new ConfigMap<TestEnv>(
	{
		DEMO: {loaders: [switcher()], parser: stringParser()},
		ANOTHER: {loaders: [switcher()], parser: stringParser()},
	},
	{namespace: 'Demo'},
);

describe('Test Switch loader', function () {
	beforeEach(function () {
		updateSpy.resetHistory();
	});
	it('should parse values', async function () {
		expect(await config.get('DEMO')).to.equal(undefined);
		await switchLoader.activateSwitch('switch1');
		expect(await config.get('DEMO')).to.equal('value');
		await switchLoader.deactivateSwitch('switch1');
		await switchLoader.activateSwitch('switch2');
		expect(await config.get('DEMO')).to.equal('value2');
		await switchLoader.deactivateSwitch('switch2');
		expect(await config.get('DEMO')).to.equal(undefined);
		expect(updateSpy.callCount).to.equal(4);
	});
	it('should get last selected keys value', async function () {
		expect(await config.get('DEMO')).to.equal(undefined);
		await switchLoader.activateSwitch('switch1');
		await switchLoader.activateSwitch('switch2');
		expect(await config.get('DEMO')).to.equal('value2');
		await switchLoader.deactivateSwitch('switch2');
		await switchLoader.deactivateSwitch('switch1');
		expect(await config.get('DEMO')).to.equal(undefined);
		expect(updateSpy.callCount).to.equal(4);
	});
});
