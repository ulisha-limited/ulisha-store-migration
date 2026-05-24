import fs from 'fs-extra'
import path from 'path'
import pLimit from 'p-limit'

import { supabase } from '../lib/supabase'
import { downloadImage } from '../utils/image_downloader'

const OUTPUT_DIR = path.join(process.cwd(), 'output')
const IMAGE_DIR = path.join(OUTPUT_DIR, 'product_images')

const limit = pLimit(5) // prevent overload

async function fetchProducts() {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      product_images (*),
      product_variants (*)
    `)

  if (error) throw error

  return data
}

async function downloadProductImages(product: any) {
  const productDir = path.join(IMAGE_DIR, product.id)

  if (!product.product_images?.length) return []

  const tasks = product.product_images.map((img: any, index: number) =>
    limit(async () => {
      const ext = path.extname(img.image_url.split('?')[0]) || '.jpg'

      const filePath = path.join(
        productDir,
        `image_${index + 1}${ext}`
      )

      await downloadImage(img.image_url, filePath)

      return {
        original_url: img.image_url,
        local_path: filePath
      }
    })
  )

  return Promise.all(tasks)
}

async function main() {
  await fs.ensureDir(OUTPUT_DIR)

  console.log('Fetching products...')
  const products = await fetchProducts()

  const exported: any[] = []

  for (const product of products) {
    console.log(`Processing product: ${product.name}`)

    const images = await downloadProductImages(product)

    exported.push({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      store_id: product.store_id,
      created_at: product.created_at,

      variants: product.product_variants || [],
      images
    })
  }

  await fs.writeJson(
    path.join(OUTPUT_DIR, 'products.json'),
    exported,
    { spaces: 2 }
  )

  console.log('Export completed!')
}

main().catch(console.error)
