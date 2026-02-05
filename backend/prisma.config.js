module.exports = {
  datasource: {
    url:
      process.env.DATABASE_URL ||
      'postgresql://sudy:1234@localhost:5432/metroflow',
  },
};
