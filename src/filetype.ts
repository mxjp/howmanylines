
import { basename } from 'path';

export function filetype(filename: string) {
	const name = basename(filename);
	const start = name.lastIndexOf('.');
	return start < 0 ? '' : name.slice(start + 1);
}
