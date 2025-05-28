#!/usr/bin/env node
import { App, Tags } from 'aws-cdk-lib';
import { ProjectsPortalStage } from '../lib/projects-portal.stack';

const app = new App();

const stage = new ProjectsPortalStage(app, 'dev');

Tags.of(stage).add('environment', 'development');

app.synth();
