$(function() {
    
    // after loading the DOM, adjust the svg size according to window height width ratio
    function autoAdjustWindow() {
        var windowWidth = $(this).width(), windowHeight = $(this).height();		
        var $canvas_svg = $("#canvas > svg"),
        svgWidth = $canvas_svg.width(),
        svgHeight = $canvas_svg.height();
        $canvas_svg.height(Math.floor(svgWidth * windowHeight / windowWidth));
    };
    autoAdjustWindow();
    
    // auto adjust when resizing window
	$(window).resize(autoAdjustWindow);
    
    // Here comes the shortest planning algorithm based on visibility graph
    
    /*
    * Compute the shortest path from s to t through graph of obstacles
    * @para obstacles
    * @para s, start point, [x, y]
    * @para t, terminate point, [x, y]
    */
    function shortestPath(obstacles, s, t) {
        // compute the graph of polygonal obstacles
        var graphOfObstacles = naiveVisibleGraph(obstacles),
            vertexes = clone(graphOfObstacles.vertexes),
            adjacentMatrix = clone(graphOfObstacles.adjacentMatrix);

        // judge whether s and t are visible

        // check whether there exist any polygon that intersects with line segment st
        var flag = obstacles.every(function (obstacle) {

            for (var i = 0; i < obstacle.length; ++i) {
                if(isWellIntersected(s, t, obstacle[i], obstacle[(i+1) % obstacle.length])) {
                    return false;
                }
            }

            return true;
        });

        if(flag == true) {
            // s can see t, then return path
            return [s, t];
        }

        // update vertexes and adjacent matrix
        // first, compute all visible vertexes with s, t
        var s_vertexesDistances = [];
        var t_vertexesDistances = [];

        vertexes.forEach(function(v) {
            // deal with s
            // check whether there exist any polygon that intersects with line segment uv
            var flag = obstacles.every(function(obstacle) {

                for(var i = 0; i < obstacle.length; ++i) {
                    if(isWellIntersected(s, v, obstacle[i], obstacle[(i+1) % obstacle.length])) {
                        return false;
                    }
                }

                return true;
            });

            if(flag == true) {
                s_vertexesDistances.push(Math.round(Math.sqrt(Math.pow((s[0] - v[0]), 2) + Math.pow((s[1] - v[1]), 2))));
            }
            else {
                s_vertexesDistances.push(Infinity);
            }

            // deal with t
            // check whether there exist any polygon that intersects with line segment uv
            flag = obstacles.every(function(obstacle) {

                for(var i = 0; i < obstacle.length; ++i) {
                    if(isWellIntersected(t, v, obstacle[i], obstacle[(i+1) % obstacle.length])) {
                        return false;
                    }
                }

                return true;
            });

            if(flag == true) {                
                t_vertexesDistances.push(Math.round(Math.sqrt(Math.pow((t[0] - v[0]), 2) + Math.pow((t[1] - v[1]), 2))));
            }
            else {
                t_vertexesDistances.push(Infinity);
            }
        });

        // update vertexes
        vertexes.push(s, t);
        // append two columns in adjacent matrix
        for(var row = 0; row < adjacentMatrix.length; ++row) {
            adjacentMatrix[row].push(s_vertexesDistances[row], t_vertexesDistances[row]);
        }
        // append two rows in adjacent matrix
        s_vertexesDistances.push(0, Infinity);
        t_vertexesDistances.push(Infinity, 0);
        adjacentMatrix.push(s_vertexesDistances, t_vertexesDistances);

//        adjacentMatrix.forEach(function(row) {
//           console.log(row);
//        });

        return dijkstra({
            vertexes: vertexes,
            adjacentMatrix: adjacentMatrix
        }, vertexes.length - 2, vertexes.length - 1);

    }


    function equalsArray(a, b) {
          return ((a.length == b.length) && (a.every( function(a_i,i) {return (a_i == b[i]);})));
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

    /*
    * Compute visible graph of a set S of disjoint polygonal obstacles
    * @para obstacles, a set of disjoint polygonal obstacles
    */
    function naiveVisibleGraph(obstacles) {

        // compute all vertices and edges of all polygons
        var vertexes = [],
            polygonEdges = [];



        obstacles.forEach(function(obstacle) {
            obstacle.every(function(point, i) {
                vertexes.push(point);
                polygonEdges.push([point, obstacle[(i  + 1) % obstacle.length]]);
                return true;            
            });
        });

    //    console.log(vertexes);
    //    console.log(polygonEdges);

//        var adjacentLists = [];

        var adjacentMatrix = [];

    //    var vertexesCopy = vertexes.slice();

        var vertexesNum = vertexes.length;
        // initialize with all Infinity
        for(var i = 0; i < vertexesNum; ++i) {
            // Infinity row
            var InfinityRow = [];
            for(var j = 0; j < vertexesNum; ++j) {
                InfinityRow.push(Infinity);
            }
            adjacentMatrix.push(InfinityRow);
        }

        // first, add all edges
        var vertexCounter = 0;
        obstacles.forEach(function(obstacle) {
            var startVertexCounter = vertexCounter;
            obstacle.every(function(currentVertex, index) {

                var nextVertexIndex = (index + 1) % obstacle.length,
                    nextVertex = obstacle[nextVertexIndex];
                adjacentMatrix[vertexCounter][vertexCounter] = 0;

                adjacentMatrix[startVertexCounter + nextVertexIndex][vertexCounter] = adjacentMatrix[vertexCounter][startVertexCounter + nextVertexIndex] = Math.round(Math.sqrt(Math.pow((currentVertex[0] - nextVertex[0]), 2) + Math.pow((currentVertex[1] - nextVertex[1]), 2)));

                ++vertexCounter;

                return true;
            });
        });    

//        console.log(adjacentMatrix);

        // second, add all not well intersected uv, where u, v lie in diffeent polygons    
        // before do it exactly, we computer the start vertex counter for each obstacles
        var obstaclesStartVertexIndices = [];
        var startVextexIndex = 0;
        obstacles.forEach(function(obstacle) {
            obstaclesStartVertexIndices.push(startVextexIndex);
            startVextexIndex += obstacle.length;
        });

    //    console.log(obstaclesStartVertexIndices);

        vertexCounter = 0;
        obstacles.every(function(obstacle, obstacleIndex) {

            obstacle.forEach(function(u) {

                var startVertexIndex = obstaclesStartVertexIndices[obstacleIndex];

                for(var j = obstacleIndex + 1; j < obstacles.length; ++j) {

                    startVertexIndex += obstacles[j - 1].length;

                    var disjointObstacle = obstacles[j];

                    disjointObstacle.every(function(v, vIndex) {

                        // judge whether u and v are visible with each other
                        var flag = polygonEdges.every(function(edge) {
                            if(isWellIntersected(u, v, edge[0], edge[1])) {
                                return false;
                            }
                            return true;
                        });

    //                    console.log(vertexCounter + " " + (startVertexIndex + vIndex));

                        if(flag) { // no intersection
                            adjacentMatrix[startVertexIndex + vIndex][vertexCounter] = adjacentMatrix[vertexCounter][startVertexIndex + vIndex] = Math.round(Math.sqrt(Math.pow((u[0] - v[0]), 2) + Math.pow((u[1] - v[1]), 2)));
                        }
                        else {
                            adjacentMatrix[startVertexIndex + vIndex][vertexCounter] = adjacentMatrix[vertexCounter][startVertexIndex + vIndex] = Infinity;
                        }

                        return true;
                    });    
                }
                ++vertexCounter;
            });

            return true;
        });

        return {
                vertexes: vertexes,
//                adjacentLists: adjacentLists,
                adjacentMatrix: adjacentMatrix            
               };

    }



    /*
    * judge two line segments is well intersected, line segment 1 ab, line segment 2 cd
    * @para a = [x1, y1], point 1
    * @para b = [x2, y2], point 2
    * @para c = [x3, y3], point 3
    * @para d = [x4, y4], point 4
    */

    function isWellIntersected(a, b, c, d) {
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
            // not any point of the four end points
            if(!equalsArray(i, a) && !equalsArray(i, b) && !equalsArray(i, c) && !equalsArray(i, d)) {
                return true;
            }
        }
        return false;
    }


    /*
    * judge two line segments is intersected, line segment 1 p1p2, line segment 2 p3p4
    * @para p1 = [x1, y1], point 1
    * @para p2 = [x2, y2], point 2
    * @para p3 = [x3, y3], point 3
    * @para p4 = [x4, y4], point 4
    */

    function isIntersected(p1, p2, p3, p4) {    
        return (CCW(p1, p3, p4) != CCW(p2, p3, p4) && (CCW(p1, p2, p3) != CCW(p1, p2, p4)));    
    }

    /*
    * judge whether three points are counter-clockwise.
    * Three points are a counter-clockwise turn if ccw > 0, clockwise if ccw < 0, and collinear if ccw = 0
    * because ccw is a determinant that gives twice the signed area of the triangle formed by p1, p2 and p3.
    * 
    * @para p1 = [x1, y1], point 1
    * @para p2 = [x2, y2], point 2
    * @para p3 = [x3, y3], point 3
    */
    function CCW(p1, p2, p3) {
        return ((p1[1] - p3[1])*(p2[0] - p3[0]) - (p1[0] - p3[0])*(p2[1] - p3[1])) < 0 ? true : false;
    }

    /*
    * Compute the shortest path in graph from start point to end point
    * @para graph = {vertexes: vertexes, adjacentMatrix: adjacentMatrix}, including start vertex and  end vertex.
    * @para startIndex, the index of start vertex, [0, graph.vertexes.length - 1]
    * @para endIndex, the index of end vertex, [0, graph.vertexes.length - 1]
    */
    function dijkstra(graph, startIndex, endIndex) {

        var vertexes = graph.vertexes,
            vertexNum = vertexes.length,
            adjacentMatrix = graph.adjacentMatrix;

        // define a set to store the unvisited vertexes
        // This is implemented through a flag array.
        var unvisitedVertexes = [];

        // define two arrays, distance and previousVertexes
        // distances is used to store minimum distance from start to a vertex
        // previousVertexes is used to store previous vertex of v in the optimal path from start to v
        var distances = [],
            previousVertexes = [];

        // initialize with true, represents unvisited
        for(var i = 0; i < vertexNum; ++i) {
            unvisitedVertexes.push(true);
            distances.push(Infinity);
            previousVertexes.push(undefined);
        }
        // from start to start vertex, distance is of course zero
        distances[startIndex] = 0;

        // the number of unvisited vertexes
        var unvisitedVertexesNum = vertexNum;

    //    console.log(vertexNum);

        while (unvisitedVertexesNum > 0) {

    //        var nearestVertex = 0;
            // find the first unvisited element
            for(var i = 0; i < vertexNum; ++i) {
                if(unvisitedVertexes[i]) {
                    nearestVertex = i;
                    break;
                }
            }

    //        console.log(distances);
            for(var i = 0; i < vertexNum; ++i) {
                if(unvisitedVertexes[i] && (distances[i] < distances[nearestVertex])) {
                    nearestVertex = i;
                }
            }

//            console.log(nearestVertex);

            // find the optimal path from start to end vertex
            if(nearestVertex == endIndex) {
                var optimalPathVertexes = [];
                var currentVertex = endIndex;
                while(previousVertexes[currentVertex] !== undefined) {
                    optimalPathVertexes.push(currentVertex);
                    currentVertex = previousVertexes[currentVertex];
                }

                optimalPathVertexes.push(startIndex);

    //            console.log(optimalPathVertexes);

                var optimalPath = [];
                for(var i = optimalPathVertexes.length - 1; i >= 0; --i) {
                    optimalPath.push(vertexes[optimalPathVertexes[i]]);
                }

                return optimalPath;
            }

            // remove nearestVertex from unvisitedVertexes
            unvisitedVertexes[nearestVertex] = false;

            // for each neighbour (in unvisitedVertexes) of nearestVertex, check whether the path through it can replace previous path
            var alternativePathDistance = 0;
            for(var i = 0; i < vertexNum; ++i) {
                if(unvisitedVertexes[i] && isFinite(adjacentMatrix[nearestVertex][i])) {
                    alternativePathDistance = distances[nearestVertex] + adjacentMatrix[nearestVertex][i];
                    if(alternativePathDistance < distances[i]) {
                        distances[i] = alternativePathDistance;
                        previousVertexes[i] = nearestVertex;
                    }
                }
            }
            unvisitedVertexesNum--;
        }

//        console.log(unvisitedVertexes);
//        console.log(previousVertexes);
//        console.log(distances);

        return false;
    }


    // console.log(CCW([-1, 6], [-2, -8], [2, 0]));
    // console.log(isWellIntersected([1, 1], [3, 3], [2, 6], [2, -2]));

    //console.log(naiveVisibleGraph(obstacles));
    
    
    // define margin and padding
    var d3_svg = d3.select("#canvas").select("svg"),
        svgWidth = d3_svg.style("width").replace("px", ""),
        svgHeight = d3_svg.style("height").replace("px", ""),
        margin = {top: 10, right: 10, bottom: 10, left: 10},
        padding = {top: 10, right: 10, bottom: 10, left: 10},
        innerWidth = svgWidth - margin.left - margin.right,
        innerHeight = svgHeight - margin.top - margin.bottom,
        width = innerWidth - padding.left - padding.right,
        height = innerHeight - padding.top - padding.bottom;

    // set visible area, i.e., the container of visualized charts
    var d3_svg_g = d3_svg.select("g").attr({"transform": "translate(" + (margin.left + padding.left) + "," + (margin.top + padding.top) + ")"});

    var line = d3.svg.line()
            .x(function(d) { return d[0]; })
            .y(function(d) { return d[1]; });
    
    // draw a boundary - a rectangle
    var d3_svg_g_rect = d3_svg_g.append("rect").attr({"x": "0", "y": "0", "width": width, "height": height, "fill": "#ffffff", "stroke": "#000000", "id": "gameBoundary"});
    
    // useful color generator
    var colorOrdinalScale = d3.scale.category10();
    
    var test_obstacles = [
        [ [26, 20], [180,34], [88, 200], [20, 80] ],
        [ [400, 100], [600, 400], [800, 200] ],
        [ [90, 200], [100, 400], [300, 280] ]
    ];
    
    //var obstacles = [
    //    [ [1, 1], [3, 3], [2, 6] ],
    //    [ [2, -2], [-2, -6], [4, -10], [8, -8] ]
    //];
    
    // user draw polygons
    var obstacles = [],
        currentObstacle = undefined,
        currentObstaclePath = undefined,
        tracingLineSegment = d3_svg_g.append("line").attr({"stroke": "#2ca02c"}),
        isTracing = false,
        polyRobot = undefined,
        polyRobotPath = undefined,
        isDrawingPolyRobot = false;
        startPoint = undefined,
        startPointCircle = undefined,
        endPoint = undefined,
        endPointCircle = undefined,
        dilatedMap = undefined,
        gameHint = d3_svg.append("text").style("text-anchor", "middle").attr({"x": svgWidth / 2 - 48, "y": svgHeight - padding.bottom + 6, "class": "label"}).style("font-size", "1em").text("Click to add a vertex");
    
    // drawing states, used to control the interactive behaviors
    var drawingStates = {
        pointRobotState: true,
        polygonalRobotState: false,
        drawPolygonsState: true,
        drawStartEndPoints: false
    };
    
    // switch between point robot and polygonal state
    var pointRobotButton = $("#pointRobotBtn").click(function() {
        if(!drawingStates.pointRobotState) {
            drawingStates.pointRobotState = true;
            drawingStates.polygonalRobotState = false;
            $(this).removeClass("btn-default").addClass("btn-success").next().removeClass("btn-success").addClass("btn-default");
        }
        
        if(startPoint != undefined || endPoint != undefined) {
            // clear the canvas to start a new game
            $("#clearBtn").trigger("click");
        }
    });
    
    var polygonalRobotButton = $("#polygonalRobotBtn").click(function() {
        if(!drawingStates.polygonalRobotState) {
            drawingStates.pointRobotState = false;
            drawingStates.polygonalRobotState = true;
            $(this).removeClass("btn-default").addClass("btn-success").prev().removeClass("btn-success").addClass("btn-default");
        }
        
        if(startPoint != undefined || endPoint != undefined) {
            // clear the canvas to start a new game
            $("#clearBtn").trigger("click");
        }
    });
    
    // swith between draw polygons state and draw start / end points state    
    var drawPolygonsButton = $("#drawPolygonsBtn").click(function() {
        if(!drawingStates.drawPolygonsState) {
            drawingStates.drawPolygonsState = true;
            drawingStates.drawStartEndPoints = false;
            $(this).removeClass("btn-default").addClass("btn-primary").next().removeClass("btn-primary").addClass("btn-default");
            
            gameHint.text("Hint: Click to add a vertex!");
        }
        
        if(startPoint != undefined || endPoint != undefined) {
            // clear the canvas to start a new game
            $("#clearBtn").trigger("click");
        }
    });
    
    var drawStartEndPointsButton = $("#drawStartEndPointsBtn").click(function() {
        if(!drawingStates.drawStartEndPoints) {
            drawingStates.drawPolygonsState = false;
            drawingStates.drawStartEndPoints = true;
            $(this).removeClass("btn-default").addClass("btn-primary").prev().removeClass("btn-primary").addClass("btn-default");
            
            gameHint.text("Click to add a start point!");
        }
        if(startPoint != undefined || endPoint != undefined) {
            // clear the canvas to start a new game
            $("#clearBtn").trigger("click");
        }
    });
    
    // clear, danger operation
    $("#clearBtn").click(function() {
        $( "#dialog" ).dialog({
            title: "Clear all polygons and paths?",
            closeOnEscape: true,
            closeText: "OK",
            buttons: [{
                text: "Ok",
                click: function() {
                    $( this ).dialog( "close" );
                    // remove paths
                    $("#canvas > svg > g > path").remove();
                    // remove all circles
                    $("#canvas > svg > g > circle").remove();
                    // reset all
                    obstacles = [];
                    currentObstacle = undefined;
                    currentObstaclePath = undefined;
                    isTracing = false;
                    polyRobot = undefined;
                    polyRobotPath = undefined;
                    isDrawingPolyRobot = false;
                    startPoint = undefined;
                    endPoint = undefined;
                    drawPolygonsButton.trigger("click");
                    
                    tracingLineSegment.attr({"x1":0, "y1":0, "x2": 0, "y2":0});
                }
            }]
            
            
        });
    });
    
    
    // draw a polygon
    $("#canvas > svg").click(function(event) {
        var xCoordinator = event.offsetX - margin.top - padding.top,
            yCoordinator = event.offsetY - margin.left - padding.left;
        if(xCoordinator < width && xCoordinator > 0 && yCoordinator < height && yCoordinator > 0) {
            
            if(drawingStates.pointRobotState) { // point robot
                if(drawingStates.drawPolygonsState) { // draw polygons state
                    if(currentObstacle == undefined) { // first vertex
                        currentObstacle = [];
                        currentObstaclePath = d3_svg_g.append("path").attr({"fill": colorOrdinalScale(Math.random() * 9), "stroke": "#aec7e8"});
                        // set tracing state true
                        isTracing = true;
                        
                        // update the hint
                        gameHint.text("Good job!");
                    }
                    else {
                        // update the hint
                        gameHint.text("Keep clicking to add a new vertex or Press spacer to end the polygon.");
                    }
                    currentObstacle.push([xCoordinator, yCoordinator]);
                    currentObstaclePath.attr({"d": line(currentObstacle)});
                }
                else { // draw start / end points
                    if(startPoint == undefined) {
                        startPoint = [xCoordinator, yCoordinator];
                        startPointCircle = d3_svg_g.append("circle").attr({"cx": xCoordinator, "cy": yCoordinator, "r": "6px", "fill": "#00ff00"});
                        gameHint.text("Click to add an end point!");
                    }
                    else if(endPoint == undefined){
                        endPoint = [xCoordinator, yCoordinator];
                        endPointCircle = d3_svg_g.append("circle").attr({"cx": xCoordinator, "cy": yCoordinator, "r": "6px", "fill": "#ff0000"});
                        var a_shortestPath = shortestPath(obstacles, startPoint, endPoint);
                        console.log(a_shortestPath);

                        var theShortestPath = d3_svg_g.append("path").attr({"d": line(a_shortestPath), "fill": "none", "stroke": colorOrdinalScale(Math.random() * 9), "stroke-width": "4px"});
                        
                        // move the robot along the line
                        startPointCircle.transition()
                            .duration(7500)
                            .attrTween("transform", translateAlong(theShortestPath.node()))
                            .each("end", function() {startPointCircle.attr({"transform": "translate(0, 0)"})});
                        
                        gameHint.text("Good job!");
                    }
                }
            }
            else { // polygonal robot
                if(drawingStates.drawPolygonsState) { // draw polygons state
                    if(currentObstacle == undefined) { // first vertex
                        currentObstacle = [];
                        currentObstaclePath = d3_svg_g.append("path").attr({"fill": colorOrdinalScale(Math.random() * 9), "stroke": "#aec7e8"});
                        // set tracing state true
                        isTracing = true;
                        
                        // update the hint
                        gameHint.text("Good job!");
                    }
                    else {
                        // update the hint
                        gameHint.text("Keep clicking to add a new vertex or Press spacer to end the polygon.");
                    }
                    currentObstacle.push([xCoordinator, yCoordinator]);
                    currentObstaclePath.attr({"d": line(currentObstacle)});
                    
                }
                else { // set start / end points
                    if(startPoint == undefined) { // add the start point
                        startPoint = [xCoordinator, yCoordinator];
                        d3_svg_g.append("circle").attr({"cx": xCoordinator, "cy": yCoordinator, "r": "6px", "fill": "#00ff00"});
                        polyRobotPath = d3_svg_g.append("path").attr({"fill": "rgba(255, 127, 13, 0.5)", "stroke": "#aec7e8"});
                        polyRobot = [];

                        // get into the polygonal robot drawing state                       
                        isDrawingPolyRobot = true;

                       gameHint.text("Click to add a polygonal shape to the robot!");
                    }
                    else if(polyRobot == undefined || isDrawingPolyRobot){ // add a polygonal shape to the robot

                        // don't forget to make the polyRobot CCW and the first vertex has the smallest y-coordinate                        
                        polyRobot.push([xCoordinator, yCoordinator]);
                        
                        // show the polygonal robot
                        polyRobotPath.attr({"d": line(polyRobot)});

                        gameHint.text("Click to add a new vertex to the robot or Press spacer to end!");
                    }
                    else { // add the end point
                        endPoint = [xCoordinator, yCoordinator];
                        d3_svg_g.append("circle").attr({"cx": xCoordinator, "cy": yCoordinator, "r": "6px", "fill": "#ff0000"});
                        
                        // TODO
                        
                        var a_shortestPath = shortestPath(dilatedMap.dilate, startPoint, endPoint);
                        console.log("Shortest path:" + a_shortestPath);

                        var theShortestPath = d3_svg_g.append("path").attr({"d": line(a_shortestPath), "fill": "none", "stroke": colorOrdinalScale(Math.random() * 9), "stroke-width": "4px"});
                        
                        // move the robot along the line
                        polyRobotPath.transition()
                            .duration(7500)
                            .attrTween("transform", translateAlong(theShortestPath.node()))
                            .each("end", function() {polyRobotPath.attr({"transform": "translate(0, 0)"})});
                        
                        gameHint.text("Good job!");
                    }
                }
            }
        }
//        console.log(event);
    });    
    
    // move a polygon along a path, from http://bl.ocks.org/KoGor/8162640
    function translateAlong(path) {
        var l = path.getTotalLength();
        return function(i) {
            return function(t) {
                var p = path.getPointAtLength(t * l);
                return "translate(" + (p.x - startPoint[0]) + "," + (p.y - startPoint[1]) + ")"; // move polygon
            }
        }
    }
    
    
    // trace user's mouse
    $("#gameBoundary").on("mousemove", function(event) {
        if(isTracing/* && drawingStates.pointRobotState*/) { // tracing the polygonal obstacle drawing
            var xCoordinator = event.offsetX - margin.top - padding.top,
            yCoordinator = event.offsetY - margin.left - padding.left;
            if(xCoordinator < width && yCoordinator < height) {
                tracingLineSegment.attr({"x1": currentObstacle[currentObstacle.length - 1][0], "y1": currentObstacle[currentObstacle.length - 1][1], "x2": xCoordinator, "y2": yCoordinator});
            }
        }
        
        if(isDrawingPolyRobot && polyRobot!= undefined && polyRobot.length != 0) { // tracing the polygonal shape robot drawing
//            console.log(event);
            var xCoordinator = event.offsetX - margin.top - padding.top,
            yCoordinator = event.offsetY - margin.left - padding.left;
            if(xCoordinator < width && yCoordinator < height) {
                tracingLineSegment.attr({"x1": polyRobot[polyRobot.length - 1][0], "y1": polyRobot[polyRobot.length - 1][1], "x2": xCoordinator, "y2": yCoordinator});
            }
        }    
    });
    
    // finish drawing a polygon
    $(window).keydown(function(event) {
        if(event.keyCode == 32) { // spacer key down
            event.preventDefault();
            tracingLineSegment.attr({"x1": 0, "y1": 0, "x2": 0, "y2":0});
            if(currentObstacle != undefined) {
                obstacles.push(currentObstacle);
                currentObstacle = undefined;
                isTracing = false;
//                $("#gameBoundary").off("mouseover");
            }
            if(isDrawingPolyRobot) { // end the polygonal robot drawing state, and show the dilated obstacles
                
                // dilate the obstacles

                // translate the robot to origin
                var polyRobotZeroZero = clone(polyRobot);
                polyRobotZeroZero.every(function(vertex, index) {
                    polyRobotZeroZero[index][0] -= startPoint[0];
                    polyRobotZeroZero[index][1] -= startPoint[1];

                    return true;
                });

                dilatedMap = broaden(obstacles, polyRobotZeroZero);
                dilatedMap.dilate.forEach(function(obstacle) {
                    d3_svg_g.append("path").attr({"d": line(obstacle), "fill": "rgba(0, 0, 0, 0.2)"});
                });
                
                // set drawing polygonal robot state false
                isDrawingPolyRobot = false;
                gameHint.text("Good job! Click to set the end point.");
            }
            else {
                gameHint.text("Good job! Click to add a new polygon or set the start / end points.");
            }
        }
//        console.log(obstacles);
//        console.log(key);
    });
    
//    obstacles.forEach(function(obstacle) {
//        d3_svg_g.append("path").attr({"d": line(obstacle), "fill": colorOrdinalScale(Math.random() * 9)});
//    });
    
//    var a_shortestPath = shortestPath(obstacles, [20, 10], [700, 380]);
//    console.log(a_shortestPath);
    
//    d3_svg_g.append("path").attr({"d": line(a_shortestPath), "fill": "none", "stroke": colorOrdinalScale(Math.random() * 9)});

    /**
    * @description Dilate polygons and compute the union set of dilated polygons.
    * @param {Array} map: several polygons on canvas, structure: [[[x1,y1],[x2,y2],...],[[x4,y4],[x5,y5],...]]
    * @param {Array} player: player's polygon, structure: [[x1,y1],[x2,y2],...]
    * @return {Array} {dilate : newMap, route : setOne}: dilating result and union result respectively
    */
    function broaden(map, player){
        var newMap = clone(map);
        var newPlayer = [];
        // first, reverse player's x-axis and y-axis value
        for(var j = 0 ; j < player.length ; j++){
            newPlayer.push([ -player[j][0], -player[j][1] ]);
        }
        
        // next, make the polygons in the map and the player (polygonal robot) counter-clockwise and the first vertex with smallest y-coordinate

        if(newPlayer.length >=3) {
            // y-coordinate is reversed
            if(!CCW(newPlayer[0], newPlayer[1], newPlayer[2])) {
               newPlayer.reverse();
            }
            var ySmallestVertexIndex = 0;
            newPlayer.every(function(vertex, vertexIndex) {
                if(vertex[1] < newPlayer[ySmallestVertexIndex][1]) {
                    ySmallestVertexIndex = vertexIndex;
                }
                else if(vertex[1] == newPlayer[ySmallestVertexIndex][1] && vertex[0] < newPlayer[ySmallestVertexIndex][0]) {
                    ySmallestVertexIndex = vertexIndex;
                }
                return true;
            });
            // make the smallest y-coordinate vertex the first vertex
            var newPlayerCopy = [];
            
            newPlayer.every(function(vertex, index) {
                
                newPlayerCopy.push(newPlayer[(index + ySmallestVertexIndex) % newPlayer.length]);
                
                return true;
            });
            
//            console.log(newPlayerCopy);
            
            var newMapCopy = [];
            newMap.forEach(function(obstacle) {
                // y-coordinate is reversed
                if(obstacle.length >= 3 && !CCW(obstacle[0], obstacle[1], obstacle[2])) {
                   obstacle.reverse();
                }
                var ySmallestVertexIndex = 0;
                obstacle.every(function(vertex, vertexIndex) {
                    if(vertex[1] < obstacle[ySmallestVertexIndex][1]) {
                        ySmallestVertexIndex = vertexIndex;
                    }
                    else if(vertex[1] == obstacle[ySmallestVertexIndex][1] && vertex[0] < obstacle[ySmallestVertexIndex][0]) {
                        ySmallestVertexIndex = vertexIndex;
                    }
                    return true;
                });
                // make the smallest y-coordinate vertex the first vertex
                var obstacleCopy = [];

                obstacle.every(function(vertex, index) {

                    obstacleCopy.push(obstacle[(index + ySmallestVertexIndex) % obstacle.length]);

                    return true;
                });
                
                newMapCopy.push(obstacleCopy);
                
            });
            
//            console.log(newMapCopy);
        }
        
        
        var dilatedMap = [];
        //Dilate polygons
        for(var i = 0; i < newMapCopy.length; i++){
            dilatedMap.push(minkowskiSum(newMapCopy[i], newPlayerCopy));
        }

        var setOne = [];

        //Compute union set of dilated polygons.
        for(var k = 0; k < dilatedMap.length; k++){
            var count = 0;
            for(var l = 0; l < dilatedMap.length; l++){
                if(union(dilatedMap[k], dilatedMap[l])==false){
                    count++;
                }
                else{
                    if(k < l){
                      setOne.push(union(dilatedMap[k], dilatedMap[l]));         
                    }
                }    
            }
            if(count==(dilatedMap.length-1)){
                setOne.push(dilatedMap[k]); 

            }
        }
        return {dilate : dilatedMap, route : setOne};
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
        
        if(i == P.length - 1) {
            for(; j < Q.length - 1; ++j) {
                R.push([P[i-1][0]+Q[j][0] , P[i-1][1]+Q[j][1]]);
            }
        }
        else if(j == Q.length - 1) {
            for(; i < P.length - 1; ++i) {
                R.push([P[i][0]+Q[j-1][0] , P[i][1]+Q[j-1][1]]);
            }
        }

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

    /**
       * @description Compute two polygons P and Q's union set. 
       * @param {Array} PQ and QP: two sequences gained by outerPoints(), structure: [[x1,y1],[x2,y2],...]
       * @return {Array} sequence: unioned polygon, structure: [[x1,y1],[x2,y2],...]
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
    
    
});