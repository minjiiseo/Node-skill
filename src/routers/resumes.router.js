// src/routes/resume.js
import express from 'express';
import { prisma } from '../utils/prisma.util.js';
import jwtValidate from '../middlewares/require-access-token.middleware.js';

const router = express.Router();

// 이력서 생성 API
router.post('/resumes', jwtValidate, async (req, res) => {
  const { title, introduction } = req.body;
  const userId = req.user.id;

  // 유효성 검증
  if (!title) return res.status(400).send('제목을 입력해 주세요.');
  if (!introduction) return res.status(400).send('자기소개를 입력해 주세요.');
  if (introduction.length < 150) return res.status(400).send('자기소개는 150자 이상 작성해야 합니다.');

  // 이력서 생성
  const resume = await prisma.resume.create({
    data: {
      UserId: userId,
      title,
      introduction,
    },
  });

  // 응답 반환
  res.status(201).json({
    resumeId: resume.resumeId,
    userId: resume.UserId,
    title: resume.title,
    introduction: resume.introduction,
    status: resume.status,
    createdAt: resume.createdAt,
    updatedAt: resume.updatedAt,
  });
});

// 이력서 목록 조회
router.get('/resumes', jwtValidate, async (req, res) => {
  const userId = req.user.id;
  const sort = req.query.sort ? req.query.sort.toLowerCase() : 'desc';

  const orderBy = {
    createdAt: sort === 'asc' ? 'asc' : 'desc',
  };

  try {
    const resumes = await prisma.resume.findMany({
      where: {
        UserId: userId,
      },
      orderBy,
      include: {
        Users: {
          select: {
            name: true,
          },
        },
      },
    });

    const result = resumes.map((resume) => ({
      resumeId: resume.resumeId,
      userName: resume.Users.name,
      title: resume.title,
      introduction: resume.introduction,
      status: resume.status,
      createdAt: resume.createdAt,
      updatedAt: resume.updatedAt,
    }));

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

export default router;
