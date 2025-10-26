// cli.ts (ESM)
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import readline from "node:readline";
import { createPincode, getApps, updatePincode } from "./db.js";

type Action = "create" | "change";
interface Config {
  action: Action;
  appName?: string;
}
type DbRow = {
  app_name: string;
  created_at: string;
  id: number;
  locked: boolean;
  pincode: string;
  times_used: number | null;
  updated_at: string;
};

const rl = createInterface({ input, output });
const config: Config = { action: "create" };

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
    const render = () => {
      output.write("\x1Bc");
      console.log("Select the app to update:\n");
      items.forEach((v, i) => console.log(i === idx ? `> ${v}` : `  ${v}`));
    };
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
      } else if (key.name === "c" && key.ctrl) process.exit(1);
      render();
    }
    input.on("keypress", onKeypress);
  });
}

console.log("pincode-auth-gate");
const ans = await rl.question(
  "Create new pincode or change code in existing app? (c = create/e = existing): "
);
config.action = ans.toLowerCase() === "e" ? "change" : "create";

if (config.action === "create") {
  config.appName = await rl.question(
    "Enter name of the app in which the pincode will be used in: "
  );

  const stopCreate = spinner();
  try {
    const rows = await withTimeout<DbRow[]>(
      createPincode(config.appName!),
      10_000
    );
    stopCreate();
    if (!rows || rows.length === 0) {
      console.log("failed: no data returned");
      rl.close();
      process.exit(1);
    }
    const r = rows[0]!;
    console.log("pincode created");
    console.log(`app: ${r.app_name}`);
    console.log(`pin: ${r.pincode}`);
    rl.close();
    process.exit(0);
  } catch (e) {
    stopCreate();
    console.log(
      (e as Error).message === "timeout"
        ? "failed: api timeout"
        : "failed: request error"
    );
    rl.close();
    process.exit(1);
  }
} else if (config.action === "change") {
  let apps: string[] | undefined;
  try {
    apps = await getApps();
  } catch {
    console.error("Error: failed to fetch app list.");
    rl.close();
    process.exit(1);
  }
  if (!apps || apps.length === 0) {
    console.log("No apps found. Exiting.");
    rl.close();
    process.exit(0);
  }
  config.appName = await selectFromList(apps);

  const stopUpdate = spinner();
  try {
    const rows = await withTimeout<DbRow[]>(
      updatePincode(config.appName!),
      10_000
    );
    stopUpdate();
    if (!rows || rows.length === 0) {
      console.log("failed: no data returned");
      rl.close();
      process.exit(1);
    }
    const r = rows[0]!;
    console.log("pincode updated");
    console.log(`app: ${r.app_name}`);
    console.log(`pin: ${r.pincode}`);
    console.log(`updated: ${r.updated_at}`);
    rl.close();
    process.exit(0);
  } catch (e) {
    stopUpdate();
    console.log(
      (e as Error).message === "timeout"
        ? "failed: api timeout"
        : "failed: request error"
    );
    rl.close();
    process.exit(1);
  }
}
