import { GCP_MACHINE_TYPE, GCP_DISK_SIZE_GB } from './constants';
import * as fs from 'fs';

const PROJECT_ID = process.env.GCP_PROJECT_ID || '';
const ZONE = process.env.GCP_ZONE || 'us-central1-c';
const BASE_IMAGE = process.env.GCP_BASE_IMAGE || 'projects/debian-cloud/global/images/family/debian-12';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let instancesClient: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let zoneOpsClient: any = null;

function loadCredentials(): Record<string, unknown> | undefined {
  const keyFile = process.env.GCP_SERVICE_ACCOUNT_KEY_FILE;
  if (keyFile) {
    try {
      return JSON.parse(fs.readFileSync(keyFile, 'utf8'));
    } catch (e) {
      console.error('Failed to read GCP key file:', e);
    }
  }
  const inlineKey = process.env.GCP_SERVICE_ACCOUNT_KEY;
  if (inlineKey) {
    try {
      return JSON.parse(inlineKey);
    } catch (e) {
      console.error('Failed to parse GCP_SERVICE_ACCOUNT_KEY JSON:', e);
    }
  }
  return undefined;
}

function buildClientOptions() {
  const credentials = loadCredentials();
  const options: { projectId: string; credentials?: Record<string, unknown> } = {
    projectId: PROJECT_ID,
  };
  if (credentials) options.credentials = credentials;
  return options;
}

async function getInstancesClient() {
  if (!instancesClient) {
    const compute = await import('@google-cloud/compute');
    instancesClient = new compute.InstancesClient(buildClientOptions());
  }
  return instancesClient;
}

/**
 * @google-cloud/compute v4.x returns raw IOperation objects (not LRO wrappers).
 * We must poll via ZoneOperationsClient.wait() until status === 'DONE'.
 */
