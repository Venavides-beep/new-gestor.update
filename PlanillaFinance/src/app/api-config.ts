export const API_URL = 'http://15.235.16.229:3000';

export const getAuthHeaders = (extraHeaders = {}) => {
    const masterKey = localStorage.getItem('hwperu_master_key') || '';
    const userStr = localStorage.getItem('hwperu_user');
    let token = '';
    
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            token = user.token || '';
        } catch (e) {
            console.error('Error parsing user for token');
        }
    }

    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-hwperu-key': masterKey,
        ...extraHeaders
    };
};
