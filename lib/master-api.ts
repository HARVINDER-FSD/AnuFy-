/**
 * Master API Manager
 * Centralized API handler for all app requests with caching, retry logic, and error handling
 */

// Cache configuration
const CACHE_DURATION = 30000; // 30 seconds
const apiCache = new Map<string, { data: any; timestamp: number }>();

// Request queue to prevent duplicate requests
const pendingRequests = new Map<string, Promise<any>>();

interface ApiOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
    cache?: boolean;
    cacheDuration?: number;
    retry?: number;
    timeout?: number;
}

/**
 * Get authentication token
 */
function getToken(): string | null {
    if (typeof document !== 'undefined') {
        const cookies = document.cookie.split('; ');
        const tokenCookie = cookies.find(c => c.startsWith('token=') || c.startsWith('client-token='));
        if (tokenCookie) return tokenCookie.split('=')[1];
    }
    if (typeof window !== 'undefined') {
        return localStorage.getItem('token') || localStorage.getItem('client-token');
    }
    return null;
}

/**
 * Generate cache key
 */
function getCacheKey(url: string, options?: ApiOptions): string {
    return `${options?.method || 'GET'}_${url}_${JSON.stringify(options?.body || {})}`;
}

/**
 * Check if cache is valid
 */
function isCacheValid(key: string, duration: number): boolean {
    const cached = apiCache.get(key);
    if (!cached) return false;
    return (Date.now() - cached.timestamp) < duration;
}

/**
 * Master API call function
 */
export async function apiCall<T = any>(
    endpoint: string,
    options: ApiOptions = {}
): Promise<T> {
    const {
        method = 'GET',
        body,
        cache = method === 'GET',
        cacheDuration = CACHE_DURATION,
        retry = 2,
        timeout = 30000
    } = options;

    // Generate cache key
    const cacheKey = getCacheKey(endpoint, options);

    // Check cache for GET requests
    if (cache && method === 'GET' && isCacheValid(cacheKey, cacheDuration)) {
        console.log(`[MasterAPI] Cache hit: ${endpoint}`);
        return apiCache.get(cacheKey)!.data;
    }

    // Check if request is already pending (prevent duplicate requests)
    if (pendingRequests.has(cacheKey)) {
        console.log(`[MasterAPI] Request already pending: ${endpoint}`);
        return pendingRequests.get(cacheKey)!;
    }

    // Create the request promise
    const requestPromise = executeRequest<T>(endpoint, method, body, timeout, retry);

    // Store pending request
    pendingRequests.set(cacheKey, requestPromise);

    try {
        const data = await requestPromise;

        // Cache successful GET requests
        if (cache && method === 'GET') {
            apiCache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
        }

        // Clear cache for mutations
        if (method !== 'GET') {
            clearRelatedCache(endpoint);
        }

        return data;
    } finally {
        // Remove from pending requests
        pendingRequests.delete(cacheKey);
    }
}

/**
 * Execute the actual API request with retry logic
 */
async function executeRequest<T>(
    endpoint: string,
    method: string,
    body: any,
    timeout: number,
    retryCount: number
): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retryCount; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const token = getToken();
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(endpoint, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined,
                signal: controller.signal,
                cache: 'no-store'
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data;

        } catch (error: any) {
            lastError = error;
            console.error(`[MasterAPI] Attempt ${attempt + 1} failed:`, error.message);

            // Don't retry on client errors (4xx)
            if (error.message.includes('401') || 
                error.message.includes('403') || 
                error.message.includes('404') ||
                error.message.includes('400')) {
                throw error;
            }

            // Wait before retry (exponential backoff)
            if (attempt < retryCount) {
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            }
        }
    }

    throw lastError || new Error('Request failed');
}

/**
 * Clear related cache entries
 */
function clearRelatedCache(endpoint: string): void {
    const keys = Array.from(apiCache.keys());
    keys.forEach(key => {
        if (key.includes(endpoint.split('?')[0])) {
            apiCache.delete(key);
        }
    });
}

/**
 * Clear all cache
 */
export function clearAllCache(): void {
    apiCache.clear();
    console.log('[MasterAPI] All cache cleared');
}

/**
 * Clear specific cache
 */
export function clearCache(endpoint: string): void {
    clearRelatedCache(endpoint);
    console.log(`[MasterAPI] Cache cleared for: ${endpoint}`);
}

// ============================================
// Specific API Methods
// ============================================

/**
 * User APIs
 */
