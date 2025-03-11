interface DockerTag {
  name: string;
  last_updated: string;
}

interface DockerTagsResponse {
  results: DockerTag[];
  next: string | null;
}

/**
 * Fetches available versions for a Docker image from Docker Hub
 * @param imageName The name of the Docker image (e.g., 'postgres', 'mysql')
 * @returns A list of available versions, sorted by semver
 */
export async function getDockerImageVersions(imageName: string): Promise<string[]> {
  try {
    const response = await fetch(`https://hub.docker.com/v2/repositories/library/${imageName}/tags?page_size=100`);
    if (!response.ok) {
      throw new Error(`Failed to fetch versions for ${imageName}`);
    }

    const data = await response.json() as DockerTagsResponse;
    
    // Filter and sort versions
    const versions = data.results
      .map(tag => tag.name)
      .filter(version => {
        // Filter out non-version tags and development versions
        const isVersion = /^[0-9]+(\.[0-9]+)*(-alpine)?$/.test(version);
        const isDev = version.includes('alpha') || version.includes('beta') || version.includes('rc');
        return isVersion && !isDev;
      })
      .sort((a, b) => {
        // Sort versions in descending order
        const cleanA = a.replace('-alpine', '').split('.').map(Number);
        const cleanB = b.replace('-alpine', '').split('.').map(Number);
        
        for (let i = 0; i < Math.max(cleanA.length, cleanB.length); i++) {
          const numA = cleanA[i] || 0;
          const numB = cleanB[i] || 0;
          if (numA !== numB) {
            return numB - numA;
          }
        }
        
        // If versions are equal, prioritize alpine
        if (a.includes('alpine') && !b.includes('alpine')) return -1;
        if (!a.includes('alpine') && b.includes('alpine')) return 1;
        return 0;
      });

    return versions;
  } catch (error) {
    console.warn(`Failed to fetch Docker versions for ${imageName}:`, error);
    // Return a sensible default if we can't fetch versions
    return ['latest'];
  }
} 