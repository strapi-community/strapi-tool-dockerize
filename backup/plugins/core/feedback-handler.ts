import { DatabaseConfig } from '../types/database.js';

export interface FeedbackMessage {
  type: `info` | `warning` | `error`;
  message: string;
}

export class CoreFeedbackHandler {
	static async getCommonFeedback(field: string, value: string, config: Partial<DatabaseConfig>): Promise<FeedbackMessage[]> {
		const feedback: FeedbackMessage[] = [];

		// Common database name validations
		if (field === `database`) {
			if (!value) {
				feedback.push({ type: `error`, message: `Database name is required` });
			}
			if (value.includes(` `)) {
				feedback.push({ type: `warning`, message: `Database name should not contain spaces` });
			}
			if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
				feedback.push({ type: `warning`, message: `Database name should only contain letters, numbers, underscores, and hyphens` });
			}
		}

		// Common username validations
		if (field === `username`) {
			if (!value) {
				feedback.push({ type: `error`, message: `Username is required` });
			}
			if (value === `root` || value === `admin`) {
				feedback.push({ type: `warning`, message: `Using common usernames like "root" or "admin" is not recommended` });
			}
		}

		// Common password validations
		if (field === `password`) {
			if (!value) {
				feedback.push({ type: `error`, message: `Password is required` });
			}
			if (value.length < 8) {
				feedback.push({ type: `warning`, message: `Password should be at least 8 characters long` });
			}
			if (value === config.username) {
				feedback.push({ type: `error`, message: `Password should not be the same as username` });
			}
		}

		// Common port validations
		if (field === `port`) {
			const port = parseInt(value);
			if (isNaN(port)) {
				feedback.push({ type: `error`, message: `Port must be a number` });
			}
			if (port < 1024) {
				feedback.push({ type: `warning`, message: `Using a port below 1024 requires root privileges` });
			}
			if (port > 65535) {
				feedback.push({ type: `error`, message: `Port must be between 1-65535` });
			}
		}

		return feedback;
	}

	static async getCommonInitFeedback(): Promise<FeedbackMessage[]> {
		return [
			{ 
				type: `info`, 
				message: `Remember to regularly backup your database` 
			},
			{ 
				type: `info`, 
				message: `Consider setting up database monitoring` 
			},
			{
				type: `info`,
				message: `Make sure to properly configure access permissions`
			}
		];
	}
} 