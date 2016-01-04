/**
 * file name: index.js
 * time: Jan. 4, 2016
 * @author Dalei Li
 */

$(function() { // executed after the html content is loaded completely
	// Writing the game here
	
	// Javascript basics
	// decalre variables
	var $game = "Easy, let's rock!";
	console.log($game);
	
	var $arrayExample = ["Jing Li", "Xinye Fu", "Dalei Li"];
	for(var i = 0; i < $arrayExample.length; ++i) {
		// console.log(arrayExample[i] + ",");
	}
	
	var $arrayWithNamesExample = {"Sister 1":"Jing Li", "Sister 2":"Xinye Fu", "Me":"Dalei Li"};
	console.log($arrayWithNamesExample["Sister 1"] + ", " + $arrayWithNamesExample["Sister 2"] + ", " + $arrayWithNamesExample["Me"] + ".");
	
	// D3 basics
	// Update…
	var d3_p = d3.select("#gameCanvas").selectAll("p")
    .data([4, 8, 15, 16, 23, 30, 42, 30, 23, 16, 15, 8, 4])
    .style("font-size", function(d) { return d + "px"; });
	
	// Enter…
	d3_p.enter().append("p").style("font-size", function(d) { return d + "px"; });

	// Exit…
	d3_p.exit().remove();	
	
	// don't have to change
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