const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const IMAGES_DIR = path.join(__dirname, '../public/images');
const QUALITY = 85; // WebP quality (0-100)
const ENABLE_AVIF = false; // Set to true if you want AVIF too (less browser support)

// Supported input formats
const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png'];

// Statistics tracking
let stats = {
  total: 0,
  converted: 0,
  skipped: 0,
  errors: 0,
  originalSize: 0,
  newSize: 0,
  timeStart: Date.now()
};

async function getImageFiles(dir) {
  const files = [];
  
  try {
    const items = await fs.readdir(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory()) {
        // Recursively scan subdirectories (epochs)
        const subFiles = await getImageFiles(fullPath);
        files.push(...subFiles);
      } else if (item.isFile()) {
        const ext = path.extname(item.name).toLowerCase();
        if (SUPPORTED_FORMATS.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
  
  return files;
}

async function convertImage(inputPath) {
  const ext = path.extname(inputPath).toLowerCase();
  const dir = path.dirname(inputPath);
  const basename = path.basename(inputPath, ext);
  
  try {
    // Get original file size
    const originalStats = await fs.stat(inputPath);
    stats.originalSize += originalStats.size;
    
    // Convert to WebP
    const webpPath = path.join(dir, `${basename}.webp`);
    
    // Check if WebP already exists and is newer
    try {
      const webpStats = await fs.stat(webpPath);
      if (webpStats.mtime > originalStats.mtime) {
        console.log(`⏭️  Skipped (WebP exists): ${path.relative(IMAGES_DIR, inputPath)}`);
        stats.skipped++;
        return;
      }
    } catch (error) {
      // WebP doesn't exist, continue with conversion
    }
    
    console.log(`🔄 Converting: ${path.relative(IMAGES_DIR, inputPath)}`);
    
    // Convert image to WebP
    await sharp(inputPath)
      .webp({ 
        quality: QUALITY,
        effort: 6, // Higher effort = better compression but slower
        nearLossless: false
      })
      .toFile(webpPath);
    
    // Get new file size
    const webpStats = await fs.stat(webpPath);
    stats.newSize += webpStats.size;
    
    const savings = ((originalStats.size - webpStats.size) / originalStats.size * 100).toFixed(1);
    console.log(`✅ Converted: ${path.relative(IMAGES_DIR, inputPath)} (${savings}% smaller)`);
    
    stats.converted++;
    
    // Optional: Convert to AVIF as well
    if (ENABLE_AVIF) {
      const avifPath = path.join(dir, `${basename}.avif`);
      await sharp(inputPath)
        .avif({ 
          quality: QUALITY,
          effort: 6
        })
        .toFile(avifPath);
      console.log(`✅ AVIF created: ${path.relative(IMAGES_DIR, avifPath)}`);
    }
    
  } catch (error) {
    console.error(`❌ Error converting ${path.relative(IMAGES_DIR, inputPath)}:`, error.message);
    stats.errors++;
  }
}

async function main() {
  console.log('🚀 Starting image conversion to WebP...\n');
  
  // Check if images directory exists
  try {
    await fs.access(IMAGES_DIR);
  } catch (error) {
    console.error(`❌ Images directory not found: ${IMAGES_DIR}`);
    process.exit(1);
  }
  
  // Get all image files
  console.log('📁 Scanning for images...');
  const imageFiles = await getImageFiles(IMAGES_DIR);
  stats.total = imageFiles.length;
  
  console.log(`📊 Found ${stats.total} images to process\n`);
  
  if (stats.total === 0) {
    console.log('❌ No images found to convert');
    process.exit(0);
  }
  
  // Convert images with concurrency limit to avoid overwhelming the system
  const concurrency = 4; // Process 4 images at a time
  const batches = [];
  
  for (let i = 0; i < imageFiles.length; i += concurrency) {
    batches.push(imageFiles.slice(i, i + concurrency));
  }
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`\n📦 Processing batch ${i + 1}/${batches.length} (${batch.length} images)...`);
    
    await Promise.all(batch.map(convertImage));
  }
  
  // Print final statistics
  const totalTime = ((Date.now() - stats.timeStart) / 1000).toFixed(1);
  const totalSavings = ((stats.originalSize - stats.newSize) / stats.originalSize * 100).toFixed(1);
  const originalMB = (stats.originalSize / 1024 / 1024).toFixed(1);
  const newMB = (stats.newSize / 1024 / 1024).toFixed(1);
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 CONVERSION COMPLETE!');
  console.log('='.repeat(60));
  console.log(`📊 Total images: ${stats.total}`);
  console.log(`✅ Converted: ${stats.converted}`);
  console.log(`⏭️  Skipped: ${stats.skipped}`);
  console.log(`❌ Errors: ${stats.errors}`);
  console.log(`⏱️  Time taken: ${totalTime}s`);
  console.log(`💾 Original size: ${originalMB}MB`);
  console.log(`💾 New size: ${newMB}MB`);
  console.log(`🎯 Space saved: ${totalSavings}%`);
  console.log('='.repeat(60));
  
  if (stats.converted > 0) {
    console.log('\n🚀 Next steps:');
    console.log('1. Update your code to use WebP images');
    console.log('2. Test the app to ensure images load correctly');
    console.log('3. Enjoy faster loading times!');
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Run the conversion
main().catch(console.error);
