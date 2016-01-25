var CP1 = [];
CP1[0] = [200, 100];
CP1[1] = [350, 100];
CP1[2]= [375, 200];
CP1[3]= [250, 300];
CP1[4]= [150, 200];

var CP2 = [];
CP2[0] = [230, 80];
CP2[1] = [450, 150];
CP2[2]= [475, 220];
CP2[3]= [350, 400];
CP2[4]= [250, 200];

var CP4 = [];
CP4[0] = [1600, 300];
CP4[1] = [1700, 350];
CP4[2]= [1650, 330];

var CP5 = [];
CP5[0] = [2600, 600];
CP5[1] = [2700, 650];
CP5[2]= [2650, 630];

var map = [];
map.push(CP1);
map.push(CP2);
map.push(CP4);
map.push(CP5);

var player = [];
player.push([20,20]);
player.push([10,20]);
player.push([10,10]);
player.push([20,10]);

console.log(broaden(map,player));

/**
   * @description Dilate polygons and compute the union set of dilated polygons.
   * @param {Array} map: several polygons on canvas, structure: [[[x1,y1],[x2,y2],[x3,y3],...],[[x4,y4],[x5,y5],[x6,y6],...]]
   * @param {Array} player: player's polygon, structure: [[x1,y1],[x2,y2],[x3,y3],...]
   * @return {Array} setOne: polygons after dilating and union, structure: [[[x1,y1],[x2,y2],[x3,y3],...],[[x4,y4],[x5,y5],[x6,y6],...]]
   */
function broaden(map, player){
  var newMap = [];
  var newPlayer = [];

  //reverse player's x-axis and y-axis value
  for(var j = 0 ; j < player.length ; j++){
    newPlayer.push([ -player[j][0], -player[j][1] ]);
  }

  //Dilate polygons
  for(var i = 0; i < map.length; i++){
    newMap.push(minkowskiSum(map[i], newPlayer));
  }

  var setOne = [];

  //Compute union set of dilated polygons.
  for(var k = 0; k < newMap.length; k++){
    var count = 0;
    for(var l = 0; l < newMap.length; l++){
      if(union(newMap[k], newMap[l])==false){
        count++;
      }else{
        if(k < l){
          setOne.push(union(newMap[k], newMap[l]));         
        }
      }
    }
    if(count==(newMap.length-1)){
      setOne.push(newMap[k]); 
    }
  }

  return setOne;
}

/**
   * @description Compute Minknowski Sum of two polygons. 
   * @param {Array} P and Q: two polygons, structure: [[x1,y1],[x2,y2],[x3,y3],...]
   * @return {Array} R: polygon after computing Minknowski Sum, structure: [[x1,y1],[x2,y2],[x3,y3],...]
   */
function minkowskiSum(P, Q){
  var i = 0, j = 0;

  //push the first two points of P and Q into P and Q.
  P.push(P[0], P[1]);
  Q.push(Q[0], Q[1]);

  var R = []; 

  do {
    R.push([P[i][0]+Q[j][0] , P[i][1]+Q[j][1]]);

    //compute segment and x-axis positive's angle. 
    var angle1 = angleWithXAxisPositive(P[i], P[i+1]);

    var angle2 = angleWithXAxisPositive(Q[j], Q[j+1]);

    //compare angle, and return points. 
    if(angle1<angle2){
      i = i+1;
    }
    else if(angle1>angle2){
      j = j+1;
    }
    else{
      i = i+1;
      j = j+1;
    }

  } while(i < P.length-1 && j < Q.length-1);

  return R;
}

// compute the angle between pq and x axis positive
function angleWithXAxisPositive(p, q) {
    var angle = Math.acos((q[0] - p[0]) / Math.sqrt(Math.pow(q[0] - p[0], 2) + Math.pow(q[1] - p[1], 2)));
    if(q[1] - p[1] < 0) {
      angle = 2 * Math.PI - angle;
    }

  return angle * 180 / Math.PI; 
}

function union(CP1,CP2){

	var	PQ,
      QP,
      unionResult = [],
      result = [];

  PQ = outerPoints(CP1,CP2);
  QP = outerPoints(CP2,CP1);

  unionResult = unionChain(PQ,QP);	

  for(var i = 0; i < unionResult.length; i++){
    result.push(unionResult[i].split(','));
  }

  return result;

}


// clone object deep, from http://stackoverflow.com/questions/9399369/how-to-copy-or-duplicate-an-array-of-arrays
function clone (existingArray) {
   var newObj = (existingArray instanceof Array) ? [] : {};
   for (i in existingArray) {
      if (i == 'clone') continue;
      if (existingArray[i] && typeof existingArray[i] == "object") {
         newObj[i] = clone(existingArray[i]);
      } else {
         newObj[i] = existingArray[i]
      }
   }
   return newObj;
}



/**
   * @description Compute two polygons P and Q's union set. 
   * @param {Array} PQ and QP: two sequences gained by outerPoints(), structure: [[x1,y1],[x2,y2],[x3,y3],...]
   * @return {Array} sequence: unioned polygon, structure: [[x1,y1],[x2,y2],[x3,y3],...]
   */
