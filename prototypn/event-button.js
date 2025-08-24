	 document.addEventListener("DOMContentLoaded", () => {
	  const knappar = document.querySelectorAll(".kalender-knapp");
	
	  knappar.forEach(knapp => {
	    knapp.addEventListener("click", () => {
	      if (knapp.textContent === "Lägg till i min kalender") {
	        knapp.textContent = "Tillagd i din kalender!";
	      } else {
	        knapp.textContent = "Lägg till i min kalender";
	      }
	    });
	  });
	});  
