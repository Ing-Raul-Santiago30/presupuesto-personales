const BASE_URL = 'http://localhost:5131/api'

export async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = localStorage.getItem('budgetpro_token')

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
    })

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || 'Error en la petición API')
    }

    if (response.status === 204) return {} as T
    return await response.json()
}
