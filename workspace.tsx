import React, { useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Steps } from 'primereact/steps';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';
import axios from 'axios';

export default function WorkspaceLauncher() {
  const toast = useRef<Toast>(null);

  const [visible, setVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const steps = [
    { label: 'Request' },
    { label: 'Provision' },
    { label: 'Ready' }
  ];

  const sleep = (ms: number) =>
    new Promise(resolve => setTimeout(resolve, ms));

  const launchWorkspace = async () => {
    try {
      setVisible(true);
      setLoading(true);
      setActiveIndex(0);

      const openResponse = await axios.post(
        '/api/workspaces/open'
      );

      setActiveIndex(1);

      let ready = false;

      while (!ready) {
        await sleep(2000);

        const statusResponse = await axios.get(
          '/api/workspaces/status'
        );

        ready = statusResponse.data.ready;
      }

      setActiveIndex(2);

      toast.current?.show({
        severity: 'success',
        summary: 'Workspace Ready',
        detail: 'Opening workspace...',
        life: 3000
      });

      await sleep(1000);

      const workspaceUrl =
        openResponse.data.url;

      window.open(
        workspaceUrl,
        '_blank',
        'noopener,noreferrer'
      );

      setVisible(false);
    } catch (error: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Workspace Failed',
        detail:
          error?.response?.data?.message ||
          'Unable to start workspace',
        life: 5000
      });

      setVisible(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toast ref={toast} />

      <Button
        label="Open Workspace"
        icon="pi pi-desktop"
        onClick={launchWorkspace}
      />

      <Dialog
        visible={visible}
        closable={false}
        draggable={false}
        resizable={false}
        position="bottom"
        style={{
          width: '600px'
        }}
        onHide={() => {}}
      >
        <div className="flex flex-column gap-5">
          <div>
            <h3 className="m-0">
              Workspace Setup
            </h3>

            <p className="text-color-secondary mt-2">
              Please wait while your workspace
              is being prepared.
            </p>
          </div>

          <Steps
            model={steps}
            activeIndex={activeIndex}
            readOnly
          />

          <div className="flex justify-content-center">
            {loading && (
              <ProgressSpinner
                style={{
                  width: '50px',
                  height: '50px'
                }}
              />
            )}
          </div>

          <div className="surface-100 border-round p-3">
            {activeIndex === 0 && (
              <span>
                Requesting workspace...
              </span>
            )}

            {activeIndex === 1 && (
              <span>
                Creating pod, service and route.
                This may take up to 30 seconds.
              </span>
            )}

            {activeIndex === 2 && (
              <span>
                Workspace ready. Opening now...
              </span>
            )}
          </div>
        </div>
      </Dialog>
    </>
  );
}
