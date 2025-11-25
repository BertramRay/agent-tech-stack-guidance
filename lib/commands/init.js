const fs = require('fs-extra');
const path = require('path');
const { TARGET_DIR, getAvailableGuides } = require('../utils');

async function init() {
    try {
        console.log('Initializing .agent_guidance directory...');
        await fs.ensureDir(TARGET_DIR);

        const guides = await getAvailableGuides('en'); // Default list from English guides

        let content = `# Agent Guidance\n\n`;
        content += `This directory contains guidance documentation for your agent.\n`;
        content += `Use the \`agent-guidance add <query>\` command to add more guides.\n\n`;
        content += `## Available Guides\n\n`;

        if (guides.length === 0) {
            content += `No guides found in the bundled library.\n`;
        } else {
            guides.forEach(guide => {
                const name = path.basename(guide, '.md').replace('_guide_en', '');
                content += `- **${name}**: ${guide}\n`;
            });
        }

        const listPath = path.join(TARGET_DIR, 'guidance_list.md');
        await fs.writeFile(listPath, content);

        console.log(`Successfully initialized!`);
        console.log(`Created: ${listPath}`);
    } catch (error) {
        console.error('Error initializing:', error);
        process.exit(1);
    }
}

module.exports = { init };
