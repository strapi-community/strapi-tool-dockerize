import { createDatabasePlugin } from '../core/base-plugin';

export default createDatabasePlugin({
  name: 'MariaDB',
  defaultPort: 3306,
  containerName: 'mariadb',
  volumePath: '/var/lib/mysql'
}); 