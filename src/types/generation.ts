export interface GenerationSubtask {
  message: string;
  status: `pending` | `running` | `done`;
}

export interface GenerationStep {
  step: `dockerfile` | `compose` | `env` | `done`;
  message: string;
  subtasks: GenerationSubtask[];
}

export interface GenerationStatus {
  step: GenerationStep[`step`];
  currentSubtask: number;
} 