import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// ==========================================================
// CONFIGURATION: Folder Input & Output
// ==========================================================
const INPUT_DIR = path.resolve('images/input');
const OUTPUT_DIR = path.resolve('images/output');
// ==========================================================

// Memastikan folder input ada
if (!fs.existsSync(INPUT_DIR)) {
  console.error('\x1b[31m%s\x1b[0m', `Error: Folder input "${INPUT_DIR}" tidak ditemukan.`);
  console.log('\x1b[36m%s\x1b[0m', 'TIPS: Silakan buat folder tersebut terlebih dahulu dan masukkan file-file SVG Anda ke dalamnya.');
  process.exit(1);
}

/**
 * Membaca seluruh file SVG secara rekursif di dalam folder dan sub-folder
 * @param {string} dir - Path folder yang sedang di-scan
 * @param {string} baseDir - Path folder root input sebagai acuan relative path
 * @returns {string[]} List path relatif file SVG dari root input
 */
function getSvgFilesRecursively(dir, baseDir = dir) {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of list) {
    const resPath = path.resolve(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(getSvgFilesRecursively(resPath, baseDir));
    } else if (entry.isFile() && path.extname(entry.name).toLowerCase() === '.svg') {
      const relativePath = path.relative(baseDir, resPath);
      results.push(relativePath);
    }
  }
  return results;
}

// Membaca semua file SVG secara rekursif dari folder input
const svgFiles = getSvgFilesRecursively(INPUT_DIR);

if (svgFiles.length === 0) {
  console.log('\x1b[33m%s\x1b[0m', `Info: Tidak ditemukan file .svg di dalam folder "${INPUT_DIR}" maupun sub-foldernya.`);
  process.exit(0);
}

console.log(`Menemukan ${svgFiles.length} file SVG. Mulai konversi...\n`);

const timestamp = Date.now();
let successCount = 0;
let failCount = 0;

// Mengonversi seluruh file SVG secara paralel
const promises = svgFiles.map(async (relativeSvgPath, index) => {
  const inputPath = path.join(INPUT_DIR, relativeSvgPath);
  
  // Dapatkan nama file asli (tanpa ekstensi)
  const fileExtension = path.extname(relativeSvgPath);
  const baseName = path.basename(relativeSvgPath, fileExtension);
  
  // Dapatkan subfolder relatif (misal: "20260620" atau ".")
  const relativeSubdir = path.dirname(relativeSvgPath);
  
  // Tentukan folder output absolut (misal: "images/output/20260620")
  const absoluteOutputDir = path.join(OUTPUT_DIR, relativeSubdir);
  
  // === OTOMATIS MEMBUAT FOLDER OUTPUT DAN SUB-FOLDER DI DALAMNYA JIKA BELUM ADA ===
  if (!fs.existsSync(absoluteOutputDir)) {
    fs.mkdirSync(absoluteOutputDir, { recursive: true });
  }

  const outputFileName = `${baseName}-${timestamp}.png`;
  const outputPath = path.join(absoluteOutputDir, outputFileName);

  try {
    let svgContent = fs.readFileSync(inputPath, 'utf8');
    
    // Otomatis mengubah fill putih (#fff, #ffffff, white) menjadi transparan (none)
    svgContent = svgContent.replace(/fill="(?:#fff(?:fff)?|white)"/gi, 'fill="none"');
    
    const svgBuffer = Buffer.from(svgContent);

    await sharp(svgBuffer)
      .resize(90, 90, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 } // Background transparan
      })
      .png()
      .toFile(outputPath);
      
    // Normalkan garis miring path (Windows ke Unix-style untuk display log agar rapi)
    const outputRelativePath = path.join(relativeSubdir, outputFileName).replace(/\\/g, '/');
    const inputRelativePath = relativeSvgPath.replace(/\\/g, '/');
    
    console.log('\x1b[32m%s\x1b[0m', `[${index + 1}/${svgFiles.length}] ✔ Berhasil: ${inputRelativePath} -> ${outputRelativePath}`);
    successCount++;
  } catch (err) {
    console.error('\x1b[31m%s\x1b[0m', `[${index + 1}/${svgFiles.length}] ✘ Gagal: ${relativeSvgPath} (${err.message})`);
    failCount++;
  }
});

// Menampilkan ringkasan setelah selesai
Promise.all(promises).then(() => {
  console.log('\n==================================================');
  console.log('\x1b[36m%s\x1b[0m', ' STATUS KONVERSI SELESAI');
  console.log('==================================================');
  console.log('\x1b[32m%s\x1b[0m', ` ✔ Berhasil dikonversi : ${successCount} file`);
  if (failCount > 0) {
    console.log('\x1b[31m%s\x1b[0m', ` ✘ Gagal dikonversi    : ${failCount} file`);
  }
  console.log(` Output folder         : ${OUTPUT_DIR}`);
  console.log('==================================================');
});
