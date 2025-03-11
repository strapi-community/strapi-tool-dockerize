import { createDatabasePlugin } from '../core/base-plugin';

export default createDatabasePlugin({
  name: 'PostgreSQL',
  defaultPort: 5432,
  containerName: 'postgres',
  volumePath: '/var/lib/postgresql/data'
}); 