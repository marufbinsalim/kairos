import inquirer from 'inquirer';
import { api } from './api';
import { saveConfig } from './config';

export async function selectProjectAndEnv(): Promise<{
  projectId: string;
  projectName: string;
  envId: string;
  envName: string;
}> {
  const projects = await api.get<Array<{ id: string; name: string }>>('/projects');
  if (!projects.length) throw new Error('No projects found. Create one in the web UI first.');

  const { projectId } = await inquirer.prompt<{ projectId: string }>([{
    type: 'list',
    name: 'projectId',
    message: 'Select project:',
    choices: projects.map((p) => ({ name: p.name, value: p.id })),
  }]);

  const projectName = projects.find((p) => p.id === projectId)!.name;

  const envs = await api.get<Array<{ id: string; name: string }>>(`/projects/${projectId}/environments`);
  if (!envs.length) throw new Error(`No environments in "${projectName}". Create one in the web UI first.`);

  const { envId } = await inquirer.prompt<{ envId: string }>([{
    type: 'list',
    name: 'envId',
    message: 'Select environment:',
    choices: envs.map((e) => ({ name: e.name, value: e.id })),
  }]);

  const envName = envs.find((e) => e.id === envId)!.name;

  saveConfig({ defaultProjectId: projectId, defaultProjectName: projectName, defaultEnvironmentId: envId, defaultEnvName: envName });

  return { projectId, projectName, envId, envName };
}

export interface EnvSelection {
  id: string;
  name: string;
  projectName: string;
}

export async function selectEnvironmentsForRegistration(): Promise<EnvSelection[]> {
  const allEnvs = await api.get<Array<{ id: string; name: string; projectName?: string }>>('/environments');
  if (!allEnvs.length) throw new Error('No environments found. Create one in the web UI first.');

  const { selected } = await inquirer.prompt<{ selected: string[] }>([{
    type: 'checkbox',
    name: 'selected',
    message: 'Select environments to request access to (space to toggle, enter to confirm):',
    choices: allEnvs.map((e) => ({
      name: `${e.projectName ? e.projectName + ' › ' : ''}${e.name}`,
      value: e.id,
      checked: false,
    })),
    validate: (ans: string[]) => ans.length > 0 || 'Select at least one environment.',
  }]);

  return selected.map((id) => {
    const env = allEnvs.find((e) => e.id === id)!;
    return { id, name: env.name, projectName: env.projectName ?? '' };
  });
}
