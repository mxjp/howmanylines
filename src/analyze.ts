
import { join } from 'path';
import { createReadStream, readdir, readFile } from 'fs-extra';
import { stat, Stats } from 'fs-extra';
import * as colors from 'ansi-colors';
import { Context, FileInfo } from './context';
import * as validate from 'utf-8-validate';

export async function analyze(filename: string, ctx: Context) {
	async function walk(filename: string) {
		const stats = await stat(filename);
		if ((await Promise.all(ctx.excludeCallbacks.map(cb => cb(filename, stats)))).includes(true)) {
			return;
		}
		if (stats.isFile()) {
			const info = await analyzeFile(filename, stats, ctx);
			if (info) {
				ctx.files.set(filename, info);
			}
		} else if (stats.isDirectory()) {
			const children = await readdir(filename);
			await Promise.all(ctx.readdirCallbacks.map(cb => cb(filename, children)));
			return Promise.all(children.map(child => walk(join(filename, child))));
		}
	}

	ctx.detail(`Using stat mode: ${colors.green(ctx.statMode)}`);

	const start = process.hrtime();
	await walk(filename);
	const duration = process.hrtime(start);
	ctx.detail(`Scan completed in ${(duration[0] + duration[1] / 1e9).toFixed(3)} seconds.`);
}

export async function analyzeFile(filename: string, stats: Stats, ctx: Context): Promise<FileInfo> {
	if (ctx.statMode === 'stream') {
		return new Promise((resolve, reject) => {
			let lines = 0, size = 0;
			createReadStream(filename)
				.on('error', reject)
				.on('end', () => resolve({ lines, size }))
				.on('data', buffer => {
					size += buffer.length;
					for (let i = buffer.indexOf(10); i >= 0 && i < buffer.length; i = buffer.indexOf(10, i + 1)) {
						lines++;
					}
				});
		});
	} else {
		const contents = await readFile(filename);
		if (!validate(contents)) {
			ctx.detail(`"${colors.red(ctx.formatPath(filename))}" contains binary content.`);
			return null;
		}
		let lines = 0;
		for (let i = contents.indexOf(10); i >= 0 && i < contents.length; i = contents.indexOf(10, i + 1)) {
			lines++;
		}
		return { lines, size: Buffer.byteLength(contents) };
	}
}
