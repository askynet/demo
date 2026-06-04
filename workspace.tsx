import { useState } from 'react';
import { Sidebar } from 'primereact/sidebar';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Tag } from 'primereact/tag';
import axios from 'axios';

export default function WorkspaceLauncher() {
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [ready, setReady] = useState(false);
    const [message, setMessage] = useState('');

    const launchWorkspace = async () => {
        try {
            setVisible(true);
            setLoading(true);
            setReady(false);

            setMessage('Creating workspace...');

            await axios.post('/api/workspaces/open');

            pollStatus();
        } catch (error) {
            setLoading(false);
            setMessage('Failed to create workspace');
        }
    };

    const pollStatus = async () => {
        const interval = setInterval(async () => {
            try {
                const { data } = await axios.get(
                    '/api/workspaces/status'
                );

                if (data.ready) {
                    clearInterval(interval);

                    setLoading(false);
                    setReady(true);

                    setMessage(
                        'Workspace ready. Opening VS Code...'
                    );

                    const workspaceUrl =
                        `/workspaces/${data.workspaceId}`;

                    setTimeout(() => {
                        window.open(
                            workspaceUrl,
                            '_blank',
                            'noopener,noreferrer'
                        );

                        setVisible(false);
                    }, 1500);
                }
            } catch (err) {
                clearInterval(interval);

                setLoading(false);
                setMessage(
                    'Unable to start workspace'
                );
            }
        }, 2000);
    };

    return (
        <>
            <Button
                label="Open Workspace"
                icon="pi pi-desktop"
                onClick={launchWorkspace}
            />

            <Sidebar
                visible={visible}
                position="bottom"
                onHide={() => setVisible(false)}
                style={{
                    height: '280px'
                }}
                showCloseIcon={!loading}
            >
                <div className="flex flex-column align-items-center justify-content-center h-full gap-4">
                    {loading && (
                        <>
                            <ProgressSpinner
                                style={{
                                    width: '60px',
                                    height: '60px'
                                }}
                            />

                            <h3 className="m-0">
                                Setting up Workspace
                            </h3>

                            <p className="text-color-secondary">
                                {message}
                            </p>

                            <Tag
                                value="This may take 10-30 seconds"
                                severity="info"
                            />
                        </>
                    )}

                    {ready && (
                        <>
                            <i
                                className="pi pi-check-circle text-green-500"
                                style={{
                                    fontSize: '4rem'
                                }}
                            />

                            <h3>
                                Workspace Ready
                            </h3>

                            <p>{message}</p>
                        </>
                    )}
                </div>
            </Sidebar>
        </>
    );
}
