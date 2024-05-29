// src/routes/user.js
import express from 'express';
import { prisma } from '../utils/prisma.util.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import jwtValidate from '../middlewares/require-access-token.middleware.js';

const router = express.Router();

router.post('/sign-up', async (req, res, next) => {
  try {
    const { email, password, passwordVe, name } = req.body;

    if (!email) throw { status: 400, message: '이메일을 입력해 주세요.' };
    if (!password) throw { status: 400, message: '비밀번호를 입력해 주세요.' };
    if (!passwordVe) throw { status: 400, message: '비밀번호 확인을 입력해 주세요.' };
    if (!name) throw { status: 400, message: '이름을 입력해 주세요.' };

    const emailRegex = /^[A-Za-z0-9_\.\-]+@[A-Za-z0-9\-]+\.[A-za-z0-9\-]+/;
    if (!emailRegex.test(email)) throw { status: 400, message: '이메일 형식이 올바르지 않습니다.' };

    if (password.length < 6) throw { status: 400, message: '비밀번호는 6자리 이상이어야 합니다.' };
    if (password !== passwordVe) throw { status: 400, message: '입력 한 두 비밀번호가 일치하지 않습니다.' };

    const existingUser = await prisma.users.findUnique({ where: { email } });
    if (existingUser) throw { status: 400, message: '이미 가입 된 사용자입니다.' };

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.users.create({
      data: {
        email,
        password: hashedPassword,
        passwordVe: hashedPassword,
        name,
      },
    });

    res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/sign-in', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email) throw { status: 400, message: '이메일을 입력해 주세요.' };
    if (!password) throw { status: 400, message: '비밀번호를 입력해 주세요.' };

    const emailRegex = /^[A-Za-z0-9_\.\-]+@[A-Za-z0-9\-]+\.[A-za-z0-9\-]+/;
    if (!emailRegex.test(email)) throw { status: 400, message: '이메일 형식이 올바르지 않습니다.' };

    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) throw { status: 400, message: '인증 정보가 유효하지 않습니다.' };

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) throw { status: 400, message: '인증 정보가 유효하지 않습니다.' };

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '12h' });

    res.status(200).json({ accessToken: token });
  } catch (error) {
    next(error);
  }
});

router.get('/me', jwtValidate, async (req, res, next) => {
  try {
    const user = req.user;
    res.status(200).json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
