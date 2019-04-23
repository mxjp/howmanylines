#!/usr/bin/env node

import { resolve } from 'path';
import { CommandSpec, CommandError } from '@phylum/command';
import * as colorSupport from 'color-support';
import * as colors from 'ansi-colors';
import { analyze } from './analyze';
import { Context, outputTypes, statModes } from './context';
import { gitignore } from './gitignore';

(async () => {
	const args = new CommandSpec([
		{ name: 'input', defaultValue: '.', defaultFallback: true },
		{ name: 'output', alias: 'o', defaultValue: 'summary' },
		{ name: 'verbose', alias: 'v', defaultValue: false, type: 'flag' },
		{ name: 'no-gitignore', type: 'flag' },
		{ name: 'gitignore-files', multiple: true, defaultValue: '.gitignore' },
		{ name: 'no-color', type: 'flag' },
		{ name: 'stat-mode', defaultValue: 'default' }
	]).parse(process.argv.slice(2));
	(<any> colors).enabled = !args['no-color'] && colorSupport.hasBasic;

	if (!outputTypes.has(args.output)) {
		throw new CommandError(`Unknown output: "${args.output}". Available output types: ${
			Array.from(outputTypes).map(id => `${id}`).join(', ')
		}`);
	}
	if (!statModes.has(args['stat-mode'])) {
		throw new CommandError(`Unknown output: "${args['stat-mode']}". Available output types: ${
			Array.from(statModes).map(id => `${id}`).join(', ')
		}`);
	}

	const root = resolve(args.input);
	const ctx = new Context({
		root,
		outputType: args.output,
		verbose: args.verbose,
		statMode: args['stat-mode']
	});
	if (!args['no-gitignore']) {
		gitignore(ctx, args['gitignore-files']);
	}

	await analyze(root, ctx);
	ctx.show();
})().catch(error => {
	console.error(error instanceof CommandError ? colors.red(error.message) : error);
	process.exit(1);
});
