import React, { FC, useState } from 'react';
import { Box } from 'ink';
import { Welcome } from './Welcome.js';
import { ProjectDetection } from './ProjectDetection.js';
import { ProjectSetup } from './ProjectSetup.js';
import { CLIOptions } from '../types/cli.js';
import { ProjectInfo } from '../utils/detection/index.js';

interface AppProps {
  options: CLIOptions;
  projectPath: string;
}

export const App: FC<AppProps> = ({ options, projectPath }) => {
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);

  const handleDetectionComplete = (info: ProjectInfo) => {
    if (options.debug) {
      console.log('Project detection completed:', info);
    }
    setProjectInfo(info);
  };

  return (
    <Box flexDirection="column">
      <Welcome />
      {!projectInfo ? (
        <ProjectDetection 
          projectPath={projectPath} 
          onDetectionComplete={handleDetectionComplete}
          debug={options.debug}
        />
      ) : (
        <ProjectSetup options={options} projectInfo={projectInfo} />
      )}
    </Box>
  );
}; 