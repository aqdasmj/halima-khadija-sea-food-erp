const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
const localtunnel = require('localtunnel');
require('dotenv').config();

const { verifyToken } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const boatsRoutes = require('./routes/boats');
const usersRoutes = require('./routes/users');
const crewRoutes = require('./routes/crew');
const expensesRoutes = require('./routes/expenses');
const incomeRoutes = require('./routes/income');
const maintenanceRoutes = require('./routes/maintenance');
const dieselRoutes = require('./routes/diesel');
const analyticsRoutes = require('./routes/analytics');
const adminRoutes = require('./routes/admin');
const distributorRoutes = require('./distributor_module');

const app = express();
const PORT = process.env.PORT || 5000;

let activeTunnelUrl = null;
let publicIp = 'fetching...';

function getLocalNetworkIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIp = getLocalNetworkIp();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Bypass-Tunnel-Remainder', 'ngrok-skip-browser-warning', 'X-Requested-With'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const clientBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

app.use('/api/auth', authRoutes);
app.use('/api/boats', boatsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/crew', crewRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/diesel', dieselRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/distributor', verifyToken, distributorRoutes);

app.get('/api/server-info', (req, res) => {
  res.json({
    tunnelUrl: activeTunnelUrl || `http://${localIp}:${PORT}`,
    localIpUrl: `http://${localIp}:${PORT}`,
    cloudflareUrl: activeTunnelUrl,
    localtunnelUrl: 'https://sakhri-boat-finance.loca.lt'
  });
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(` HALIMA KHADIJA SEA FOOD ERP ACTIVE ON PORT ${PORT}`);
  console.log(` Local Network Access: http://${localIp}:${PORT}`);
  console.log(`==================================================\n`);
});
