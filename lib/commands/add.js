const fs = require('fs-extra');
const path = require('path');
const { AGENT_DIR, TARGET_DIR, findGuide } = require('../utils');

async function add(query, options) {
    try {
        const lang = options.lang || 'en';
        console.log(`Searching for '${query}' (lang: ${lang})...`);

        const { matches, lang: foundLang } = await findGuide(query, lang);

        if (matches.length === 0) {
            console.error(`No guides found matching '${query}'.`);
            process.exit(1);
        }

        if (matches.length > 1) {
            console.log(`Multiple matches found:`);
            matches.forEach(m => console.log(`- ${m}`));
            console.log(`Please be more specific.`);
            process.exit(1);
        }

        const guideFile = matches[0];
        const sourcePath = path.join(AGENT_DIR, foundLang, guideFile);

        // Ensure target directory exists
        await fs.ensureDir(TARGET_DIR);

        const targetPath = path.join(TARGET_DIR, guideFile);

        if (await fs.pathExists(targetPath)) {
            console.log(`Guide '${guideFile}' already exists in .agent_guidance.`);
            return;
        }

        await fs.copy(sourcePath, targetPath);
        console.log(`Successfully added '${guideFile}' to .agent_guidance/`);

    } catch (error) {
        console.error('Error adding guide:', error);
        process.exit(1);
    }
}

module.exports = { add };
