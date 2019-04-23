
import { join, relative, basename } from 'path';
import { readFile } from 'fs-extra';
import * as createFilter from 'ignore';
import * as colors from 'ansi-colors';
import { Context } from './context';

export function gitignore(ctx: Context, names = ['.gitignore']) {
	ctx.readdirCallbacks.push(async (dirname, children) => {
		const pending = [];
		const childSet = new Set(children);
		for (const name of names) {
			if (childSet.has(name)) {
				const ignorefile = join(dirname, name);
				pending.push(readFile(ignorefile, 'utf8').then(content => {
					const filter = (<any> createFilter)().add(content.split('\n'));
					ctx.excludeCallbacks.push(filename => {
						if (filename.startsWith(dirname) && filter.ignores(relative(dirname, filename))) {
							ctx.detail(`"${colors.red(ctx.formatPath(filename))}" ignored by "${colors.yellow(ctx.formatPath(ignorefile))}"`);
							return true;
						}
						return false;
					});
				}));
			}
		}
		await Promise.all(pending);
	});
	ctx.excludeCallbacks.push((filename, stats) => {
		return stats.isDirectory() && basename(filename) === '.git';
	});
}
