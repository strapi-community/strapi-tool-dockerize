export interface LTSVersion {
  majorVersion: number;
  version: string;
  name: string;
  date: string;
}

export interface AvailableVersions {
  ltsVersions: LTSVersion[];
  current: string;
  recommended: string;
}

export interface NodeVersions {
  projectVersion?: string;
  availableVersions: AvailableVersions;
} 