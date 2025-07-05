const express = require('express');
const session = require('express-session');
require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(({default:fetch}) => fetch(...args));

const app = express();
app.set('view engine', 'ejs');
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(express.static('public'));
app.use(session({secret:'macro-secret',resave:false,saveUninitialized:true}));

app.use((req,res,next)=>{
  if(!req.session.meals){
    req.session.meals=[
      {time:'breakfast',name:'Breakfast',items:[]},
      {time:'lunch',name:'Lunch',items:[]},
      {time:'dinner',name:'Dinner',items:[]},
      {time:'snack',name:'Snack',items:[]}
    ];
  }
  if(!req.session.recipes) req.session.recipes=[];
  next();
});

function calcMacros(meals){
  const totals={calories:0,protein:0,carbs:0,fats:0};
  meals.forEach(m=>{
    m.items.forEach(i=>{
      totals.calories+=Number(i.calories)||0;
      totals.protein+=Number(i.protein)||0;
      totals.carbs+=Number(i.carbs)||0;
      totals.fats+=Number(i.fats)||0;
    });
  });
  return totals;
}

app.get('/',(req,res)=>{
  res.render('index');
});

app.get('/partials/dashboard',(req,res)=>{
  res.render('partials/dashboard',{macros:calcMacros(req.session.meals)});
});

app.get('/partials/meals',(req,res)=>{
  res.render('partials/meals',{meals:req.session.meals});
});

app.post('/meals/add',(req,res)=>{
  const {mealIndex,name,calories,protein,carbs,fats}=req.body;
  const meal=req.session.meals[mealIndex];
  if(meal){
    meal.items.push({name,calories,protein,carbs,fats});
  }
  res.end();
});

app.get('/partials/recipes',(req,res)=>{
  res.render('partials/recipes',{recipes:req.session.recipes});
});

app.post('/recipes/add',(req,res)=>{
  req.session.recipes.push(req.body);
  res.end();
});

app.get('/partials/ai',(req,res)=>{
  res.send(`
  <div class="ai-tab">
    <form id="aiForm">
      <input name="prompt" type="text" placeholder="Describe your recipe" required>
      <button type="submit">Generate</button>
    </form>
    <pre id="aiResult"></pre>
    <button id="addRecipeBtn" style="display:none;">Add to Recipes</button>
  </div>
  `);
});

app.post('/ai/chat',async (req,res)=>{
  const prompt=req.body.prompt||'';
  try{
    const resp=await fetch('https://api.deepseek.com/v1/chat/completions',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${process.env.DEEPSEEK_KEY||''}`},
      body:JSON.stringify({model:'deepseek-chat',messages:[{role:'user',content:prompt}]})
    });
    const data=await resp.json();
    const text=data.choices?data.choices[0].message.content:'No response';
    res.json({text});
  }catch(e){
    res.json({text:'Failed to fetch AI response.'});
  }
});

const port=process.env.PORT||3000;
app.listen(port,()=>console.log('Server running on '+port));
