import type { DatabasePlugin } from '@/types/database';
import { PostgresPlugin } from './postgresql';

export const getDatabasePlugin = (type: string | null): DatabasePlugin | null => {
	if (!type) return null;

	switch (type) {
		case 'postgresql':
			return new PostgresPlugin();
		default:
			return null;
	}
};

export type { DatabasePlugin }; 