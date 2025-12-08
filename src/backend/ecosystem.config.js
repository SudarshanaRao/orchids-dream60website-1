module.exports = {
  apps: [{
    name: 'dream60-backend',
    script: './server.js',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'development',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    listen_timeout: 3000,
    kill_timeout: 5000,
    shutdown_with_message: true,
    wait_ready: false,
    ignore_watch: [
      'node_modules',
      'logs',
      '.git',
      '.env'
    ],
    // Cron restart (optional - restart every day at 3 AM)
    cron_restart: '0 3 * * *'
  }]
};
