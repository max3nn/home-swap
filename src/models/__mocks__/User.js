const User = jest.fn().mockImplementation((userData) => {
    const instance = {
        ...userData,
        userId: userData.userId || 'u-123',
        username: userData.username || 'testuser',
        email: userData.email || 'test@example.com',
        userrole: userData.userrole || 'user',
        save: jest.fn().mockResolvedValue(true),
        comparePassword: jest.fn().mockResolvedValue(true),
    };
    return instance;
});

User.findOne = jest.fn();
User.deleteOne = jest.fn();

module.exports = User;