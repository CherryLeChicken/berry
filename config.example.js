// Configuration template for Berry app
// Copy this file to config.js and add your actual API key

const CONFIG = {
    // Get your API key from: https://makersuite.google.com/app/apikey
    GEMINI_API_KEY: 'AIzaSyBA-8QjQSUtjljTVt-fzGs3DurT8jdZpeE'
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}
