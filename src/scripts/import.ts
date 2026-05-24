import "dotenv/config";
import fs from "fs-extra";
import axios from "axios";
import FormData from "form-data";
import path from "path";
import { Product } from "../types/product";

async function main() {
  const products: Product[] = await fs.readJson("./output/products.json");

  if (!Object.keys(products).length) {
    console.error("No products to import, please run `npm run export` first");
    return;
  }

  const endpoint = process.env.ULISHA_STORE_API_ENDPOINT;
  if (!endpoint) {
    console.error("ULISHA_STORE_API_ENDPOINT is not set");
    return;
  }

  const session = process.env.ULISHA_STORE_SESSION;
  if (!session) {
    console.error("ULISHA_STORE_SESSION is not set");
    return;
  }

  const categoryUlid = process.env.ULISHA_STORE_CATEGORY_ULID;
  if (!categoryUlid) {
    console.error("ULISHA_STORE_CATEGORY_ULID is not set");
    return;
  }

  for (const product of Object.values(products)) {
    const form = new FormData();

    const name = product.name;

    const rawIsActive = product.is_active;
    const isActive =
      typeof rawIsActive === "boolean"
        ? rawIsActive
        : typeof rawIsActive === "number"
          ? rawIsActive === 1
          : typeof rawIsActive === "string"
            ? !["0", "false", "no"].includes(rawIsActive.toLowerCase())
            : true;

    if (!name) {
      console.error(
        `Skipping ${product.id}: missing required fields (name/category_ulid/brand)`,
      );
      continue;
    }

    form.append("name", String(name));
    form.append("description", String(product.description));
    form.append("short_description", String(product.description).split(".")[0]);
    form.append("category_ulid", categoryUlid);
    form.append("is_active", isActive ? "1" : "0");
    form.append("brand", "others");

    const variants = Array.isArray(product.variants) ? product.variants : [];
    const normalizedVariants =
      variants.length > 0
        ? variants
        : [
            {
              variant_name: product.name ?? "Default",
              price: product.price ?? 0,
              stock: 0,
            },
          ];

    for (const [index, variant] of normalizedVariants.entries()) {
      const variantName =
        variant.variant_name ?? variant.name ?? variant.title ?? "Default";
      const price = variant.price ?? product.price ?? 0;
      const stock = variant.stock ?? 0;

      form.append(`variants[${index}][variant_name]`, String(variantName));
      form.append(`variants[${index}][price]`, String(price));
      form.append(`variants[${index}][stock]`, "100");

      if (variant.color) {
        form.append(`variants[${index}][color]`, String(variant.color));
      }
      if (variant.size) {
        form.append(`variants[${index}][size]`, String(variant.size));
      }
      if (variant.barcode) {
        form.append(`variants[${index}][barcode]`, String(variant.barcode));
      }
      if (variant.sku) {
        form.append(`variants[${index}][sku]`, String(variant.sku));
      }

      const imageUrls = Array.isArray(variant.image_url)
        ? variant.image_url
        : variant.image_url
          ? [variant.image_url]
          : [];
      for (const [imgIndex, url] of imageUrls.entries()) {
        form.append(`variants[${index}][image_url][${imgIndex}]`, String(url));
      }

      const videoUrls = Array.isArray(variant.video_url)
        ? variant.video_url
        : variant.video_url
          ? [variant.video_url]
          : [];
      for (const [vidIndex, url] of videoUrls.entries()) {
        form.append(`variants[${index}][video_url][${vidIndex}]`, String(url));
      }
    }

    const mimeTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".gif": "image/gif",
      ".mp4": "video/mp4",
      ".webm": "video/webm",
      ".mov": "video/quicktime",
    };

    if (Array.isArray(product.images)) {
      for (const [index, img] of product.images.entries()) {
        const fileStream = fs.createReadStream(img.local_path);
        const ext = path.extname(img.local_path).toLowerCase();
        const contentType = mimeTypes[ext] ?? "application/octet-stream";
        const filename = path.basename(img.local_path);

        form.append(`media[${index}][type]`, "image");
        form.append(`media[${index}][name]`, filename);
        form.append(`media[${index}][file]`, fileStream, {
          filename,
          contentType,
        });
      }
    }

    try {
      const response = await axios.post(`${endpoint}/vendor/products`, form, {
        headers: {
          ...form.getHeaders(),
          Cookie: `ulisha_store_laravel_session=${session}`,
          "User-Agent": "UlishaStoreMigrationBot/1.0",
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });

      console.log(`Uploaded product ${product.id}`, response.status);
    } catch (err) {
      console.error(`Failed for ${product.id}`, err);
    }
  }
}

main().catch(console.error);
