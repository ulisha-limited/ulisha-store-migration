import fs from "fs-extra";
import path from "path";
import axios from "axios";

export async function downloadImage(url: string, filePath: string) {
  await fs.ensureDir(path.dirname(filePath));

  if (await fs.pathExists(filePath))
    return console.info(`Skipping download: ${filePath}`);

  const response = await axios.get(url, {
    responseType: "stream",
  });

  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(filePath);

    response.data.pipe(writer);

    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}
