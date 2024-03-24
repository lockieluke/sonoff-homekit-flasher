import {$, Glob} from "bun";
import tmp from "tmp-promise";
import {glob} from "glob";
import * as fs from "fs-extra";
import * as path from "path";
import {fileURLToPath} from "url";
import exitHook from "async-exit-hook";
import ora from "ora";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function isToolInstalled(tool: string) {
    return (await $`which ${tool}`.quiet()).exitCode == 0;
}

if (!await isToolInstalled("pyinstaller")) {
    console.error("pyinstaller is not installed. Please install it using `pipx install pyinstaller`, make sure pyserial and intelhex are installed into its virtual environment");
    process.exit(1);
}

if (!await isToolInstalled("git")) {
    console.error("git is not installed. Please install it using `brew install git`");
    process.exit(1);
}

if (!await isToolInstalled("wine")) {
    console.error("wine is not installed. Please install it using `brew tap Gcenx/homebrew-wine && brew install --cask wine-crossover`");
}

const skippingWineChecks = process.argv.includes("--skip-wine-checks");
if (!skippingWineChecks) {
    const spinner = ora("Checking wine environment").start();
    const winPythonPath = (await glob(`${Bun.env.HOME}/.wine/drive_c/users/*/AppData/Local/Programs/Python/Python3*/python.exe`))[0];
    spinner.info("Making sure pyinstaller, pyserial and intelhex are installed in the wine environment");
    await $`wine ${winPythonPath} -m pip install pyinstaller pyserial intelhex`.quiet();
    spinner.succeed("Dependencies installed");
}

const {path: localRepoDir} = await tmp.dir();

async function cleanup() {
    await fs.rm(localRepoDir, {
        recursive: true
    });
}

exitHook(async cb => {
    await cleanup();
    cb();
});

exitHook.uncaughtExceptionHandler(async (err, done) => {
    console.error(err);
    await cleanup();
    done();
});

exitHook.unhandledRejectionHandler(async (err, done) => {
    console.error(err);
    await cleanup();
    done();
});

const spinner = ora("Cloning esptool repository").start();
await $`cd ${localRepoDir} && git clone https://github.com/espressif/esptool.git .`.quiet();

spinner.text = "Building esptool for macOS";
await $`pyinstaller --distpath ./dist -n esptool-universal-apple-darwin -F --icon=ci/espressif.ico --add-data="./esptool/targets/stub_flasher/*.json:./esptool/targets/stub_flasher/" --target-arch=universal2 esptool.py`.cwd(localRepoDir).quiet();

spinner.info("Building esptool for Windows");
const winPyinstallerPath = (await glob(`${Bun.env.HOME}/.wine/drive_c/users/*/AppData/Local/Programs/Python/Python3*/Scripts/pyinstaller.exe`))[0];
await $`wine ${winPyinstallerPath} --distpath ./dist-win -n esptool-x86_64-pc-windows-msvc.exe --hide-console hide-early -F --icon=ci/espressif.ico --add-data="./esptool/targets/stub_flasher/*.json:./esptool/targets/stub_flasher/" esptool.py`.env({
    "WINEDEBUG": "fixme-all"
}).quiet().cwd(localRepoDir);

spinner.text = "Built esptool for macOS and Windows";

const binsPath = path.join(__dirname, "..", "src-tauri", "bin");

const winBinsGlob = new Glob("dist-win/esptool*");
for await (const file of winBinsGlob.scan(localRepoDir)) {
    const filePath = path.join(localRepoDir, file);
    const fileName = path.basename(filePath);
    await fs.copy(filePath, path.join(binsPath, fileName));
}

const binsGlobal = new Glob("dist/esptool*");
for await (const file of binsGlobal.scan(localRepoDir)) {
    const filePath = path.join(localRepoDir, file);
    const fileName = path.basename(filePath);
    await fs.copy(filePath, path.join(binsPath, fileName));
}

spinner.succeed("Creating links for esptool binaries");

for (const linkName of ["esptool-aarch64-apple-darwin", "esptool-x86_64-apple-darwin"]) {
    const linkPath = path.join(binsPath, linkName);
    await fs.link(path.join(binsPath, "esptool-universal-apple-darwin"), linkPath);
}

await fs.rm(localRepoDir, {
    recursive: true
});

spinner.succeed("esptool binaries built and linked");