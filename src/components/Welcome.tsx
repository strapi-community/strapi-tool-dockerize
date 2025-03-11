import React, { FC } from 'react';
import { Box, Text } from 'ink';
import Gradient from 'ink-gradient';
import BigText from 'ink-big-text';

export const Welcome: FC = () => {
  return (
    <Box flexDirection="column" alignItems="center" marginBottom={1}>
      <Gradient name="pastel">
        <BigText text="Strapi Dockerize" />
      </Gradient>
      <Text>Create Docker and Docker-compose files for your Strapi project</Text>
    </Box>
  );
}; 