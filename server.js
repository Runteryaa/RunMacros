const express = require('express');
const path = require('path');
const session = require('express-session');

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'secret-key', resave: false, saveUninitialized: true }));

// Middleware to initialize session data
app.use((req, res, next) => {
  if (!req.session.meals) {
    req.session.meals = [
      { time: 'Breakfast', calories: 0 },
      { time: 'Lunch', calories: 0 },
      { time: 'Dinner', calories: 0 },
      { time: 'Snack', calories: 0 }
    ];
  }
  if (!req.session.recipes) {
    req.session.recipes = [];
  }
  next();
});

app.get('/', (req, res) => {
  res.redirect('/dashboard');
});

app.get('/dashboard', (req, res) => {
  const totalCalories = req.session.meals.reduce((sum, m) => sum + m.calories, 0);
  res.render('dashboard', { meals: req.session.meals, totalCalories });
});

app.get('/meals', (req, res) => {
  res.render('meals', { meals: req.session.meals });
});

app.post('/meals', (req, res) => {
  const { time } = req.body;
  if (time) {
    req.session.meals.push({ time, calories: 0 });
  }
  res.redirect('/meals');
});

app.get('/recipes', (req, res) => {
  res.render('recipes', { recipes: req.session.recipes });
});

app.post('/recipes', (req, res) => {
  const { name, instructions } = req.body;
  if (name && instructions) {
    req.session.recipes.push({ name, instructions });
  }
  res.redirect('/recipes');
});

app.get('/ai', (req, res) => {
  res.render('ai');
});

app.post('/ai/generate', (req, res) => {
  const { preferences } = req.body;
  // Simple recipe generation placeholder
  const name = `AI Recipe for ${preferences || 'your taste'}`;
  const instructions = `This recipe is tailored to ${preferences || 'your taste'}. Enjoy!`;
  req.session.recipes.push({ name, instructions });
  res.redirect('/recipes');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
