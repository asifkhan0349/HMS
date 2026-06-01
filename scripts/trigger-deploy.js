// scripts/trigger-deploy.js
/**
 * Utility script to trigger the VPS deployment webhook for the Hospital Management System.
 * Expected to be run on the development branch.
 */

const URL = 'https://vps.fossap.in/api/deploy/6qPplY0TOhR-Jk-hmuqMd';

async function triggerDeployment() {
  console.log('\x1b[36m%s\x1b[0m', '🚀 Initializing deployment trigger to VPS...');
  console.log(`Target Webhook: ${URL}`);
  console.log('Sending payload for branch: \x1b[33mdevelopment\x1b[0m\n');

  try {
    const response = await fetch(URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gitlab-Event': 'Push Hook'
      },
      body: JSON.stringify({
        object_kind: 'push',
        ref: 'refs/heads/development',
        repository: {
          name: 'hospital-management-system'
        }
      })
    });

    const status = response.status;
    const data = await response.json();

    if (status === 200) {
      console.log('\x1b[32m%s\x1b[0m', '🎉 SUCCESS!');
      console.log(`Status Code: ${status}`);
      console.log(`Server Message: ${data.message || 'Application deployed successfully'}`);
      console.log('\x1b[35m%s\x1b[0m', '\nDeployment successfully queued on the VPS.');
    } else {
      console.error('\x1b[31m%s\x1b[0m', '❌ DEPLOYMENT TRIGGER FAILED');
      console.error(`Status Code: ${status}`);
      console.error('Error Details:', data);
      process.exit(1);
    }
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', '❌ CRITICAL ERROR');
    console.error('Failed to communicate with the VPS deployment API:', error.message);
    process.exit(1);
  }
}

triggerDeployment();
