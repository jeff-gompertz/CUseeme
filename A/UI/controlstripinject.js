// controlstripinject.js — placeholder actions
document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".ctrl-btn");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      console.log(`Clicked ${btn.id}`);
      btn.classList.toggle("active");
    });
  });
});
