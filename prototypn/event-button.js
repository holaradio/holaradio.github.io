	 document.addEventListener("DOMContentLoaded", () => {
	  const knappar = document.querySelectorAll(".kalender-knapp");
	
	  knappar.forEach(knapp => {
	    knapp.addEventListener("click", () => {
	      if (knapp.textContent === "Lägg till i kalender") {
	        knapp.textContent = "Tillagd";
	      } else {
	        knapp.textContent = "Lägg till i kalender";
	      }
	    });
	  });
	});  
