const express = require('express'); 
const cors = require('cors');
const contractorRoutes = require('./routes/contractor');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '2mb' })); //parse JSON 

app.use('/api/contractor', contractorRoutes);
app.use('/api', apiRoutes);

app.listen(PORT, () => {
  console.log(`Maintenance API running at http://localhost:${PORT}`);
});
