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

// 이력서 상세 조회 API
router.get('/resumes/:resumeId', jwtValidate, async (req, res, next) => {
  const userId = req.user.id;
  const { resumeId } = req.params;

  try {
    const resume = await prisma.resume.findFirst({
      where: {
        resumeId: parseInt(resumeId),
        UserId: userId,
      },
      include: {
        Users: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!resume) {
      return res.status(404).send('이력서가 존재하지 않습니다.');
    }

    res.status(200).json({
      resumeId: resume.resumeId,
      userName: resume.Users.name,
      title: resume.title,
      introduction: resume.introduction,
      status: resume.status,
      createdAt: resume.createdAt,
      updatedAt: resume.updatedAt,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/resumes/:resumeId', jwtValidate, async (req, res, next) => {
  const userId = req.user.id;
  const { resumeId } = req.params;
  const { title, introduction } = req.body;

  if (!title && !introduction) {
    return res.status(400).send('수정 할 정보를 입력해 주세요.');
  }

  try {
    const resume = await prisma.resume.findFirst({
      where: {
        resumeId: parseInt(resumeId),
        UserId: userId,
      },
    });

    if (!resume) {
      return res.status(404).send('이력서가 존재하지 않습니다.');
    }

    const updatedResume = await prisma.resume.update({
      where: {
        resumeId: parseInt(resumeId),
      },
      data: {
        title: title || resume.title,
        introduction: introduction || resume.introduction,
        updatedAt: new Date(),
      },
    });

    res.status(200).json({
      resumeId: updatedResume.resumeId,
      userId: updatedResume.UserId,
      title: updatedResume.title,
      introduction: updatedResume.introduction,
      status: updatedResume.status,
      createdAt: updatedResume.createdAt,
      updatedAt: updatedResume.updatedAt,
    });
  } catch (error) {
    next(error);
  }
});

// 이력서 삭제 API
router.delete('/resumes/:resumeId', jwtValidate, async (req, res, next) => {
  const userId = req.user.id;
  const { resumeId } = req.params;

  try {
    const resume = await prisma.resume.findFirst({
      where: {
        resumeId: parseInt(resumeId),
        UserId: userId,
      },
    });

    if (!resume) {
      return res.status(404).send('이력서가 존재하지 않습니다.');
    }

    await prisma.resume.delete({
      where: {
        resumeId: parseInt(resumeId),
      },
    });

    res.status(200).json({ resumeId: parseInt(resumeId) });
  } catch (error) {
    next(error);
  }
});

export default router;
