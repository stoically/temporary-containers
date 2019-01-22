document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('backupToFile').addEventListener('click', async () => {
    const storage = await browser.storage.local.get('preferences');
    const a = document.createElement('a');
    a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(storage.preferences, null, 2));
    a.setAttribute('download', 'temporary_containers_preferences.txt');
    a.setAttribute('type', 'text/plain');
    a.dispatchEvent(new MouseEvent('click'));
  });
});