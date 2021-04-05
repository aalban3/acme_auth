const Sequelize = require('sequelize');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();
const { STRING } = Sequelize;
const config = {
  logging: false,
};

if (process.env.LOGGING) {
  delete config.logging;
}
const conn = new Sequelize(
  process.env.DATABASE_URL || 'postgres://localhost/acme_db',
  config
);

const User = conn.define('user', {
  username: STRING,
  password: STRING,
});

const Note = conn.define('note', {
  text: STRING,
});

Note.belongsTo(User);
User.hasMany(Note);

User.beforeCreate(async (user, options) => {
  const SALT_KEY = 5;
  const hashedPassword = await bcrypt.hash(user.password, SALT_KEY);
  user.password = hashedPassword;
});

User.byToken = async (token) => {
  try {
    const verify = jwt.verify(token, process.env.SECRET_KEY);
    const user = await User.findByPk(verify.userId);
    if (user) {
      return user;
    }
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  } catch (ex) {
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  }
};

User.authenticate = async ({ username, password }) => {
  const user = await User.findOne({
    where: {
      username,
    },
  });

  const valid = await bcrypt.compare(password, user.password);
  if (valid) {
    const token = jwt.sign({ userId: user.id }, process.env.SECRET_KEY);
    return token;
  }
  const error = Error('bad credentials');
  error.status = 401;
  throw error;
};

const syncAndSeed = async () => {
  await conn.sync({ force: true });
  const credentials = [
    { username: 'lucy', password: 'lucy_pw' },
    { username: 'moe', password: 'moe_pw' },
    { username: 'larry', password: 'larry_pw' },
  ];
  const notes = [{ text: 'Living' }, { text: 'Sleeping' }, { text: 'Eating' }];
  const [lucy, moe, larry] = await Promise.all(
    credentials.map((credential) => User.create(credential))
  );
  const [note1, note2, note3] = await Promise.all(
    notes.map((note) => Note.create(note))
  );

  lucy.setNotes(note1);
  moe.setNotes([note2, note3]);

  return {
    users: {
      lucy,
      moe,
      larry,
    },
    notes: {
      note1,
      note2,
      note3,
    },
  };
};

module.exports = {
  syncAndSeed,
  models: {
    User,
    Note,
  },
};
