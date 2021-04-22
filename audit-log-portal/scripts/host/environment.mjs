import path from "path"
import shell from "shelljs"
import modulePath from "./modulePath.mjs"

const setupEnvironment = () => {
  // Make sure the local infrastructure is running
  // Note: We need to move into the environment directory to allow the shell script to run properly.
  // This will be done relative to the portal root directory.
  process.chdir("../environment")

  const envSetupFilePath = path.resolve(modulePath, "../../../environment/setup.sh")
  const { stdout } = shell.exec(envSetupFilePath)
  console.log(stdout)
}

export { setupEnvironment }
