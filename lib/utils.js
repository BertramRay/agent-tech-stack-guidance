const fs = require('fs-extra');
const path = require('path');

const AGENT_DIR = path.join(__dirname, '../.agent');
const TARGET_DIR = path.join(process.cwd(), '.agent_guidance');

async function getAvailableGuides(lang = 'en') {
    const langDir = path.join(AGENT_DIR, lang);
    // console.log('Checking dir:', langDir);
    if (!await fs.pathExists(langDir)) {
        // console.log('Dir does not exist');
        return [];
    }
    const files = await fs.readdir(langDir);
    // console.log('Files found:', files);
    return files.filter(f => f.endsWith('.md'));
}

async function findGuide(query, lang = 'en') {
    let guides = await getAvailableGuides(lang);
    let matches = guides.filter(g => g.startsWith(query));

    if (matches.length === 0 && lang !== 'en') {
        // Fallback to English
        console.log(`No matches found for '${query}' in '${lang}'. Trying 'en'...`);
        guides = await getAvailableGuides('en');
        matches = guides.filter(g => g.startsWith(query));
        return { matches, lang: 'en' };
    }

    return { matches, lang };
}

module.exports = {
    AGENT_DIR,
    TARGET_DIR,
    getAvailableGuides,
    findGuide
};
