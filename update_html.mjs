import fs from 'fs';
let content = fs.readFileSync('index.html', 'utf8');

const pwaMetaTags = `
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
`;

if (!content.includes('mobile-web-app-capable')) {
    content = content.replace('<title>', pwaMetaTags + '\n    <title>');
    fs.writeFileSync('index.html', content);
}
