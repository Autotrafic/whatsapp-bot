module.exports = {
  apps: [
    {
      name: 'whatsapp-bot',
      script: './dist/index.js',
      instances: '1',
      exec_mode: 'cluster',
      watch: false,
      restart_delay: 3000,
      max_restarts: 1000,
      max_memory_restart: '1500M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
