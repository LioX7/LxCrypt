import os from "os";
import prompts from "prompts";
import kleur from "kleur";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const extension = ".lxc";
const algorithm = "aes-256-ctr";
const hash_algorithm = "SHA3-256";

start();

async function start() {
  const response = await prompts({
    type: "select" as const,
    name: "start",
    message: "Please select the application mode.",
    choices: [
      { title: "Encrypt", description: "", value: 1 },
      { title: "Decrypt", description: "", value: 2 },
      { title: "Logs", description: "", value: 3, disabled: true },
    ],
    initial: 0,
  });
  const file = filepath();
  if (response.start === 1) encrypt(await file);
  else if (response.start === 2) decrypt(await file);
  else logs();
}
async function filepath() {
  const response = await prompts({
    type: "text" as const,
    name: "file",
    message:
      "Please drag the file into the console window. If this doesn't work, you can just enter the path.",
  });
  return response.file.replace(/["]+/g, "");
}
async function close() {
  const response = await prompts({
    type: "confirm" as const,
    name: "confirmation",
    message: "Do you want to close the application?",
    initial: false,
  });
  if (response.confirmation === true) process.exit(0);
  else start();
}

function hash(password: string) {
  return crypto.createHash(hash_algorithm).update(password).digest();
}

async function getpath(file: string) {
  const response = await prompts({
    type: "select" as const,
    name: "filepath",
    message: "Please select the location for the new file.",
    choices: [
      { title: "Original Path", value: 1 },
      { title: "Desktop", value: 2 },
      { title: "Application Path", value: 3 },
    ],
    initial: 0,
  });
  if (response.filepath === 1) return file;
  else if (response.filepath === 2) {
    return path.join(os.homedir(), "Desktop", path.basename(file));
  } else {
    return path.join(path.resolve("./"), path.basename(file));
  }
}

async function encrypt(file: string) {
  const response = await prompts({
    type: "password" as const,
    name: "password",
    message:
      "Please enter the password which you want to use to encrypt the file.",
  });
  const readstream = fs.createReadStream(file);
  const password = response.password;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, hash(password), iv);
  const writestream = fs.createWriteStream((await getpath(file)) + extension);
  readstream.pipe(cipher).pipe(writestream);
  console.log(
    kleur.green("The file encryption process is done! Please save the IV!")
  );
  console.log(kleur.red().bold("IV: " + iv.toString("base64")));
  close();
}
async function decrypt(file: string) {
  const questions = [
    {
      type: "password" as const,
      name: "password",
      message: "Please enter the password which you used to encrypt the file.",
    },
    {
      type: "text" as const,
      name: "iv",
      message:
        "Please enter the IV which you got at the end of the encryption process.",
    },
  ];
  const response = await prompts(questions);
  const readstream = fs.createReadStream(file);
  const password = response.password;
  const iv = Buffer.from(response.iv, "base64");
  const decipher = crypto.createDecipheriv(algorithm, hash(password), iv);
  const parsed = path.parse(file);
  const writestream = fs.createWriteStream(
    await getpath(path.join(parsed.dir, parsed.name))
  );
  try {
    readstream.pipe(decipher).pipe(writestream);
  } catch (error) {
    console.log(kleur.red("The IV or Password is not correct."));
    close();
  }
  console.log(kleur.green("The file decryption process is done!"));
  close();
}
async function logs() {
  // TODO: Logging...
  process.exit(0);
}
