import express from 'express';
import { prisma } from '../utils/prisma.util.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.post('/sign-up', async (req, res) => {
  const { email, password, passwordVe, name } = req.body;

  // 유효성 검증
  if (!email) return res.status(400).send('이메일을 입력해 주세요.');
  if (!password) return res.status(400).send('비밀번호를 입력해 주세요.');
  if (!passwordVe) return res.status(400).send('비밀번호 확인을 입력해 주세요.');
  if (!name) return res.status(400).send('이름을 입력해 주세요.');

  const emailRegex = /^[A-Za-z0-9_\.\-]+@[A-Za-z0-9\-]+\.[A-za-z0-9\-]+/;
  if (!emailRegex.test(email)) return res.status(400).send('이메일 형식이 올바르지 않습니다.');

  if (password.length < 6) return res.status(400).send('비밀번호는 6자리 이상이어야 합니다.');
  if (password !== passwordVe) return res.status(400).send('입력 한 두 비밀번호가 일치하지 않습니다.');

  // 이메일 중복 확인
  const existingUser = await prisma.users.findUnique({ where: { email } });
  if (existingUser) return res.status(400).send('이미 가입 된 사용자입니다.');

  // 비밀번호 해싱
  const hashedPassword = await bcrypt.hash(password, 10);

  // 사용자 생성
  const user = await prisma.users.create({
    data: {
      email,
      password: hashedPassword,
      passwordVe: hashedPassword, // 비밀번호 검증 필드 설정
      name,
    },
  });

  // 응답 반환
  res.status(201).json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });
});

router.post('/sign-in', async (req, res) => {
  const { email, password } = req.body;

  // 유효성 검증
  if (!email) return res.status(400).send('이메일을 입력해 주세요.');
  if (!password) return res.status(400).send('비밀번호를 입력해 주세요.');

  const emailRegex = /^[A-Za-z0-9_\.\-]+@[A-Za-z0-9\-]+\.[A-za-z0-9\-]+/;
  if (!emailRegex.test(email)) return res.status(400).send('이메일 형식이 올바르지 않습니다.');

  // 사용자 확인
  const user = await prisma.users.findUnique({ where: { email } });
  if (!user) return res.status(400).send('인증 정보가 유효하지 않습니다.');

  // 비밀번호 확인
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) return res.status(400).send('인증 정보가 유효하지 않습니다.');

  // AccessToken 생성
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '12h' });

  // AccessToken 반환
  res.status(200).json({ accessToken: token });
});

export default router;
