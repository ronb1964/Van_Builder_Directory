// Cleanup utilities for van builder scraper
const fs = require('fs');
const path = require('path');

async function cleanupTempFiles(directory) {
    console.log('\n🧹 Cleaning up temporary files...');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
        console.log(`📁 Created directory: ${directory}`);
        console.log('✅ No temporary files to clean up');
        return { deletedCount: 0, totalSize: 0 };
    }
    
    const filePatterns = [
        /^screenshot_.*\.png$/,     // Screenshot files
        /^page_.*\.html$/,         // Saved HTML files
        /^debug_.*\.txt$/,         // Debug files
        /^temp_.*$/,                // Any temp files
        /^scraped_.*\.json$/,       // Temporary scraped data files
        /^builder_.*\.tmp$/         // Temporary builder files
    ];
    
    let deletedCount = 0;
    let totalSize = 0;
    
    try {
        const files = fs.readdirSync(directory);
        
        for (const file of files) {
            const filepath = path.join(directory, file);
            const stats = fs.statSync(filepath);
            
            // Only process files, not directories
            if (stats.isFile()) {
                const shouldDelete = filePatterns.some(pattern => pattern.test(file));
                
                if (shouldDelete) {
                    try {
                        totalSize += stats.size;
                        fs.unlinkSync(filepath);
                        deletedCount++;
                        console.log(`  ✅ Deleted: ${file} (${formatFileSize(stats.size)})`);
                    } catch (error) {
                        console.log(`  ⚠️ Failed to delete ${file}: ${error.message}`);
                    }
                }
            }
        }
        
        if (deletedCount > 0) {
            console.log(`\n✅ Cleanup complete: ${deletedCount} files removed (${formatFileSize(totalSize)} total)`);
        } else {
            console.log('\n✅ No temporary files to clean up');
        }
        
    } catch (error) {
        console.error('❌ Error during cleanup:', error.message);
    }
    
    return { deletedCount, totalSize };
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function cleanupBrowserResources(browser, context) {
    try {
        if (context) {
            await context.close();
        }
        if (browser) {
            await browser.close();
        }
        console.log('✅ Browser resources cleaned up');
    } catch (error) {
        console.error('❌ Error closing browser:', error.message);
    }
}

async function cleanupOldDataFiles(directory, daysToKeep = 7) {
    console.log(`\n🗂️ Cleaning up old data files (keeping last ${daysToKeep} days)...`);
    
    if (!fs.existsSync(directory)) {
        console.log('✅ No data directory to clean');
        return { deletedCount: 0, totalSize: 0 };
    }
    
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - (daysToKeep * 24 * 60 * 60 * 1000));
    
    let deletedCount = 0;
    let totalSize = 0;
    
    try {
        const files = fs.readdirSync(directory);
        
        for (const file of files) {
            // Only clean up JSON files that match the van_builders pattern
            if (file.startsWith('van_builders_') && file.endsWith('.json')) {
                const filepath = path.join(directory, file);
                const stats = fs.statSync(filepath);
                
                if (stats.mtime < cutoffDate) {
                    try {
                        totalSize += stats.size;
                        fs.unlinkSync(filepath);
                        deletedCount++;
                        console.log(`  ✅ Deleted old file: ${file} (${formatFileSize(stats.size)})`);
                    } catch (error) {
                        console.log(`  ⚠️ Failed to delete ${file}: ${error.message}`);
                    }
                }
            }
        }
        
        if (deletedCount > 0) {
            console.log(`\n✅ Cleaned up ${deletedCount} old data files (${formatFileSize(totalSize)} freed)`);
        } else {
            console.log('\n✅ No old data files to clean up');
        }
        
    } catch (error) {
        console.error('❌ Error during data file cleanup:', error.message);
    }
    
    return { deletedCount, totalSize };
}

module.exports = {
    cleanupTempFiles,
    formatFileSize,
    cleanupBrowserResources,
    cleanupOldDataFiles
};
