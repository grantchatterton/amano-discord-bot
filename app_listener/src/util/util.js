import child_process from "node:child_process";
import crypto from "node:crypto";
import process from "node:process";
import util, { TextEncoder } from "node:util";
import createHttpError from "http-errors";

export function hexToBytes(hex) {
	const len = hex.length / 2;
	const bytes = new Uint8Array(len);

	let index = 0;
	for (let i = 0; i < hex.length; i += 2) {
		const c = hex.slice(i, i + 2);
		const b = Number.parseInt(c, 16);
		bytes[index] = b;
		index += 1;
	}

	return bytes;
}

export async function verifySignature(secret, header, payload) {
	const parts = header.split("=");
	const sigHex = parts[1];

	const algorithm = { name: "HMAC", hash: { name: "SHA-256" } };

	const encoder = new TextEncoder();
	const keyBytes = encoder.encode(secret);
	const extractable = false;
	const key = await crypto.subtle.importKey("raw", keyBytes, algorithm, extractable, ["sign", "verify"]);

	const sigBytes = hexToBytes(sigHex);
	const dataBytes = encoder.encode(payload);
	const equal = await crypto.subtle.verify(algorithm.name, key, sigBytes, dataBytes);

	return equal;
}

export async function runCommand(command) {
	const exec = util.promisify(child_process.exec);
	const { stdout, stderr } = await exec(command);
	if (stderr) {
		console.error(`stderr: ${stderr}`);
		return createHttpError(500);
	}

	console.log(`stdout: ${stdout}`);
	return false;
}

export async function launchAmanoApp() {
	const command = process.env.APP_LAUNCH_SCRIPT_PATH;
	return runCommand(command);
}

export default {
	hexToBytes,
	verifySignature,
	runCommand,
	launchAmanoApp,
};