export const UserAPI = {
    getMe: () => apiCall('/api/users/me'),
    getUser: (userId: string) => apiCall(`/api/users/${userId}`),
    updateProfile: (data: any) => apiCall('/api/users/profile', { method: 'PUT', body: data }),
    followUser: (userId: string) => apiCall(`/api/users/${userId}/follow`, { method: 'POST' }),
    unfollowUser: (userId: string) => apiCall(`/api/users/${userId}/follow`, { method: 'POST' }),
    getFollowers: (userId: string) => apiCall(`/api/users/${userId}/followers`),
    getFollowing: (userId: string) => apiCall(`/api/users/${userId}/following`),
};

/**
 * Post APIs
 */
export const PostAPI = {
    getFeed: () => apiCall('/api/posts'),
    getPost: (postId: string) => apiCall(`/api/posts/${postId}`),
    createPost: (data: any) => apiCall('/api/posts', { method: 'POST', body: data }),
    deletePost: (postId: string) => apiCall(`/api/posts/${postId}`, { method: 'DELETE' }),
    likePost: (postId: string) => apiCall(`/api/posts/${postId}/like`, { method: 'POST' }),
    commentPost: (postId: string, content: string) =>
        apiCall(`/api/posts/${postId}/comment`, { method: 'POST', body: { content } }),
    getComments: (postId: string) => apiCall(`/api/posts/${postId}/comment`),
};

/**
 * Story APIs
 */
export const StoryAPI = {
    getStories: () => apiCall('/api/stories', { timeout: 30000 }),
    createStory: (data: any) => apiCall('/api/stories', { method: 'POST', body: data }),
    deleteStory: (storyId: string) => apiCall(`/api/stories/${storyId}`, { method: 'DELETE' }),
};

/**
 * Reel APIs
 */
export const ReelAPI = {
    getReels: () => apiCall('/api/reels', { timeout: 30000 }),
    getReel: (reelId: string) => apiCall(`/api/reels/${reelId}`),
    createReel: (data: any) => apiCall('/api/reels', { method: 'POST', body: data }),
    deleteReel: (reelId: string) => apiCall(`/api/reels/${reelId}`, { method: 'DELETE' }),
    likeReel: (reelId: string) => apiCall(`/api/reels/${reelId}/like`, { method: 'POST' }),
    commentReel: (reelId: string, content: string) =>
        apiCall(`/api/reels/${reelId}/comment`, { method: 'POST', body: { content } }),
    getComments: (reelId: string) => apiCall(`/api/reels/${reelId}/comment`),
};

/**
 * Notification APIs
 */
export const NotificationAPI = {
    getNotifications: (limit?: number) => {
        const timestamp = new Date().getTime();
        const url = limit
            ? `/api/notifications?limit=${limit}&_t=${timestamp}`
            : `/api/notifications?_t=${timestamp}`;
        return apiCall(url, { cache: false });
    },
    markAsRead: (notificationId?: string) =>
        apiCall('/api/notifications', { method: 'PUT', body: { notificationId } }),
    clearAll: () => apiCall('/api/notifications/clear', { method: 'POST' }),
};

/**
 * Search APIs
 */
export const SearchAPI = {
    search: async (query: string) => {
        try {
            const response = await apiCall(`/api/search?q=${encodeURIComponent(query)}`, {
                cache: true,
                cacheDuration: 30000,
                timeout: 15000
            });
            
            // Handle both response formats
            if (response.data) {
                // Nested format: { success: true, data: { users, posts, hashtags } }
                return {
                    users: response.data.users || [],
                    posts: response.data.posts || [],
                    hashtags: response.data.hashtags || []
                };
            }
            
            // Flat format: { success: true, users, posts, hashtags }
            return {
                users: response.users || [],
                posts: response.posts || [],
                hashtags: response.hashtags || []
            };
        } catch (error) {
            console.error('[MasterAPI] Search error:', error);
            // Return empty results instead of throwing
            return {
                users: [],
                posts: [],
                hashtags: []
            };
        }
    },
};

/**
 * Upload APIs
 */
export const UploadAPI = {
    getConfig: () => apiCall('/api/upload', { method: 'POST' }),
    uploadToCloudinary: async (file: File, config: any) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', config.uploadPreset);
        formData.append('folder', config.folder);

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
            {
                method: 'POST',
                body: formData
            }
        );

        if (!response.ok) {
            throw new Error('Upload failed');
        }

        return response.json();
    }
};

// Export default object with all APIs
const MasterAPI = {
    call: apiCall,
    clearCache,
    clearAllCache,
    User: UserAPI,
    Post: PostAPI,
    Story: StoryAPI,
    Reel: ReelAPI,
    Notification: NotificationAPI,
    Search: SearchAPI,
    Upload: UploadAPI
};

export default MasterAPI;