async function waitForZoneOperation(operationName: string) {
  if (!zoneOpsClient) {
    const compute = await import('@google-cloud/compute');
    zoneOpsClient = new compute.ZoneOperationsClient(buildClientOptions());
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let operation: any;
  do {
    [operation] = await zoneOpsClient.wait({
      operation: operationName,
      project: PROJECT_ID,
      zone: ZONE,
    });
  } while (operation.status !== 'DONE');

  if (operation.error) {
    throw new Error(`GCP operation failed: ${JSON.stringify(operation.error)}`);
  }
  return operation;
}



export async function createVM(
  userId: string,
  config: { telegramBotToken?: string; anthropicApiKey?: string }
) {
  const client = await getInstancesClient();

  const vmName = `openclaw-${userId.substring(0, 8)}-${Date.now()}`;
  const telegramToken = config.telegramBotToken || '';
  const anthropicKey = config.anthropicApiKey || '';

  const startupScript = `#!/bin/bash
set -euo pipefail
LOG=/var/log/openclaw-setup.log
exec > >(tee -a "$LOG") 2>&1

echo "[$(date)] ===== OpenClaw Setup Started ====="

# 1. Update system packages
echo "[$(date)] Step 1/6: Updating system packages..."
apt-get update -qq
apt-get install -y -qq curl git build-essential ca-certificates gnupg

# 2. Install Node.js 20.x
echo "[$(date)] Step 2/6: Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - 2>&1
apt-get install -y -qq nodejs
node --version
npm --version

# 3. Install PM2 globally
echo "[$(date)] Step 3/6: Installing PM2..."
npm install -g pm2 --quiet

# 4. Clone OpenClaw repository
echo "[$(date)] Step 4/6: Cloning OpenClaw repository..."
cd /opt
if [ -d openclaw ]; then
  echo "  Directory exists, pulling latest..."
  cd openclaw && git pull
else
  git clone https://github.com/openclaw/openclaw.git
  cd openclaw
fi

# 5. Install dependencies
echo "[$(date)] Step 5/6: Installing npm dependencies..."
npm install --production 2>&1

# 6. Configure and start OpenClaw
echo "[$(date)] Step 6/6: Writing .env and starting OpenClaw..."
cat > /opt/openclaw/.env <<'ENVEOF'
TELEGRAM_BOT_TOKEN=${telegramToken}
ANTHROPIC_API_KEY=${anthropicKey}
ENVEOF

# Start with PM2 and persist across reboots
cd /opt/openclaw
pm2 start npm --name openclaw -- start 2>&1 || pm2 restart openclaw
pm2 startup systemd -u root --hp /root 2>&1 | tail -1 | bash || true
pm2 save

echo "[$(date)] ===== OpenClaw Setup Complete ====="
touch /var/log/openclaw-setup.done
`;

  const instanceResource = {
    name: vmName,
    machineType: `zones/${ZONE}/machineTypes/${GCP_MACHINE_TYPE}`,
    disks: [
      {
        boot: true,
        autoDelete: true,
        initializeParams: {
          sourceImage: BASE_IMAGE,
          diskSizeGb: GCP_DISK_SIZE_GB.toString(),
        },
      },
    ],
    networkInterfaces: [
      {
        network: 'global/networks/default',
        accessConfigs: [
          {
            name: 'External NAT',
            type: 'ONE_TO_ONE_NAT',
          },
        ],
      },
    ],
    metadata: {
      items: [
        {
          key: 'startup-script',
          value: startupScript,
        },
      ],
    },
    tags: {
      items: ['openclaw', 'http-server', 'https-server'],
    },
  };

  const [operation] = await client.insert({
    project: PROJECT_ID,
    zone: ZONE,
    instanceResource,
  });

  // In @google-cloud/compute v4.x, operations are raw IOperation objects — poll via ZoneOperationsClient
  await waitForZoneOperation(operation.name as string);

  // Get instance details
  const [instance] = await client.get({
    project: PROJECT_ID,
    zone: ZONE,
    instance: vmName,
  });

  const externalIP = instance.networkInterfaces?.[0]?.accessConfigs?.[0]?.natIP;

  return {
    vmName,
    ip: externalIP,
    zone: ZONE,
  };
}

export async function getVMStatus(vmName: string) {
  const client = await getInstancesClient();

  try {
    const [instance] = await client.get({
      project: PROJECT_ID,
      zone: ZONE,
      instance: vmName,
    });

    const gcpStatus = (instance.status || '').toString().toUpperCase();

    let status: 'provisioning' | 'running' | 'stopped' | 'error' = 'provisioning';
    if (gcpStatus === 'RUNNING') status = 'running';
    else if (gcpStatus === 'TERMINATED' || gcpStatus === 'STOPPED') status = 'stopped';
    else if (gcpStatus === 'STAGING' || gcpStatus === 'PROVISIONING') status = 'provisioning';
    else if (gcpStatus) status = 'error';

    return {
      status,
      ip: instance.networkInterfaces?.[0]?.accessConfigs?.[0]?.natIP,
    };
  } catch {
    return { status: 'error' as const, ip: null };
  }
}

export async function restartVM(vmName: string) {
  const client = await getInstancesClient();

  const [operation] = await client.reset({
    project: PROJECT_ID,
    zone: ZONE,
    instance: vmName,
  });

  await waitForZoneOperation(operation.name as string);

  return { success: true };
}

export async function stopVM(vmName: string) {
  const client = await getInstancesClient();

  const [operation] = await client.stop({
    project: PROJECT_ID,
    zone: ZONE,
    instance: vmName,
  });

  await waitForZoneOperation(operation.name as string);

  return { success: true };
}

export async function deleteVM(vmName: string) {
  const client = await getInstancesClient();

  const [operation] = await client.delete({
    project: PROJECT_ID,
    zone: ZONE,
    instance: vmName,
  });

  await waitForZoneOperation(operation.name as string);

  return { success: true };
}

/** Read startup-script logs from GCP serial port 1 output */
export async function getVMLogs(vmName: string): Promise<{ logs: string; done: boolean }> {
  const client = await getInstancesClient();

  try {
    const [output] = await client.getSerialPortOutput({
      project: PROJECT_ID,
      zone: ZONE,
      instance: vmName,
      port: 1,
    });

    const contents = (output.contents || '') as string;
    const done = contents.includes('OpenClaw Setup Complete');

    return { logs: contents, done };
  } catch {
    return { logs: '', done: false };
  }
}

/** Update VM startup-script metadata with new credentials and restart */
export async function updateVMConfig(
  vmName: string,
  config: { telegramBotToken: string; anthropicApiKey: string }
) {
  const client = await getInstancesClient();

  // Fetch current instance to get current metadata fingerprint
  const [instance] = await client.get({
    project: PROJECT_ID,
    zone: ZONE,
    instance: vmName,
  });

  const currentItems: Array<{ key: string; value: string }> =
    (instance.metadata?.items as Array<{ key: string; value: string }>) || [];

  // Build a small reconfigure script that updates .env and restarts openclaw
  const reconfigScript = `#!/bin/bash
cat > /opt/openclaw/.env <<'ENVEOF'
TELEGRAM_BOT_TOKEN=${config.telegramBotToken}
ANTHROPIC_API_KEY=${config.anthropicApiKey}
ENVEOF
pm2 restart openclaw 2>/dev/null || (cd /opt/openclaw && pm2 start npm --name openclaw -- start)
echo "[$(date)] Config updated and openclaw restarted"
`;

  // Replace or add startup-script
  const newItems = currentItems.filter((i) => i.key !== 'startup-script');
  newItems.push({ key: 'startup-script', value: reconfigScript });

  const [operation] = await client.setMetadata({
    project: PROJECT_ID,
    zone: ZONE,
    instance: vmName,
    metadataResource: {
      fingerprint: instance.metadata?.fingerprint,
      items: newItems,
    },
  });

  await waitForZoneOperation(operation.name as string);

  return { success: true };
}
