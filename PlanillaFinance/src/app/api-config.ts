export const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '192.168.18.54'
    ? 'https://gestor.hwperu.com'
    : 'https://gestor.hwperu.com';

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
