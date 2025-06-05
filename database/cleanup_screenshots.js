#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Cleanup script to remove leftover screenshot files from web scraping
 */
function cleanupScreenshots() {
    console.log('🧹 Starting screenshot cleanup...');
    
    const currentDir = __dirname;
    const screenshotPattern = /^builder_\d+\.png$/;
    
    try {
        // Read all files in the current directory
        const files = fs.readdirSync(currentDir);
        
        // Filter for screenshot files
        const screenshotFiles = files.filter(file => screenshotPattern.test(file));
        
        if (screenshotFiles.length === 0) {
            console.log('✅ No screenshot files found to clean up');
            return;
        }
        
        console.log(`🗑️ Found ${screenshotFiles.length} screenshot files to remove...`);
        
        let removedCount = 0;
        let totalSize = 0;
        
        for (const file of screenshotFiles) {
            const filePath = path.join(currentDir, file);
            
            try {
                // Get file size before deletion
                const stats = fs.statSync(filePath);
                totalSize += stats.size;
                
                // Remove the file
                fs.unlinkSync(filePath);
                console.log(`   ✅ Removed: ${file} (${(stats.size / 1024 / 1024).toFixed(1)}MB)`);
                removedCount++;
                
            } catch (error) {
                console.log(`   ❌ Failed to remove ${file}: ${error.message}`);
            }
        }
        
        console.log(`\n🎉 Cleanup completed!`);
        console.log(`📊 Removed ${removedCount} files`);
        console.log(`💾 Freed up ${(totalSize / 1024 / 1024).toFixed(1)}MB of disk space`);
        
    } catch (error) {
        console.error('❌ Error during cleanup:', error.message);
        process.exit(1);
    }
}

// Run cleanup if called directly
if (require.main === module) {
    cleanupScreenshots();
}

module.exports = cleanupScreenshots;
