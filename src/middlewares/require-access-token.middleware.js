// src/middleware/auth.js
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma.util.js';
import dotEnv from 'dotenv';

dotEnv.config();

const jwtValidate = async (req, res, next) => {
  // 헤더에서 accessToken 가져오기
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).send('인증 정보가 없습니다.');
  }

  // access의 인증방식이 올바른가
  const tokenParts = authorization.split(' ');
  if (tokenParts[0] !== 'Bearer' || tokenParts.length !== 2) {
    return res.status(401).send('지원하지 않는 인증 방식입니다.');
  }

  const token = tokenParts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.users.findUnique({ where: { id: decoded.userId } });

    if (!user) {
      return res.status(401).send('인증 정보와 일치하는 사용자가 없습니다.');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).send('인증 정보가 만료되었습니다.');
    }
    return res.status(401).send('인증 정보가 유효하지 않습니다.');
  }
};

export default jwtValidate;
