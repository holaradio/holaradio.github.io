	 document.addEventListener("DOMContentLoaded", () => {
	  const knappar = document.querySelectorAll(".kalender-knapp");
	
	  knappar.forEach(knapp => {
	    knapp.addEventListener("click", () => {
	      if (knapp.textContent === "Lägg till i min kalender") {
	        knapp.textContent = "Ta bort från min kalender";
	      } else {
	        knapp.textContent = "Lägg till i min kalender";
	      }
	    });
	  });
	});  
