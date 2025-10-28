import { Router, Request, Response } from 'express'
import { MongoClient, ObjectId } from 'mongodb'

const router = Router()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/socialmedia'

// GET /api/users/me - Get current user
router.get('/me', async (req: Request, res: Response) => {
    try {
        // TODO: Add auth middleware to get userId from token
        const userId = req.headers['x-user-id'] as string

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        const client = await MongoClient.connect(MONGODB_URI)
        const db = client.db()
        const user = await db.collection('users').findOne({ _id: new ObjectId(userId) })

        await client.close()

        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        return res.json({
            id: user._id.toString(),
            username: user.username,
            email: user.email,
            name: user.name || '',
            bio: user.bio || '',
            avatar: user.avatar || '/placeholder-user.jpg',
            followers: user.followers || 0,
            following: user.following || 0,
            verified: user.verified || false
        })
    } catch (error: any) {
        console.error('Get user error:', error)
        return res.status(500).json({ message: error.message || 'Failed to get user' })
    }
})

// GET /api/users/:userId - Get user by ID
router.get('/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params

        const client = await MongoClient.connect(MONGODB_URI)
        const db = client.db()
        const user = await db.collection('users').findOne({ _id: new ObjectId(userId) })

        await client.close()

        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        return res.json({
            id: user._id.toString(),
            username: user.username,
            name: user.name || '',
            bio: user.bio || '',
            avatar: user.avatar || '/placeholder-user.jpg',
            followers: user.followers || 0,
            following: user.following || 0,
            verified: user.verified || false
        })
    } catch (error: any) {
        console.error('Get user error:', error)
        return res.status(500).json({ message: error.message || 'Failed to get user' })
    }
})

// PUT /api/users/profile - Update user profile
router.put('/profile', async (req: Request, res: Response) => {
    try {
        const userId = req.headers['x-user-id'] as string

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        const { name, bio, avatar } = req.body

        const client = await MongoClient.connect(MONGODB_URI)
        const db = client.db()

        const updateData: any = { updatedAt: new Date() }
        if (name !== undefined) updateData.name = name
        if (bio !== undefined) updateData.bio = bio
        if (avatar !== undefined) updateData.avatar = avatar

        await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            { $set: updateData }
        )

        const user = await db.collection('users').findOne({ _id: new ObjectId(userId) })
        await client.close()

        return res.json({
            id: user?._id.toString(),
            username: user?.username,
            email: user?.email,
            name: user?.name || '',
            bio: user?.bio || '',
            avatar: user?.avatar || '/placeholder-user.jpg',
            followers: user?.followers || 0,
            following: user?.following || 0,
            verified: user?.verified || false
        })
    } catch (error: any) {
        console.error('Update profile error:', error)
        return res.status(500).json({ message: error.message || 'Failed to update profile' })
    }
})

// GET /api/users/search - Search users
router.get('/search', async (req: Request, res: Response) => {
    try {
        const { q } = req.query

        if (!q) {
            return res.status(400).json({ message: 'Search query required' })
        }

        const client = await MongoClient.connect(MONGODB_URI)
        const db = client.db()

        const users = await db.collection('users').find({
            $or: [
                { username: { $regex: q, $options: 'i' } },
                { name: { $regex: q, $options: 'i' } }
            ]
        }).limit(20).toArray()

        await client.close()

        return res.json(users.map(user => ({
            id: user._id.toString(),
            username: user.username,
            name: user.name || '',
            avatar: user.avatar || '/placeholder-user.jpg',
            verified: user.verified || false
        })))
    } catch (error: any) {
        console.error('Search users error:', error)
        return res.status(500).json({ message: error.message || 'Failed to search users' })
    }
})

// POST /api/users/:userId/follow - Follow user
router.post('/:userId/follow', async (req: Request, res: Response) => {
    try {
        const currentUserId = req.headers['x-user-id'] as string
        const { userId } = req.params

        if (!currentUserId) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        if (currentUserId === userId) {
            return res.status(400).json({ message: 'Cannot follow yourself' })
        }

        const client = await MongoClient.connect(MONGODB_URI)
        const db = client.db()

        // Add to following
        await db.collection('follows').insertOne({
            followerId: new ObjectId(currentUserId),
            followingId: new ObjectId(userId),
            createdAt: new Date()
        })

        // Update counts
        await db.collection('users').updateOne(
            { _id: new ObjectId(currentUserId) },
            { $inc: { following: 1 } }
        )
        await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            { $inc: { followers: 1 } }
        )

        await client.close()

        return res.json({ message: 'Followed successfully' })
    } catch (error: any) {
        console.error('Follow error:', error)
        return res.status(500).json({ message: error.message || 'Failed to follow user' })
    }
})

