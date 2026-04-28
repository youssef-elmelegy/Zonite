export const MOCK_DATA = {
  email: {
    user: 'youssefelmelegy999@gmail.com',
    admin: 'admin@example.com',
  },
  password: {
    default: 'SecurePass123',
    newPassword: 'NewSecurePass456',
  },
  name: {
    fullName: 'Ahmed Hassan',
    firstName: 'Ahmed',
    lastName: 'Hassan',
  },
  id: {
    user: '550e8400-e29b-41d4-a716-446655440000',
  },
  dates: {
    default: '2026-04-27T12:00:00.000Z',
    dateOfBirth: '1995-06-15',
  },
} as const;

export const MOCK_IMAGES = {
  avatars: {
    male: 'https://example.com/avatars/male.png',
    female: 'https://example.com/avatars/female.png',
  },
} as const;
