import express from 'express';
import routes from "./shared/presentation/routes/index"

const app = express();

app.use(express.json());
app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({
    message: 'Hello from Node.js + TypeScript + Express',
  });
});

export default app;
