const path = require('path');
const capitalize = require('lodash/capitalize');
const { expect } = require('../setup');
const cli = require('../__lib__/cli');
const {
	DEVICE_ID,
	DEVICE_NAME,
	DEVICE_PLATFORM_NAME,
	PATH_TMP_DIR,
	PATH_PROJ_STROBY_INO
} = require('../__lib__/env');


describe('Cloud Command [@device]', () => {
	const strobyBinPath = path.join(PATH_TMP_DIR, 'photon-stroby.bin');
	const help = [
		'Access Particle cloud functionality',
		'Usage: particle cloud <command>',
		'Help:  particle help cloud <command>',
		'',
		'Commands:',
		'  claim    Register a device with your user account with the cloud',
		'  list     Display a list of your devices, as well as their variables and functions',
		'  remove   Release a device from your account so that another user may claim it',
		'  name     Give a device a name!',
		'  flash    Pass a binary, source file, or source directory to a device!',
		'  compile  Compile a source file, or directory using the cloud compiler',
		'  nyan     Make your device shout rainbows',
		'  login    Login to the cloud and store an access token locally',
		'  logout   Log out of your session and clear your saved access token',
		'',
		'Global Options:',
		'  -v, --verbose  Increases how much logging to display  [count]',
		'  -q, --quiet    Decreases how much logging to display  [count]'
	];

	before(async () => {
		await cli.setTestProfileAndLogin();
		await cli.flashBlankFirmwareOTAForTest();
	});

	after(async () => {
		await cli.claimTestDevice();
		await cli.revertDeviceName();
		await cli.logout();
		await cli.setDefaultProfile();
	});

	it('Shows `help` content', async () => {
		const { stdout, stderr, exitCode } = await cli.run(['help', 'cloud']);

		expect(stdout).to.equal('');
		expect(stderr.split('\n')).to.include.members(help);
		expect(exitCode).to.equal(0);
	});

	it('Shows `help` content when run without arguments', async () => {
		const { stdout, stderr, exitCode } = await cli.run('cloud');

		expect(stdout).to.equal('');
		expect(stderr.split('\n')).to.include.members(help);
		expect(exitCode).to.equal(0);
	});

	it('Shows `help` content when run with `--help` flag', async () => {
		const { stdout, stderr, exitCode } = await cli.run(['cloud', '--help']);

		expect(stdout).to.equal('');
		expect(stderr.split('\n')).to.include.members(help);
		expect(exitCode).to.equal(0);
	});

	it('Lists devices', async () => {
		const args = ['cloud', 'list'];
		const platform = capitalize(DEVICE_PLATFORM_NAME);
		const { stdout, stderr, exitCode } = await cli.run(args);

		expect(stdout).to.include(`${DEVICE_NAME} [${DEVICE_ID}] (${platform})`);
		expect(stderr).to.equal('');
		expect(exitCode).to.equal(0);
	});

	it('Compiles firmware', async () => {
		const args = ['cloud', 'compile', 'photon', PATH_PROJ_STROBY_INO, '--saveTo', strobyBinPath];
		const { stdout, stderr, exitCode } = await cli.run(args);
		const log = [
			'Compiling code for photon',
			'',
			'Including:',
			`    ${PATH_PROJ_STROBY_INO}`,
			'attempting to compile firmware ',
			'', // TODO (mirande): should be 'downloading binary from: /v1/binaries/5d38f108bc91fb000130a3f9' but the hash changes on each run
			`saving to: ${strobyBinPath}`,
			'Memory use: ',
			'   text\t   data\t    bss\t    dec\t    hex\tfilename',
			'   7436\t    116\t   1444\t   8996\t   2324\t/workspace/target/workspace.elf',
			'',
			'Compile succeeded.',
			`Saved firmware to: ${strobyBinPath}`
		];

		expect(stdout.split('\n')).to.include.members(log);
		expect(stderr).to.equal('');
		expect(exitCode).to.equal(0);
	});

	it('Flashes firmware', async () => {
		const args = ['cloud', 'flash', DEVICE_NAME, PATH_PROJ_STROBY_INO];
		const { stdout, stderr, exitCode } = await cli.run(args);
		const log = [
			'Including:',
			`    ${PATH_PROJ_STROBY_INO}`,
			`attempting to flash firmware to your device ${DEVICE_NAME}`,
			'Flash device OK:  Update started'
		];

		expect(stdout.split('\n')).to.include.members(log);
		expect(stderr).to.equal('');
		expect(exitCode).to.equal(0);

		await cli.waitForVariable('name', 'stroby');
	});

	it('Removes device', async () => {
		const args = ['cloud', 'remove', DEVICE_NAME, '--yes'];
		const { stdout, stderr, exitCode } = await cli.run(args);
		const log = [
			`releasing device ${DEVICE_NAME}`,
			'Okay!'
		];

		expect(stdout.split('\n')).to.include.members(log);
		expect(stderr).to.equal('');
		expect(exitCode).to.equal(0);
	});

	it('Claims device', async () => {
		const args = ['cloud', 'claim', DEVICE_ID];
		const { stdout, stderr, exitCode } = await cli.run(args);
		const log = [
			`Claiming device ${DEVICE_ID}`,
			`Successfully claimed device ${DEVICE_ID}`
		];

		expect(stdout.split('\n')).to.include.members(log);
		expect(stderr).to.equal('');
		expect(exitCode).to.equal(0);
	});

	it('Names a device', async () => {
		const name = `${DEVICE_NAME}-updated`;
		const args = ['cloud', 'name', DEVICE_ID, name];
		const { stdout, stderr, exitCode } = await cli.run(args);
		const log = [
			`Renaming device ${DEVICE_ID}`,
			`Successfully renamed device ${DEVICE_ID} to: ${name}`
		];

		expect(stdout.split('\n')).to.include.members(log);
		expect(stderr).to.equal('');
		expect(exitCode).to.equal(0);
	});
});

