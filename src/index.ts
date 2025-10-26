// cli.ts (ESM)
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import readline from "node:readline";

type Action = "create" | "change";
interface Config {
  action: Action;
  appName?: string;
}

const rl = createInterface({ input, output });
const apps = ["alpha", "beta", "gamma"];
const config: Config = { action: "create" };

async function apiCall(cfg: Config): Promise<{ ok: boolean }> {
  await new Promise((r) => setTimeout(r, 1500));
  return { ok: true };
}

function spinner() {
  const frames = ["|", "/", "-", "\\"];
  let i = 0;
  const id = setInterval(
    () => output.write(`\r${frames[(i = (i + 1) % frames.length)]} processing`),
    120
  );
  return () => {
    clearInterval(id);
    output.write("\r \r");
  };
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms)),
  ]);
}

function selectFromList(items: string[]): Promise<string> {
  return new Promise((resolve) => {
    let idx = 0;
    function render() {
      output.write("\x1Bc");
      console.log("Select the app to update:\n");
      items.forEach((v, i) => console.log(i === idx ? `> ${v}` : `  ${v}`));
    }
    readline.emitKeypressEvents(input);
    if (input.isTTY) input.setRawMode(true);
    render();
    function onKeypress(_: string, key: readline.Key) {
      if (!key) return;
      if (key.name === "up") idx = (idx - 1 + items.length) % items.length;
      else if (key.name === "down") idx = (idx + 1) % items.length;
      else if (key.name === "return") {
        input.off("keypress", onKeypress);
        if (input.isTTY) input.setRawMode(false);
        output.write("\n");
        resolve(items[idx]!);
        return;
      } else if (key.name === "c" && key.ctrl) {
        process.exit(1);
      }
      render();
    }
    input.on("keypress", onKeypress);
  });
}

console.log("pincode-auth-gate");
const ans = await rl.question(
  "Create new pincode or change code in existing app? (c/e): "
);
config.action = ans.toLowerCase() === "e" ? "change" : "create";

if (config.action === "create") {
  config.appName = await rl.question(
    "Enter the app name for this new pincode: "
  );
} else {
  config.appName = await selectFromList(apps);
}

const stop = spinner();
try {
  const res = await withTimeout(apiCall(config), 10_000);
  stop();
  console.log(
    res.ok ? `done: ${config.action} ${config.appName}` : "failed: api error"
  );
} catch (e) {
  stop();
  console.log(
    (e as Error).message === "timeout"
      ? "failed: api timeout"
      : "failed: request error"
  );
}
rl.close();
process.exit(0);
