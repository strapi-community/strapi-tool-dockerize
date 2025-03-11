import React, { FC, useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { detectProject } from '../utils/detection';
import { ProjectInfo } from '../utils/detection';

interface ProjectDetectionProps {
  projectPath: string;
  onDetectionComplete: (info: ProjectInfo) => void;
  debug?: boolean;
}

export const ProjectDetection: FC<ProjectDetectionProps> = ({ projectPath, onDetectionComplete, debug }) => {
  const [status, setStatus] = useState<string>('Analyzing project...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const detect = async () => {
      try {
        if (debug) {
          console.log('Starting project detection at:', projectPath);
        }
        setStatus('Checking project structure...');
        const info = await detectProject(projectPath);

        // A valid Strapi project must have a name and version
        if (!info.name || !info.strapiVersion) {
          if (debug) {
            console.log('Not a Strapi project:', info);
          }
          setError('Not a Strapi project. Please run this command in a Strapi project directory.');
          return;
        }

        if (debug) {
          console.log('Project detected successfully:', info);
        }
        setStatus('Project detected successfully!');
        onDetectionComplete(info);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        if (debug) {
          console.error('Error during project detection:', err);
        }
        setError(errorMessage);
      }
    };

    detect();
  }, [projectPath, debug]);

  if (error) {
    return (
      <Box flexDirection="column">
        <Text color="red">Error: {error}</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Text color="green">
        <Spinner type="dots" />
      </Text>
      <Text> {status}</Text>
    </Box>
  );
}; 