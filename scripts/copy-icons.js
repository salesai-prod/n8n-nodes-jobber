const fs = require('fs');
const path = require('path');

function copyFiles(dir, baseDir) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const srcPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			copyFiles(srcPath, baseDir);
		} else if (/\.(png|svg)$/.test(entry.name)) {
			const destPath = srcPath.replace(baseDir, 'dist');
			fs.mkdirSync(path.dirname(destPath), { recursive: true });
			fs.copyFileSync(srcPath, destPath);
		}
	}
}

copyFiles('src', 'src');
