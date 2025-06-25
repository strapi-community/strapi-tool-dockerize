import type { DockerSetupTask } from '@/types/docker';
import type { DatabaseAnswers } from '@/types/database';

export function getPostgresDockerTasks(): DockerSetupTask[] {
	return [
		{
			id: `postgres_service`,
			title: `Setting up PostgreSQL service`,
			status: `pending`,
			required: true,
			subtasks: [
				{
					id: `postgres_image`,
					title: `Configuring PostgreSQL image`,
					status: `pending`,
					required: true
				},
				{
					id: `postgres_network`,
					title: `Setting up network configuration`,
					status: `pending`,
					required: true
				},
				{
					id: `postgres_volume`,
					title: `Configuring data volume`,
					status: `pending`,
					required: true
				},
				{
					id: `postgres_env`,
					title: `Setting environment variables`,
					status: `pending`,
					required: true
				}
			]
		},
		{
			id: `postgres_config`,
			title: `Configuring PostgreSQL settings`,
			status: `pending`,
			required: true,
			subtasks: [
				{
					id: `postgres_init`,
					title: `Setting up initialization scripts`,
					status: `pending`,
					required: true
				},
				{
					id: `postgres_conf`,
					title: `Configuring postgresql.conf`,
					status: `pending`,
					required: false
				},
				{
					id: `postgres_hba`,
					title: `Configuring pg_hba.conf`,
					status: `pending`,
					required: false
				}
			]
		},
		{
			id: `postgres_healthcheck`,
			title: `Setting up health checks`,
			status: `pending`,
			required: true
		}
	];
}

export function validatePostgresDockerTask(taskId: string, config: DatabaseAnswers): boolean {
	switch (taskId) {
	case `postgres_env`:
		return !!(config.database?.name && config.database?.username && config.database?.password);
	case `postgres_volume`:
		return !!config.database?.dataPath;
	default:
		return true;
	}
}

export function updatePostgresTaskStatus(tasks: DockerSetupTask[], taskId: string, status: `pending` | `running` | `completed` | `failed` | `skipped`): void {
	for (const task of tasks) {
		if (task.id === taskId) {
			task.status = status;
			return;
		}
		if (task.subtasks) {
			for (const subtask of task.subtasks) {
				if (subtask.id === taskId) {
					subtask.status = status;
					return;
				}
			}
		}
	}
} 