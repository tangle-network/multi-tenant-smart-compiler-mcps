export interface ProgressUpdate {
  stage: string;
  message: string;
  filesCount?: number;
  milestone?: string;
  timestamp: number;
}

export interface ArtifactMetadata {
  id: string;
  agentType: string;
  location: string;
  filesCreated: number;
  totalSize: number;
  structure: string;
  keyFiles: string[];
  createdAt: number;
}

export interface TaskResult {
  success: boolean;
  summary: string;
  details: string;
  artifacts?: ArtifactMetadata;
  integrationNotes?: string;
  duration: number;
  error?: string;
}

export interface ArtifactContentRequest {
  artifactId: string;
  files?: string[];
  maxFiles?: number;
}

export interface ArtifactContent {
  artifactId: string;
  files: Array<{
    path: string;
    content: string;
    size: number;
  }>;
}
