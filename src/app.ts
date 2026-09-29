import express from 'express';

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        message: 'Hello from Node.js + TypeScript + Express',
    });
});

export default app;