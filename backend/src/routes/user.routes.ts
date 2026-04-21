import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '@clerk/express';

const router = Router();
const prisma = new PrismaClient();

// GET /users/search?q=<username_or_name>
// Returns matching users with their connection status relative to the requesting user
router.get('/search', requireAuth(), async (req: any, res: any) => {
    try {
        const clerkUserId = req.auth.userId;
        const q = (req.query.q as string || '').trim();
        if (!clerkUserId) return res.status(401).json({ success: false, message: 'Unauthorized' });
        if (!q || q.length < 2) return res.json({ success: true, data: [] });

        const me = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
        if (!me) return res.status(404).json({ success: false, message: 'User not found' });

        const course = await prisma.course.findUnique({ where: { code: 'CS101' } });
        if (!course) return res.status(500).json({ success: false, message: 'Course not found' });

        // Search by username (exact prefix) or name (contains)
        const users = await prisma.user.findMany({
            where: {
                id: { not: me.id },
                clerkId: { not: { startsWith: 'demo_' } }, // only real users searchable by username
                OR: [
                    { username: { startsWith: q, mode: 'insensitive' } },
                    { name: { contains: q, mode: 'insensitive' } }
                ]
            },
            select: { id: true, name: true, username: true, major: true, year: true },
            take: 10
        });

        // Get existing connection status for each result
        const connections = await prisma.peerConnection.findMany({
            where: {
                courseId: course.id,
                OR: [
                    { requesterUserId: me.id, receiverUserId: { in: users.map(u => u.id) } },
                    { receiverUserId: me.id, requesterUserId: { in: users.map(u => u.id) } }
                ]
            }
        });

        const connMap = new Map(connections.map(c => {
            const peerId = c.requesterUserId === me.id ? c.receiverUserId : c.requesterUserId;
            return [peerId, { status: c.status, isRequester: c.requesterUserId === me.id, connectionId: c.id }];
        }));

        const results = users.map(u => ({
            ...u,
            connection: connMap.get(u.id) || null
        }));

        res.json({ success: true, data: results });
    } catch (error: any) {
        console.error('Error searching users:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /users/:userId/profile — public profile card for a user
router.get('/:userId/profile', requireAuth(), async (req: any, res: any) => {
    try {
        const { userId } = req.params;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const [course, prefs] = await Promise.all([
            prisma.course.findUnique({ where: { code: 'CS101' } }),
            prisma.userPreferences.findUnique({ where: { clerkUserId: user.clerkId ?? undefined } }).catch(() => null)
        ]);

        const normalize = (s: number) => s > 1 ? s / 100 : s;
        let strongConcepts: string[] = [];
        let weakConcepts: string[] = [];
        if (course) {
            const perfs = await prisma.conceptPerformance.findMany({
                where: { userId, courseId: course.id },
                orderBy: { masteryScore: 'desc' }
            });
            strongConcepts = perfs.filter(p => normalize(p.masteryScore) >= 0.75).slice(0, 5).map(p => p.conceptName);
            weakConcepts = perfs.filter(p => normalize(p.masteryScore) <= 0.40).sort((a, b) => a.masteryScore - b.masteryScore).slice(0, 4).map(p => p.conceptName);
        }

        res.json({
            success: true,
            data: {
                id: user.id,
                name: user.name,
                username: user.username,
                major: user.major,
                strongConcepts,
                weakConcepts,
                preferences: prefs ? {
                    pace: prefs.studyPace,
                    mode: prefs.studyMode,
                    learningStyle: prefs.learningStyle,
                    groupSize: prefs.preferredGroupSize
                } : null
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
