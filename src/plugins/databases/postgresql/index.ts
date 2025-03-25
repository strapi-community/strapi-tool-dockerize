import type { DatabasePlugin, DatabaseAnswers } from '@/types/database';
import type { Question } from '@/types/cli';
import type { DockerSetupTask } from '@/types/docker';
import { getPostgresDockerTasks, validatePostgresDockerTask, updatePostgresTaskStatus } from './docker-tasks';

export class PostgresPlugin implements DatabasePlugin {
	name = 'PostgreSQL';
	description = 'PostgreSQL database plugin';
	version = '1.0.0';

	getQuestions(): Promise<Question[]> {
		return Promise.resolve([]);
	}

	processAnswers(answers: Record<string, unknown>): DatabaseAnswers {
		return {
			database: {
				type: 'postgresql',
				connection: {
					host: 'localhost',
					port: 5432,
					database: 'strapi',
					username: 'strapi',
					password: 'strapi'
				}
			}
		};
	}

	validateConfig(config: DatabaseAnswers): Promise<boolean> {
		return Promise.resolve(true);
	}

	async getDockerTasks(): Promise<DockerSetupTask[]> {
		return getPostgresDockerTasks();
	}

	validateDockerTask(taskId: string, config: DatabaseAnswers): boolean {
		return validatePostgresDockerTask(taskId, config);
	}

	updateTaskStatus(tasks: DockerSetupTask[], taskId: string, status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'): void {
		updatePostgresTaskStatus(tasks, taskId, status);
	}
} 