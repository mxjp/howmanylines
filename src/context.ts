
import { Stats } from 'fs';
import { relative } from 'path';
import * as colors from 'ansi-colors';
import { filetype } from './filetype';
import { table, getBorderCharacters, TableUserConfig } from 'table';
import * as bytes from 'pretty-bytes';

export type StatMode = 'default' | 'stream';
export const statModes = new Set<StatMode>(['default', 'stream']);

export type OutputType = 'summary' | 'summary-json' | 'files' | 'files-json';
export const outputTypes = new Set<OutputType>(['summary', 'summary-json', 'files', 'files-json']);

export type ExcludeCallback = (filename: string, stats: Stats) => boolean | Promise<boolean>;
export type ReaddirCallback = (filename: string, children: string[]) => void | Promise<void>;

export interface FileInfo {
	lines: number,
	size: number
}

export interface SummaryFileInfo {
	lines: number,
	size: number,
	files: number
}

export class Context {
	public constructor(options: {
		root: string,
		verbose: boolean,
		outputType: OutputType,
		statMode: StatMode
	}) {
		this.root = options.root;
		this.verbose = options.verbose;
		this.outputType = options.outputType;
		this.statMode = options.statMode;
	}

	public readonly root: string;
	public readonly verbose: boolean;
	public readonly outputType: OutputType;
	public readonly statMode: StatMode;
	public readonly excludeCallbacks: ExcludeCallback[] = [];
	public readonly readdirCallbacks: ReaddirCallback[] = [];
	public readonly files = new Map<string, FileInfo>();

	public detail(message: string) {
		if (this.verbose) {
			process.stderr.write(message + '\n');
		}
	}

	public formatPath(filename: string) {
		return '/' + relative(this.root, filename).replace(/\\/g, '/');
	}

	public get summary() {
		const summary = new Map<string, { lines: number, files: number, size: number }>();
		for (const [filename, {lines, size}] of this.files) {
			const type = filetype(filename);
			const entry = summary.get(type);
			if (entry) {
				entry.lines += lines;
				entry.files++;
			} else {
				summary.set(type, {
					lines,
					size,
					files: 1
				});
			}
		}
		return summary;
	}

	public get sortedSummary() {
		return new Map<string, SummaryFileInfo>(Array.from(this.summary).sort(([a], [b]) => {
			return a > b ? 1 : (a < b ? -1 : 0);
		}));
	}

	public get sortedFiles() {
		return new Map<string, FileInfo>(Array.from(this.files).sort(([a], [b]) => {
			return a > b ? 1 : (a < b ? -1 : 0);
		}));
	}

	private _showSummary() {
		const summaryTable: string[][] = [[
			colors.bold('Type'),
			colors.bold('Lines'),
			colors.bold('Files'),
			colors.bold('Size')
		]];
		for (const [type, { lines, files, size }] of this.sortedSummary) {
			summaryTable.push([
				type ? colors.green(type) : colors.gray('<unknown>'),
				colors.yellow(`${lines}`),
				colors.red(`${files}`),
				colors.cyan(bytes(size))
			]);
		}
		this._showTable(summaryTable, {
			columns: {
				1: { alignment: 'right' },
				2: { alignment: 'right' }
			}
		});
	}

	private _showSummaryAsJson() {
		const data = {};
		for (const [type, info] of this.sortedSummary) {
			data[type] = info;
		}
		this._showJson(data);
	}

	private _showFiles() {
		const filesTable: string[][] = [[
			colors.bold('Filename'),
			colors.bold('Lines'),
			colors.bold('Size')
		]];
		for (const [filename, { lines, size }] of this.sortedFiles) {
			filesTable.push([
				colors.green(this.formatPath(filename)),
				colors.yellow(`${lines}`),
				colors.cyan(`${size}`)
			]);
		}
		this._showTable(filesTable, {
			columns: {
				1: { alignment: 'right' },
				2: { alignment: 'right' }
			}
		});
	}

	private _showFilesAsJson() {
		const data = {};
		for (const [filename, info] of this.sortedFiles) {
			data[filename] = info;
		}
		this._showJson(data);
	}

	private _showJson(data: any) {
		process.stdout.write(JSON.stringify(data, null, '    ') + '\n');
	}

	private _showTable(data: string[][], config: TableUserConfig = {}) {
		process.stdout.write(table(data, Object.assign({
			border: getBorderCharacters('norc'),
			drawHorizontalLine: (index, size) => index < 2 || index == size
		}, config)));
	}

	public show() {
		switch (this.outputType) {
			case 'summary': return this._showSummary();
			case 'summary-json': return this._showSummaryAsJson();
			case 'files': return this._showFiles();
			case 'files-json': return this._showFilesAsJson();
		}
	}
}