function unionChain(PQ,QP){

    //if P is wholely in Q, QP is what we should return. 
    if(PQ == null){
      return QP;
    }

    //if Q is wholely in P, PQ is what we should return. 
    if(QP == null){
      return PQ;
    }

    var PQNew = new Array();
    var QPNew = new Array();


    for(var u = 0; u < PQ.length ; u++){
      PQNew.push(PQ[u].toString());
    }

    for(var v = 0; v < QP.length ; v++){
      QPNew.push(QP[v].toString());
    }

    //shift QP so that the first element of QP is a element in PQ.
    for(var k = 0; k < QPNew.length; k++){
      if(PQNew.indexOf(QPNew[0]) == -1){
        var a = QPNew[0];
        QPNew.shift();
        QPNew.push(a);
      }else{
        break;
      }

      if(k==(QPNew.length-1)){
        return false;
      }
    }

    var time = PQNew.indexOf(QPNew[0]);

    //shift PQ, so that the element the same as the first element of QP is the last element of PQ. Then delete the element from QP.
    for(var i = 0; i <= time; i++){
      var b = PQNew[0];
      PQNew.shift();
      PQNew.push(b);
    }

    QPNew.shift();

    //if the first element of QP isn't in PQ, add the element directly after PQ's last element. 
    //if the first element of QP is in PQ, shift PQ so that the element the same as the first element of QP is the last element of PQ, 
    //then delete the element from QP. 
    while(QPNew.length > 0){
      if(PQNew.indexOf(QPNew[0]) == -1){
        PQNew.push(QPNew[0]);
      }else{
        var time2 = PQNew.indexOf(QPNew[0]);
        for(var w = 0; w <= time2; w++){
          var b = PQNew[0];
          PQNew.shift();
          PQNew.push(b);
        }
      }
      QPNew.shift();
    }

    return PQNew;
}


/**
   * @description Compute P's vertexes who are out of Q, and P and Q's intersected points.
   * @param {Array} P and Q: polygons, structure: [[x1,y1],[x2,y2],[x3,y3],...]
   * @return {Array} sequence: points' sequence, structure: [[x1,y1],[x2,y2],[x3,y3],...]
   */
function outerPoints(P,Q){
	var sequence = new Array(),
		number = 0,
    inter;

  //push the first point of P and Q into P and Q again.
	P.push(P[0]);
	Q.push(Q[0]);


	for(var i = 0; i < P.length - 1 ; i++){
		number = 0;

    //if a point is on or out of a polygon, push the point into sequence.
		if(isContainedInPolygon(P[i],Q) == 'on'||isContainedInPolygon(P[i],Q) =='out'){
			sequence.push(P[i]);
		}

    //if intersected point exists between current two points, push the point into sequence.
		for(var j = 0; j < Q.length - 1 ; j++){
			inter = intersect(P[i] , P[i+1] , Q[j] , Q[j+1]);

			if(inter!=false){
				sequence.push(inter);
				number++;
			}
		}

    //if there are more than one intersected points in one segment, adjust these points' order.
		if(number > 1){
			var points = new Array();
			for(var m=0 ; m < number ; m++){
        var point = new Array(sequence[sequence.length-1-m], Math.pow(Math.pow(P[i][0]-sequence[sequence.length-1-m][0],2)+
                    Math.pow(P[i][1]-sequence[sequence.length-1-m][1],2),1/2));
				points.push(point);
			}

      points.sort(function compare(x, y) {
        return x[1]-y[1];
      });

			for(var n=0; n < number ; n++){
				sequence.pop();
			}

			for(var k=0 ; k < points.length ; k++){
				sequence.push(points[k][0]);
			}
		}
  }

  P.pop();
  Q.pop();

	return sequence;
}


/**
   * @description Judge whether a point is in a polygon
   * @param {Array} p: points to be judged,structure: [x-axis value, v-axis value]
   * @param {Array} poly polygon, structure: [[x1,y1],[x2,y2],[x3,y3],...]
   * @return {String} p's relation with poly
   */
function isContainedInPolygon(p, poly) {
    var px = p[0],
        py = p[1],
        flag = false;

    for(var i = 0, l = poly.length, j = l - 1; i < l; j = i, i++) {
      	var sx = poly[i][0],
        	sy = poly[i][1],
          	tx = poly[j][0],
          	ty = poly[j][1];

      	// if p is coincided with polygon's vertex;
      	if((sx === px && sy === py) || (tx === px && ty === py)) {
      	  return 'on';
      	}

      	// Judge whether two vertexes of a segment is on two sides of the ray.
      	if((sy < py && ty >= py) || (sy >= py && ty < py)) {
        	var x = sx + (py - sy) * (tx - sx) / (ty - sy);

        	// p is on an edge of the polygon.
        	if(x === px) {
         		return 'on';
          }
        	
        	if(x > px) {
          		flag = !flag;
        	}
      	}
    }

    return flag ? 'in' : 'out';
}


/*
* judge two line segments is intersected, line segment 1 ab, line segment 2 cd
* @para a = [x1, y1], point 1
* @para b = [x2, y2], point 2
* @para c = [x3, y3], point 3
* @para d = [x4, y4], point 4
*/

function intersect(a, b, c, d) {
    // collinear or parallel
    var denominator = (b[1] - a[1]) * (d[0] - c[0]) - (a[0] - b[0]) * (c[1] - d[1]);
    if (denominator == 0) {
        return false;
    }
    // compute the intersection point
    var i = [((b[0] - a[0]) * (d[0] - c[0]) * (c[1] - a[1]) + (b[1] - a[1]) * (d[0] - c[0]) * a[0] - (d[1] - c[1]) * (b[0] - a[0]) * c[0] ) / denominator, -((b[1] - a[1]) * (d[1] - c[1]) * (c[0] - a[0]) + (b[0] - a[0]) * (d[1] - c[1]) * a[1] - (d[0] - c[0]) * (b[1] - a[1]) * c[1] ) / denominator];

    // judge whether the intersection point lies in any line segment
    // lies in line segment p1p2 and lies in line segment p3p4
    if ((i[0] - a[0]) * (i[0] - b[0]) <= 0 && (i[1] - a[1]) * (i[1] - b[1]) <= 0 && (i[0] - c[0]) * (i[0] - d[0]) <= 0 && (i[1] - c[1]) * (i[1] - d[1]) <= 0) {
      return i;
    }
    return false;
}