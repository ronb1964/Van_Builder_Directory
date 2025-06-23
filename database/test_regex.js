// Quick test of regex patterns on Sandy Vans footer text
const footerText = "CA619.812.1903Contact@sandyvans.comShop";

console.log('Testing regex patterns on:', footerText);

// Test phone patterns
const phonePatterns = [
    /CA(\d{3}\.\d{3}\.\d{4})Contact/g,
    /\b(\d{3}\.\d{3}\.\d{4})\b/g,
    /(\d{3}\.\d{3}\.\d{4})/g
];

phonePatterns.forEach((pattern, i) => {
    const match = footerText.match(pattern);
    console.log(`Phone pattern ${i+1}: ${pattern} -> ${match ? match[0] : 'No match'}`);
});

// Test email patterns
const emailPatterns = [
    /(\w+@\w+\.\w+)(?:Shop|Hours)/i,
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g
];

emailPatterns.forEach((pattern, i) => {
    const match = footerText.match(pattern);
    console.log(`Email pattern ${i+1}: ${pattern} -> ${match ? match[0] : 'No match'}`);
}); 