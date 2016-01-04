/**
 * file name: index.js
 * time: Jan. 4, 2016
 * @author Dalei Li
 */

$(function() { // executed after the html content is loaded completely
	// Writing the game here
	
	// decalre variables
	var game = "Easy, let's rock!";
	console.log(game);
	
	var arrayExample = ["Jing Li", "Xinye Fu", "Dalei Li"];
	for(var i = 0; i < arrayExample.length; ++i) {
		// console.log(arrayExample[i] + ",");
	}
	
	var arrayWithNamesExample = {"Sister 1":"Jing Li", "Sister 2":"Xinye Fu", "Me":"Dalei Li"};
	console.log(arrayWithNamesExample["Sister 1"] + ", " + arrayWithNamesExample["Sister 2"] + ", " + arrayWithNamesExample["Me"] + ".");
	
	
	// scroll window to hide or show backToTop button
	$(window).scroll(function() {
		if ($(this).scrollTop() > 150) {
			$("#backToTop").fadeIn(100);
		} else {
			$("#backToTop").fadeOut(100);
		}
	});
	
	// jQuery animation scroll
	$("#backToTop").click(function(event) {
		event.preventDefault();
		$("body,html").animate({scrollTop: 0}, 500);
	});
	
});