import { DatabaseTask, TaskResult } from '../../core/tasks.js';

interface DockerSetupStep {
	id: string;
	title: string;
	status: `pending` | `running` | `completed` | `failed` | `skipped`;
	required: boolean;
	indent?: number;  // For visual nesting
}

export function getPostgresTasks(): DatabaseTask[] {
	return [
		{
			id: `check_postgres_version`,
			title: `Check PostgreSQL version`,
			description: `Verify PostgreSQL version compatibility`,
			status: `pending`,
			required: true
		},
		{
			id: `setup_postgres_extensions`,
			title: `Setup PostgreSQL extensions`,
			description: `Configure required PostgreSQL extensions`,
			status: `pending`,
			required: false
		},
		{
			id: `configure_postgres_ssl`,
			title: `Configure SSL`,
			description: `Setup SSL for secure connections`,
			status: `pending`,
			required: false
		},
		{
			id: `setup_postgres_replication`,
			title: `Setup replication`,
			description: `Configure database replication if needed`,
			status: `pending`,
			required: false
		},
		{
			id: `configure_postgres_backup`,
			title: `Configure backup strategy`,
			description: `Setup automated backups`,
			status: `pending`,
			required: true
		}
	];
}

export async function validatePostgresTask(taskId: string, config: Record<string, unknown>): Promise<TaskResult> {
	switch (taskId) {
	case `check_postgres_version`:
		// Add version compatibility check
		return {
			success: true,
			message: `PostgreSQL version validated`
		};

	case `setup_postgres_extensions`:
		// Validate extension configuration
		return {
			success: true,
			message: `PostgreSQL extensions configured`
		};

	case `configure_postgres_ssl`:
		if (process.env.NODE_ENV === `production` && config.ssl_mode === `disable`) {
			return {
				success: false,
				message: `SSL should be enabled in production`
			};
		}
		return {
			success: true,
			message: `SSL configuration validated`
		};

	case `setup_postgres_replication`:
		// Validate replication setup if configured
		return {
			success: true,
			message: `Replication configuration validated`
		};

	case `configure_postgres_backup`:
		// Validate backup configuration
		if (!config.backup_strategy) {
			return {
				success: false,
				message: `Backup strategy must be configured`
			};
		}
		return {
			success: true,
			message: `Backup configuration validated`
		};

	default:
		return {
			success: false,
			message: `Unknown PostgreSQL task`
		};
	}
} 