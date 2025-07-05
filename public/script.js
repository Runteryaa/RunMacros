document.addEventListener('DOMContentLoaded',()=>{
  const main = document.getElementById('mainContent');
  const links = document.querySelectorAll('.bottom-nav a');

  function setActive(tab){
    links.forEach(l=>l.classList.toggle('active', l.dataset.tab===tab));
  }

  async function loadTab(tab){
    setActive(tab);
    if(tab==='ai'){
      const res = await fetch('/partials/ai');
      main.innerHTML = await res.text();
      bindAi();
      return;
    }
    const res = await fetch(`/partials/${tab}`);
    main.innerHTML = await res.text();
    if(tab==='dashboard') initCharts();
  }

  links.forEach(l=>{
    l.addEventListener('click',e=>{
      e.preventDefault();
      loadTab(l.dataset.tab);
    });
  });

  loadTab('dashboard');

  function initCharts(){
    const totals={};
    const colors={calories:'#ff512f',protein:'#36d1dc',carbs:'#f7971e',fats:'#c33764'};
    document.querySelectorAll('.macro-card').forEach(card=>{
      const key=card.dataset.key;
      const val=parseFloat(card.dataset.value);
      totals[key]=val;
      const bar=card.querySelector('.progress .bar');
      if(val<=0){
        bar.style.width='0%';
        bar.style.animation='none';
      }else{
        bar.style.width='100%';
      }
    });
    const ctx=document.getElementById('macroChart');
    if(ctx){
      new Chart(ctx,{type:'doughnut',data:{labels:['Calories','Protein','Carbs','Fats'],datasets:[{data:[totals.calories||0,totals.protein||0,totals.carbs||0,totals.fats||0],backgroundColor:[colors.calories,colors.protein,colors.carbs,colors.fats]}]},options:{cutout:'60%'}});
    }
  }

  function bindAi(){
    const form=document.getElementById('aiForm');
    const result=document.getElementById('aiResult');
    const addBtn=document.getElementById('addRecipeBtn');
    form.addEventListener('submit',async e=>{
      e.preventDefault();
      result.textContent='Loading...';
      const fd = new FormData(form);
      const res = await fetch('/ai/chat',{method:'POST',body:new URLSearchParams(fd)});
      const data = await res.json();
      result.textContent=data.text;
      addBtn.style.display='inline-block';
    });
    addBtn.addEventListener('click',async ()=>{
      await fetch('/recipes/add',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:'AI Recipe',description:result.textContent,difficulty:'easy',prepTime:0,servings:1,kcal:0,protein:0,carbs:0,fats:0,tags:[],ingredients:[]})});
      alert('Recipe added');
    });
  }
});
