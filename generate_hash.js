const bcrypt = require('bcrypt');
const password = '123456';
const saltRounds = 12;

bcrypt.hash(password, saltRounds).then(hash => {
  console.log('--- PASSWORD HASH START ---');
  console.log(hash);
  console.log('--- PASSWORD HASH END ---');
});
