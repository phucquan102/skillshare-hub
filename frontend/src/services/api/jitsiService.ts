import api from './apiConfig';

export const createMeeting = async (data: any) => {
  const res = await api.post('/jitsi/create', data);
  return res.data;
};
