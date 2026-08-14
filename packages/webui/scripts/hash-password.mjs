import { randomBytes, scryptSync } from "node:crypto";

const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);

const password = Buffer.concat(chunks)
	.toString("utf8")
	.replace(/[\r\n]+$/, "");
if (!password) {
	console.error("Read a non-empty password from stdin.");
	process.exit(1);
}

const salt = randomBytes(16);
const digest = scryptSync(password, salt, 64);
process.stdout.write(
	`scrypt:${salt.toString("hex")}:${digest.toString("hex")}\n`
);
