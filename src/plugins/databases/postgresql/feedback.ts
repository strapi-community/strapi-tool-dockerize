import { FeedbackMessage } from '../../core/feedback-handler.js';
import { DatabaseConfig } from '../../../types/database.js';

export async function getPostgresInitFeedback(): Promise<FeedbackMessage[]> {
	return [
		{
			type: `info`,
			message: `PostgreSQL is recommended for production use`
		},
		{
			type: `info`,
			message: `Consider using connection pooling for better performance`
		},
		{
			type: `warning`,
			message: `Make sure to configure WAL (Write-Ahead Logging) for data integrity`
		}
	];
}

export async function getPostgresFeedback(
	field: string,
	value: string,
	config: Partial<DatabaseConfig>
): Promise<FeedbackMessage[]> {
	const feedback: FeedbackMessage[] = [];

	switch (field) {
	case `POSTGRES_DB`:
		if (value.length > 63) {
			feedback.push({
				type: `warning`,
				message: `PostgreSQL database names are limited to 63 characters`
			});
		}
		break;

	case `POSTGRES_USER`:
		if (value === `postgres`) {
			feedback.push({
				type: `warning`,
				message: `Using "postgres" as username is not recommended for security`
			});
		}
		break;

	case `POSTGRES_PASSWORD`:
		// PostgreSQL-specific password requirements
		if (!/[A-Z]/.test(value) || !/[a-z]/.test(value) || !/[0-9]/.test(value)) {
			feedback.push({
				type: `warning`,
				message: `PostgreSQL recommends passwords with mixed case and numbers`
			});
		}
		break;

	case `POSTGRES_PORT`:
		if (value !== `5432`) {
			feedback.push({
				type: `info`,
				message: `Using non-standard PostgreSQL port, ensure your connection string is updated`
			});
		}
		break;

	case `POSTGRES_SSL_MODE`:
		if (value === `disable` && process.env.NODE_ENV === `production`) {
			feedback.push({
				type: `warning`,
				message: `SSL should be enabled in production for PostgreSQL`
			});
		}
		if (value === `verify-full`) {
			feedback.push({
				type: `info`,
				message: `verify-full provides the highest level of SSL security`
			});
		}
		break;

	case `POSTGRES_SCHEMA`:
		if (value !== `public`) {
			feedback.push({
				type: `info`,
				message: `Using custom schema, remember to update search_path if needed`
			});
		}
		break;
	}

	return feedback;
} 