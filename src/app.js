import express from 'express';
import cookieParser from 'cookie-parser';
import UsersRouter from './routers/users.router.js';
import ResumesRouter from './routers/resumes.router.js';
import jwtValidate from './middlewares/require-access-token.middleware.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());
app.use('/api', [UsersRouter]);
app.use('/api', jwtValidate, ResumesRouter);

app.listen(PORT, () => {
  console.log(PORT, '포트로 서버가 열렸어요!');
});
