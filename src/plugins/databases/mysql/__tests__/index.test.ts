import { describe } from 'vitest';
import plugin from '../index';
import { createPluginTestSuite } from '../../core/__tests__/plugin-test-suite';

createPluginTestSuite('MySQL', plugin); 