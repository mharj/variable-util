import 'mocha';
import * as chai from 'chai';
import {ConfigMap, stringParser, SwitchLoader} from '../src';

const expect = chai.expect;

type TestEnv = {
	DEMO?: string;
	ANOTHER?: string;
};

const switchLoader = new SwitchLoader<TestEnv, 'switch1' | 'switch2'>({
	switch1: {
		DEMO: 'value',
	},
	switch2: {
		DEMO: 'value2',
	},
});

// eslint-disable-next-line @typescript-eslint/unbound-method
const switcher = switchLoader.getLoader;

const config = new ConfigMap<TestEnv>(
	{
		DEMO: {loaders: [switcher()], parser: stringParser()},
		ANOTHER: {loaders: [switcher()], parser: stringParser()},
	},
	{namespace: 'Demo'},
);

describe('Test Switch loader', function () {
	it('should parse values', async function () {
		expect(await config.get('DEMO')).to.equal(undefined);
		await switchLoader.activateSwitch('switch1');
		expect(await config.get('DEMO')).to.equal('value');
		await switchLoader.deactivateSwitch('switch1');
		await switchLoader.activateSwitch('switch2');
		expect(await config.get('DEMO')).to.equal('value2');
		await switchLoader.deactivateSwitch('switch2');
		expect(await config.get('DEMO')).to.equal(undefined);
	});
	it('should get last selected keys value', async function () {
		expect(await config.get('DEMO')).to.equal(undefined);
		await switchLoader.activateSwitch('switch1');
		await switchLoader.activateSwitch('switch2');
		expect(await config.get('DEMO')).to.equal('value2');
		await switchLoader.deactivateSwitch('switch2');
		await switchLoader.deactivateSwitch('switch1');
		expect(await config.get('DEMO')).to.equal(undefined);
	});
});
