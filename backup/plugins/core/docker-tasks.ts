export interface DockerSetupStep {
  id: string;
  title: string;
  status: `pending` | `running` | `completed` | `failed` | `skipped`;
  required: boolean;
  indent?: number;  // For visual nesting in the output
}

export interface DockerSetupTask extends DockerSetupStep {
  subtasks?: DockerSetupStep[];
}

export class BaseDockerTasks {
	static getBaseTasks(): DockerSetupTask[] {
		return [
			{
				id: `dockerfile_generation`,
				title: `Setting up Dockerfile configuration`,
				status: `pending`,
				required: true,
				subtasks: [
					{
						id: `base_image`,
						title: `Configuring Node.js base image`,
						status: `pending`,
						required: true,
						indent: 1
					},
					{
						id: `node_setup`,
						title: `Setting up Node.js environment variables and paths`,
						status: `pending`,
						required: true,
						indent: 1
					},
					{
						id: `strapi_config`,
						title: `Configuring Strapi production settings`,
						status: `pending`,
						required: true,
						indent: 1
					},
					{
						id: `build_steps`,
						title: `Optimizing build and runtime configuration`,
						status: `pending`,
						required: true,
						indent: 1
					}
				]
			},
			{
				id: `compose_generation`,
				title: `Creating Docker Compose setup`,
				status: `pending`,
				required: true,
				subtasks: [
					{
						id: `service_definitions`,
						title: `Defining Strapi service configuration`,
						status: `pending`,
						required: true,
						indent: 1
					},
					{
						id: `network_config`,
						title: `Setting up secure network isolation`,
						status: `pending`,
						required: true,
						indent: 1
					},
					{
						id: `volume_config`,
						title: `Configuring persistent data volumes`,
						status: `pending`,
						required: true,
						indent: 1
					},
					{
						id: `env_config`,
						title: `Setting up environment configuration`,
						status: `pending`,
						required: true,
						indent: 1
					}
				]
			},
			{
				id: `backup_config`,
				title: `Creating backup of existing configuration`,
				status: `pending`,
				required: true
			},
			{
				id: `env_update`,
				title: `Updating environment variables for containerization`,
				status: `pending`,
				required: true
			},
			{
				id: `docker_config`,
				title: `Finalizing Docker configuration`,
				status: `pending`,
				required: true
			}
		];
	}
} 