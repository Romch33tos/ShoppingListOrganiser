app.get('/register', (req, res) => {
  if (req.session.userId) return res.redirect('/');
  res.render('register', { error: null, formData: {} });
});

app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  const errors = [];

  const nameError = validateString(name, 'Имя', 2, 50);
  if (nameError) errors.push(nameError);

  const emailError = validateEmail(email);
  if (emailError) errors.push(emailError);

  const passwordError = validatePassword(password);
  if (passwordError) errors.push(passwordError);

  if (errors.length > 0) {
    return res.render('register', { error: errors[0], formData: { name, email } });
  }

  const existingUser = await usersCollection.findOne({ email: email.trim() });
  if (existingUser) {
    return res.render('register', { error: 'Пользователь с таким email уже существует', formData: { name, email } });
  }

  const user = {
    name: name.trim(),
    email: email.trim(),
    passwordHash: `hash_${password}`,
    registeredAt: new Date()
  };

  const result = await usersCollection.insertOne(user);
  req.session.userId = result.insertedId.toString();
  req.session.userName = user.name;
  res.redirect('/');
});
