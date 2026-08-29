import fs from 'node:fs/promises';
import path from 'node:path';

export async function writeJsonFile(outputPath: string, data: unknown, signal?: AbortSignal) {
	signal?.throwIfAborted();
	await fs.mkdir(path.dirname(outputPath), { recursive: true });
	signal?.throwIfAborted();

	const temporaryPath = `${outputPath}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
	let primaryError: unknown;
	let cleanupError: unknown;
	try {
		await fs.writeFile(temporaryPath, `${JSON.stringify(data, null, 2)}\n`, { encoding: 'utf-8', signal });
		signal?.throwIfAborted();
		await fs.rename(temporaryPath, outputPath);
	} catch (error) {
		primaryError = error;
	} finally {
		try {
			await fs.rm(temporaryPath, { force: true });
		} catch (error) {
			cleanupError = error;
		}
	}

	if (primaryError && cleanupError) {
		throw new AggregateError([primaryError, cleanupError], `Failed to write and clean temporary registry file '${temporaryPath}'.`);
	}
	if (primaryError) {
		throw primaryError;
	}
	if (cleanupError) {
		throw cleanupError;
	}
}
