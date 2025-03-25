import { GenerationStep, GenerationStatus } from '../../types/generation.js';

export interface GenerationContext {
  config: Record<string, any>;
  steps: GenerationStep[];
  updateStatus: (status: GenerationStatus | ((prev: GenerationStatus) => GenerationStatus)) => void;
} 