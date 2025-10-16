// MongoDB initialization script for Docker
db = db.getSiblingDB('socialmedia');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['username', 'email', 'password_hash'],
      properties: {
        username: {
          bsonType: 'string',
          minLength: 3,
          maxLength: 30,
          pattern: '^[a-zA-Z0-9_]+$'
        },
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
        },
        password_hash: {
          bsonType: 'string'
        },
        full_name: {
          bsonType: 'string',
          maxLength: 100
        },
        bio: {
          bsonType: 'string',
          maxLength: 500
        },
        avatar_url: {
          bsonType: 'string'
        },
        is_verified: {
          bsonType: 'bool'
        },
        is_private: {
          bsonType: 'bool'
        },
        followers_count: {
          bsonType: 'int',
          minimum: 0
        },
        following_count: {
          bsonType: 'int',
          minimum: 0
        },
        posts_count: {
          bsonType: 'int',
          minimum: 0
        },
        profile_visits_count: {
          bsonType: 'int',
          minimum: 0
        }
      }
    }
  }
});

db.createCollection('posts', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['user_id', 'created_at'],
      properties: {
        user_id: {
          bsonType: 'objectId'
        },
        caption: {
          bsonType: 'string',
          maxLength: 2000
        },
        media_urls: {
          bsonType: 'array',
          items: {
            bsonType: 'string'
          }
        },
        media_type: {
          bsonType: 'string',
          enum: ['text', 'image', 'video']
        },
        location: {
          bsonType: 'string',
          maxLength: 100
        },
        likes_count: {
          bsonType: 'int',
          minimum: 0
        },
        comments_count: {
          bsonType: 'int',
          minimum: 0
        },
        is_archived: {
          bsonType: 'bool'
        },
        created_at: {
          bsonType: 'date'
        },
        updated_at: {
          bsonType: 'date'
        }
      }
    }
  }
});

db.createCollection('stories', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['user_id', 'media_url', 'media_type', 'expires_at'],
      properties: {
        user_id: {
          bsonType: 'objectId'
        },
        media_url: {
          bsonType: 'string'
        },
        media_type: {
          bsonType: 'string',
          enum: ['image', 'video']
        },
        caption: {
          bsonType: 'string',
          maxLength: 200
        },
        location: {
          bsonType: 'string',
          maxLength: 100
        },
        views_count: {
          bsonType: 'int',
          minimum: 0
        },
        is_deleted: {
          bsonType: 'bool'
        },
        created_at: {
          bsonType: 'date'
        },
        expires_at: {
          bsonType: 'date'
        }
      }
    }
  }
});

db.createCollection('reels', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['user_id', 'video_url'],
      properties: {
        user_id: {
          bsonType: 'objectId'
        },
        video_url: {
          bsonType: 'string'
        },
        thumbnail_url: {
          bsonType: 'string'
        },
        caption: {
          bsonType: 'string',
          maxLength: 2000
        },
        location: {
          bsonType: 'string',
          maxLength: 100
        },
        likes_count: {
          bsonType: 'int',
          minimum: 0
        },
        comments_count: {
          bsonType: 'int',
          minimum: 0
        },
        views_count: {
          bsonType: 'int',
          minimum: 0
        },
        shares_count: {
          bsonType: 'int',
          minimum: 0
        },
        is_archived: {
          bsonType: 'bool'
        },
        created_at: {
          bsonType: 'date'
        },
        updated_at: {
          bsonType: 'date'
        }
      }
    }
  }
});

db.createCollection('messages', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['conversation_id', 'sender_id', 'content'],
      properties: {
        conversation_id: {
          bsonType: 'objectId'
        },
        sender_id: {
          bsonType: 'objectId'
        },
        recipient_id: {
          bsonType: 'objectId'
        },
        content: {
          bsonType: 'string',
          maxLength: 2000
        },
        media_url: {
          bsonType: 'string'
        },
        media_type: {
          bsonType: 'string',
          enum: ['image', 'video', 'file']
        },
        read_by: {
          bsonType: 'array',
          items: {
            bsonType: 'objectId'
          }
        },
        is_read: {
          bsonType: 'bool'
        },
        created_at: {
          bsonType: 'date'
        },
        updated_at: {
          bsonType: 'date'
        }
      }
    }
  }
});

// Create indexes for better performance
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ created_at: -1 });

db.posts.createIndex({ user_id: 1, created_at: -1 });
db.posts.createIndex({ created_at: -1 });
db.posts.createIndex({ likes_count: -1 });

db.stories.createIndex({ user_id: 1, created_at: -1 });
db.stories.createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 });

db.reels.createIndex({ user_id: 1, created_at: -1 });
db.reels.createIndex({ created_at: -1 });
db.reels.createIndex({ likes_count: -1 });

db.messages.createIndex({ conversation_id: 1, created_at: 1 });
db.messages.createIndex({ sender_id: 1 });
db.messages.createIndex({ recipient_id: 1 });

// Create additional collections
db.createCollection('conversations');
db.createCollection('likes');
db.createCollection('comments');
db.createCollection('follows');
db.createCollection('profile_visits');
db.createCollection('reel_likes');
db.createCollection('reel_bookmarks');
db.createCollection('reel_comments');
db.createCollection('reel_views');
db.createCollection('reel_shares');

// Create indexes for additional collections
db.conversations.createIndex({ participants: 1 });
db.conversations.createIndex({ updated_at: -1 });

db.likes.createIndex({ post_id: 1, user_id: 1 }, { unique: true });
db.likes.createIndex({ user_id: 1 });

db.comments.createIndex({ post_id: 1, created_at: -1 });
db.comments.createIndex({ user_id: 1 });

db.follows.createIndex({ follower_id: 1, following_id: 1 }, { unique: true });
db.follows.createIndex({ follower_id: 1 });
db.follows.createIndex({ following_id: 1 });

db.profile_visits.createIndex({ profile_owner_id: 1, visited_at: -1 });
db.profile_visits.createIndex({ visitor_id: 1 });

db.reel_likes.createIndex({ reel_id: 1, user_id: 1 }, { unique: true });
db.reel_bookmarks.createIndex({ reel_id: 1, user_id: 1 }, { unique: true });
db.reel_comments.createIndex({ reel_id: 1, created_at: -1 });
db.reel_views.createIndex({ reel_id: 1, viewed_at: -1 });
db.reel_shares.createIndex({ reel_id: 1, shared_at: -1 });

print('Database initialized successfully!');
