import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

export const createSecret = async (data, iv, timeLimit, viewLimit, type = 'text', fileName = null, mimeType = null) => {
    const response = await axios.post(`${API_URL}/secrets`, {
        data,
        iv,
        timeLimit,
        viewLimit,
        type,
        fileName,
        mimeType
    });
    return response.data;
};

export const getSecret = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/secrets/${id}`);
        return response.data;
    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data.error || 'UNKNOWN_ERROR');
        }
        throw error;
    }
};
