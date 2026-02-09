import fs from 'fs';
import { execSync } from 'child_process';

// Check for duplicate React
try {
  const result = execSync('node -e "console.log(require.resolve(\'react\'))"', { encoding: 'utf8', cwd: 'C:/Users/info/orchids-projects/dream60website-1' });
  console.log('React resolve:', result.trim());
} catch(e) {}

// Check node_modules for multiple react folders
try {
  const result = execSync('dir /s /b node_modules\\react\\package.json', { encoding: 'utf8', cwd: 'C:/Users/info/orchids-projects/dream60website-1' });
  console.log('React package.json locations:', result.trim());
} catch(e) {
  console.log('Error finding react:', e.message);
}

// Check vite config
try {
  const vite = fs.readFileSync('vite.config.ts', 'utf8');
  console.log('=== vite.config.ts ===');
  console.log(vite);
} catch(e) {
  console.log('No vite.config.ts');
}
