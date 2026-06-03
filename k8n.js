const k8s = require('@kubernetes/client-node');

const kc = new k8s.KubeConfig();
kc.loadFromCluster();

const appsApi = kc.makeApiClient(k8s.AppsV1Api);
const coreApi = kc.makeApiClient(k8s.CoreV1Api);
const customApi = kc.makeApiClient(k8s.CustomObjectsApi);

const NAMESPACE = 'fbs-dev';

exports.openWorkspace = async (req, res, next) => {
    try {
        const userId = req.user.sub;

        const workspaceName = `ws-${userId}`;

        try {
            await appsApi.readNamespacedDeployment({
                name: workspaceName,
                namespace: NAMESPACE
            });

            return res.json({
                success: true,
                workspaceId: workspaceName,
                status: 'running'
            });
        } catch (_) {}

        await appsApi.createNamespacedDeployment({
            namespace: NAMESPACE,
            body: {
                apiVersion: 'apps/v1',
                kind: 'Deployment',
                metadata: {
                    name: workspaceName
                },
                spec: {
                    replicas: 1,
                    selector: {
                        matchLabels: {
                            app: workspaceName
                        }
                    },
                    template: {
                        metadata: {
                            labels: {
                                app: workspaceName
                            }
                        },
                        spec: {
                            containers: [
                                {
                                    name: 'code-server',
                                    image: 'registry-dev.cigna.com/eksworkshop/fbs-code-server:v5',
                                    ports: [
                                        {
                                            containerPort: 8080
                                        }
                                    ],
                                    env: [
                                        {
                                            name: 'USER_ID',
                                            value: userId
                                        }
                                    ],
                                    volumeMounts: [
                                        {
                                            name: 'workspace',
                                            mountPath: '/workspace'
                                        }
                                    ]
                                }
                            ],
                            volumes: [
                                {
                                    name: 'workspace',
                                    persistentVolumeClaim: {
                                        claimName: 'fbs-dev-workspace'
                                    }
                                }
                            ]
                        }
                    }
                }
            }
        });

        await coreApi.createNamespacedService({
            namespace: NAMESPACE,
            body: {
                apiVersion: 'v1',
                kind: 'Service',
                metadata: {
                    name: workspaceName
                },
                spec: {
                    selector: {
                        app: workspaceName
                    },
                    ports: [
                        {
                            name: 'http',
                            protocol: 'TCP',
                            port: 80,
                            targetPort: 8080
                        }
                    ]
                }
            }
        });

        await customApi.createNamespacedCustomObject({
            group: 'route.openshift.io',
            version: 'v1',
            namespace: NAMESPACE,
            plural: 'routes',
            body: {
                apiVersion: 'route.openshift.io/v1',
                kind: 'Route',
                metadata: {
                    name: workspaceName
                },
                spec: {
                    to: {
                        kind: 'Service',
                        name: workspaceName
                    },
                    port: {
                        targetPort: 'http'
                    },
                    tls: {
                        termination: 'edge',
                        insecureEdgeTerminationPolicy: 'Redirect'
                    }
                }
            }
        });

        return res.json({
            success: true,
            workspaceId: workspaceName,
            status: 'starting'
        });
    } catch (err) {
        next(err);
    }
};

exports.workspaceStatus = async (req, res, next) => {
    try {
        const userId = req.user.sub;

        const deployment =
            await appsApi.readNamespacedDeployment({
                name: `ws-${userId}`,
                namespace: NAMESPACE
            });

        const readyReplicas =
            deployment.status?.readyReplicas || 0;

        return res.json({
            ready: readyReplicas > 0
        });
    } catch (err) {
        next(err);
    }
};

exports.closeWorkspace = async (req, res, next) => {
    try {
        const userId = req.user.sub;

        const workspaceName = `ws-${userId}`;

        await appsApi.deleteNamespacedDeployment({
            name: workspaceName,
            namespace: NAMESPACE
        });

        try {
            await coreApi.deleteNamespacedService({
                name: workspaceName,
                namespace: NAMESPACE
            });
        } catch (_) {}

        try {
            await customApi.deleteNamespacedCustomObject({
                group: 'route.openshift.io',
                version: 'v1',
                namespace: NAMESPACE,
                plural: 'routes',
                name: workspaceName
            });
        } catch (_) {}

        return res.json({
            success: true
        });
    } catch (err) {
        next(err);
    }
};
