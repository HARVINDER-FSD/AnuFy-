// API Configuration
// Connects frontend to the standalone API server

// API Server URL (change based on environment)
const API_SERVER_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Determine API base URL
export const getAPIBaseURL = () => {
  // Use environment variable or default to localhost:3001
  return API_SERVER_URL
}

// Enhanced fetch that automatically uses correct API URL
export async function apiFetch(endpoint: string, options?: RequestInit) {
  const baseURL = getAPIBaseURL()
  const url = `${baseURL}${endpoint}`
  
  console.log(`🌐 API Call: ${url}`)
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })
    
    if (!response.ok) {
      console.error(`❌ API Error: ${response.status} ${response.statusText}`)
    }
    
    return response
  } catch (error) {
    console.error(`❌ Network Error:`, error)
    throw error
  }
}

// Export for use in components
export const API_BASE_URL = getAPIBaseURL()

// API Client class for easier usage
export class APIClient {
  private baseURL: string

  constructor() {
    this.baseURL = getAPIBaseURL()
  }

  async request(endpoint: string, options?: RequestInit) {
    return apiFetch(endpoint, options)
  }

  async get(endpoint: string, options?: RequestInit) {
    return this.request(endpoint, { ...options, method: 'GET' })
  }

  async post(endpoint: string, data?: any, options?: RequestInit) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put(endpoint: string, data?: any, options?: RequestInit) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete(endpoint: string, options?: RequestInit) {
    return this.request(endpoint, { ...options, method: 'DELETE' })
  }
}

// Export singleton instance
export const apiClient = new APIClient()
