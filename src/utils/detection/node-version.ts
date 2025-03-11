import fs from 'fs';
import path from 'path';
import https from 'https';
import { execSync } from 'child_process';

export interface NodeVersions {
  projectVersion?: string;  // The version actually used in the project
  availableVersions: {
    ltsVersions: Array<{
      majorVersion: number;
      version: string;    // Latest minor version for this major
      name: string;
      date: string;
    }>;
    current: string;
    recommended: string;
  };
}

interface NodeRelease {
  version: string;
  date: string;
  lts: boolean | string;
}

const getMajorVersion = (version: string): number => {
  return parseInt(version.replace('v', '').split('.')[0], 10);
};

const fetchNodeVersions = async (): Promise<{ ltsVersions: Array<{ majorVersion: number; version: string; name: string; date: string }>; current: string }> => {
  return new Promise((resolve, reject) => {
    https.get('https://nodejs.org/dist/index.json', (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const versions = JSON.parse(data) as NodeRelease[];
          
          // Group by major version and get latest minor for each
          const ltsVersionMap = new Map<number, { version: string; name: string; date: string }>();
          
          versions.forEach(v => {
            if (v.lts) {
              const majorVersion = getMajorVersion(v.version);
              const existing = ltsVersionMap.get(majorVersion);
              
              // If we haven't seen this major version or this is a newer minor version
              if (!existing || getMajorVersion(existing.version) === majorVersion) {
                ltsVersionMap.set(majorVersion, {
                  version: v.version.replace('v', ''),
                  name: typeof v.lts === 'string' ? v.lts : 'Latest LTS',
                  date: v.date
                });
              }
            }
          });

          // Convert map to array and sort by major version descending
          const ltsVersions = Array.from(ltsVersionMap.entries())
            .map(([majorVersion, info]) => ({
              majorVersion,
              ...info
            }))
            .sort((a, b) => b.majorVersion - a.majorVersion)
            .slice(0, 3); // Keep only last 3 LTS major versions

          // Get latest version
          const current = versions[0]?.version?.replace('v', '') || '21.7.1';
          
          resolve({ 
            ltsVersions: ltsVersions.length > 0 ? ltsVersions : [{
              majorVersion: 20,
              version: '20.11.1',
              name: 'Hydrogen',
              date: '2024-02-14'
            }],
            current 
          });
        } catch (error) {
          console.error('Error parsing Node.js versions:', error);
          resolve({ 
            ltsVersions: [{
              majorVersion: 20,
              version: '20.11.1',
              name: 'Hydrogen',
              date: '2024-02-14'
            }],
            current: '21.7.1'
          });
        }
      });
    }).on('error', (error) => {
      console.error('Error fetching Node.js versions:', error);
      resolve({ 
        ltsVersions: [{
          majorVersion: 20,
          version: '20.11.1',
          name: 'Hydrogen',
          date: '2024-02-14'
        }],
        current: '21.7.1'
      });
    });
  });
};

const getSystemNodeVersion = (): string | undefined => {
  try {
    // Try to get Node version from the system
    const version = execSync('node -v', { encoding: 'utf8' }).trim();
    return version.startsWith('v') ? version.slice(1) : version;
  } catch (error) {
    console.error('Error getting system Node.js version:', error);
    return undefined;
  }
};

const readVersionFile = (filePath: string): string | undefined => {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8').trim();
      return content.startsWith('v') ? content.slice(1) : content;
    }
  } catch (error) {
    console.error(`Error reading version from ${filePath}:`, error);
  }
  return undefined;
};

export const detectNodeVersion = async (projectPath: string): Promise<NodeVersions> => {
  // First fetch available versions
  const { ltsVersions, current } = await fetchNodeVersions();
  
  const result: NodeVersions = {
    availableVersions: {
      ltsVersions,
      current,
      recommended: ltsVersions[0]?.version || '20.11.1' // Default to latest LTS
    }
  };

  // Try to detect project version in this order:
  // 1. .nvmrc (most explicit)
  // 2. .node-version
  // 3. Local node_modules/.bin/node version (if it exists)
  // 4. System Node.js version

  // Check .nvmrc
  const nvmVersion = readVersionFile(path.join(projectPath, '.nvmrc'));
  if (nvmVersion) {
    result.projectVersion = nvmVersion;
    return result;
  }

  // Check .node-version
  const nodeVersion = readVersionFile(path.join(projectPath, '.node-version'));
  if (nodeVersion) {
    result.projectVersion = nodeVersion;
    return result;
  }

  // Check local node_modules
  try {
    const localNodeBin = path.join(projectPath, 'node_modules', '.bin', 'node');
    if (fs.existsSync(localNodeBin)) {
      const version = execSync(`${localNodeBin} -v`, { encoding: 'utf8' }).trim();
      result.projectVersion = version.startsWith('v') ? version.slice(1) : version;
      return result;
    }
  } catch (error) {
    console.error('Error checking local node version:', error);
  }

  // Finally, try system Node version
  const systemVersion = getSystemNodeVersion();
  if (systemVersion) {
    result.projectVersion = systemVersion;
  }

  return result;
}; 