// DELETE /api/users/:userId/follow - Unfollow user
router.delete('/:userId/follow', async (req: Request, res: Response) => {
    try {
        const currentUserId = req.headers['x-user-id'] as string
        const { userId } = req.params

        if (!currentUserId) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        const client = await MongoClient.connect(MONGODB_URI)
        const db = client.db()

        // Remove from following
        await db.collection('follows').deleteOne({
            followerId: new ObjectId(currentUserId),
            followingId: new ObjectId(userId)
        })

        // Update counts
        await db.collection('users').updateOne(
            { _id: new ObjectId(currentUserId) },
            { $inc: { following: -1 } }
        )
        await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            { $inc: { followers: -1 } }
        )

        await client.close()

        return res.json({ message: 'Unfollowed successfully' })
    } catch (error: any) {
        console.error('Unfollow error:', error)
        return res.status(500).json({ message: error.message || 'Failed to unfollow user' })
    }
})

// GET /api/users/:userId/followers - Get user followers
router.get('/:userId/followers', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params

        const client = await MongoClient.connect(MONGODB_URI)
        const db = client.db()

        const follows = await db.collection('follows').find({
            followingId: new ObjectId(userId)
        }).toArray()

        const followerIds = follows.map(f => f.followerId)
        const followers = await db.collection('users').find({
            _id: { $in: followerIds }
        }).toArray()

        await client.close()

        return res.json(followers.map(user => ({
            id: user._id.toString(),
            username: user.username,
            name: user.name || '',
            avatar: user.avatar || '/placeholder-user.jpg',
            verified: user.verified || false
        })))
    } catch (error: any) {
        console.error('Get followers error:', error)
        return res.status(500).json({ message: error.message || 'Failed to get followers' })
    }
})

// GET /api/users/:userId/following - Get user following
router.get('/:userId/following', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params

        const client = await MongoClient.connect(MONGODB_URI)
        const db = client.db()

        const follows = await db.collection('follows').find({
            followerId: new ObjectId(userId)
        }).toArray()

        const followingIds = follows.map(f => f.followingId)
        const following = await db.collection('users').find({
            _id: { $in: followingIds }
        }).toArray()

        await client.close()

        return res.json(following.map(user => ({
            id: user._id.toString(),
            username: user.username,
            name: user.name || '',
            avatar: user.avatar || '/placeholder-user.jpg',
            verified: user.verified || false
        })))
    } catch (error: any) {
        console.error('Get following error:', error)
        return res.status(500).json({ message: error.message || 'Failed to get following' })
    }
})

// DELETE /api/users/delete - Delete user account
router.delete('/delete', async (req: Request, res: Response) => {
    try {
        const userId = req.headers['x-user-id'] as string

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        const client = await MongoClient.connect(MONGODB_URI)
        const db = client.db()

        // Delete user
        await db.collection('users').deleteOne({ _id: new ObjectId(userId) })

        // Delete user's posts
        await db.collection('posts').deleteMany({ userId: new ObjectId(userId) })

        // Delete user's follows
        await db.collection('follows').deleteMany({
            $or: [
                { followerId: new ObjectId(userId) },
                { followingId: new ObjectId(userId) }
            ]
        })

        await client.close()

        return res.json({ message: 'Account deleted successfully' })
    } catch (error: any) {
        console.error('Delete account error:', error)
        return res.status(500).json({ message: error.message || 'Failed to delete account' })
    }
})

// GET /api/users/blocked - Get blocked users
router.get('/blocked', async (req: Request, res: Response) => {
    try {
        const userId = req.headers['x-user-id'] as string

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        const client = await MongoClient.connect(MONGODB_URI)
        const db = client.db()

        const blocks = await db.collection('blocked_users').find({
            userId: new ObjectId(userId)
        }).toArray()

        const blockedIds = blocks.map(b => b.blockedUserId)
        const blockedUsers = await db.collection('users').find({
            _id: { $in: blockedIds }
        }).toArray()

        await client.close()

        return res.json(blockedUsers.map(user => ({
            id: user._id.toString(),
            username: user.username,
            name: user.name || '',
            avatar: user.avatar || '/placeholder-user.jpg'
        })))
    } catch (error: any) {
        console.error('Get blocked users error:', error)
        return res.status(500).json({ message: error.message || 'Failed to get blocked users' })
    }
})

export default router
