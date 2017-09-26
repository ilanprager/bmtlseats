<html>

    <title>BMTL Seating Widget </title>
    <script src="//js.jotform.com/JotFormCustomWidget.min.js"></script>


<head>

<style>
.seatingGrid {
    width: 100%;
    height: 100%;
    border: 1px solid black;
    border-collapse: collapse;
}
.seatingGrid td {
    width: 20px;
    height: 20px;
    border: 1px solid black;
}
    
.seat {
    background-color: moccasin;
}
    
.shulchan, .bimah {
    background-color: lightgray;
}

.pole {
    background-color: darkgray;
}
    
.rabbi {
    background-color: aquamarine;
}
    
.rowHeader, .colHeader {
    text-align: center;
}
    
.seat.choice-0 {
    background-color: green;
}
    
.seat.choice-1 {
    background-color: yellow;
}
</style>
    
<script>
    
// numRows: number of total grid rows including headers
// numCols: number of total grid columns including headers
// startRowCode: letter code at which to start grid rows
// startRowCodeIndex: zero based index at which to start labeling rows
// startColumnCodeIndex: zero based index at which to start labeling columns
// codeColumnsIndexes: array of zero based columns indexes where numbers should appear    
// numChoices: number of choices (e.g. choose 1st and 2nd preference for seats == 2)
var lowerConfig = {
    numRows: 22,
    numCols: 28,
    startRowCode: "A",
    startRowIndex: 2,
    startColumnCodeIndex: 1,
    codeColumnsIndexes: [0, 27],  
    numChoices: 2,
    regions: {
        seat: ["A1:C5", "D2:D5", "B7:B8", "C7:F10", "C17:F20", "A21:A26", "B22:F26", "G2:G5", "H2:I8",
               "J2:J4", "J6:J8", "K2:K8", "M2:M7", "N3:N7", "H10:N16", "H18:I25", "J18:J21", "J24:J25",
               "K18:M25", "P10:P12", "Q9:T12", "P15:R20", "S15:S18", "T15:T16", "P23:Q25", "R23:S26"],
        shulchan: ["C11:F16"],
        bimah: ["@10:@17","@20", "A13:A14"],
        pole: ["@1", "@26", "J5", "J22:J23"],
        rabbi: ["@19:A19"]        
    }
};
    
var upperConfig = {
    numRows: 25,
    numCols: 30,
    startRowCode: "U",
    startRowIndex: 2,
    startColumnCodeIndex: 1,
    codeColumnsIndexes: [0, 29],
    numChoices: 2,
    regions: {
        seat: ["U2:Y3", "AA2:AE3", "AG2:AK3", "U26:Y27", "AA26:AE27", "AG26:AK27", "AL27", "AM5:AP10", "AN1:AP3", "AM12:AP17", "AM19:AP24", "AO26:AQ28"]
//        pole: ["@1", "@26", "J5", "J22:J23"]
    }
};

function createClass(classDef) {
    var newClass = classDef.constructor;
    Object.assign(newClass.prototype, classDef);
    return newClass;
}
    
var SeatingGrid = createClass({
    
    constructor: function(config) {
        this.config = config;
        this.state = {
            selected: {}
        };
        this.initSelected();
        this.eventListeners = {};
    },
    
    initSelected: function() {
        for (var i = 0; i < this.config.numChoices; i++) {
            this.state.selected[i] = {};
        }        
    },
    
    createGrid: function() {
        var config = this.config;
        var grid = document.createElement("table");
        grid.className = "seatingGrid";
        var tBody = document.createElement("tbody");
        grid.appendChild(tBody);
        for(var rowIndex = 0; rowIndex < config.numRows; rowIndex++) {
            var row = document.createElement("tr");
            for(var cellIndex = 0; cellIndex < config.numCols; cellIndex++) {
                var cell = document.createElement("td");
                row.appendChild(cell);
            }
            tBody.appendChild(row);
        }
        this.addRowHeaders(grid, config.startRowCode, config.numRows)
        this.addColumnHeaders(grid, config.numCols);
        this.applyGridCellStyles(grid, config);
        return grid;
    },
    
    applyGridCellStyles: function(grid, config) {
        var regions = config.regions;
        for (var category in regions) {
            var ranges = regions[category];
            for (var i = 0; i < ranges.length; i++) {
                var coordinates = this.getLogicalRangeCoordinates(ranges[i]);
                for (var rowIndex = coordinates.begin.y; rowIndex <= coordinates.end.y; rowIndex++) {
                    for (var colIndex = coordinates.begin.x; colIndex <= coordinates.end.x; colIndex++) {
                        var cell = null;
                        try {
                            cell = this.getCellAt(grid, colIndex, rowIndex);  
                        } catch(e) {
                            console.error(ranges[i], coordinates);
                        }
                        cell.rowCode = this.getCellAt(grid, 0, rowIndex).rowCode;
                        cell.colCode = this.getCellAt(grid, colIndex, 0).colCode;
                        cell.className += category + " ";
                        if (category == "seat") {
                            this.assignSeatEvents(cell);
                        }
                    }
                }
            }
        }
    },
    
    getActualRangeCoordinates: function(range) {
        var components = range.split(":");
        var begin = components[0];
        var end = components.length > 1 ? components[1] : begin;
        return {
            begin: this.getCoordinates(begin),
            end: this.getCoordinates(end)
        };
    },
    
    // interprets user supplied values and applies shift
    getLogicalRangeCoordinates: function(range) {
        var coordinates = this.getActualRangeCoordinates(range);
        this.shiftRangeCoordinates(coordinates, 
                                   this.config.startColumnCodeIndex, 
                                   this.config.startRowIndex - this.translateLetterCodeToNumber(this.config.startRowCode));
        return coordinates;
    },
    
    getCoordinates: function(location) {
        var match = location.match(/(\D*)(\d*)/);
        var y = this.translateLetterCodeToNumber(match[1]); // this will be zero based where A == 0
        var x = parseInt(match[2]) - 1;    // subtract to make number component zero based
        return { x: x, y: y};
    },

    translateLetterCodeToNumber: function(letterCode) {
        var value = 0;
        value += letterCode.charCodeAt(letterCode.length - 1) - 65;
        if (letterCode.length > 1) {
            value += (letterCode.charCodeAt(0) - 65 + 1) * 26;
        }
        return value;
    },
    
    getCellAt: function(grid, x, y) {
        return grid.tBodies[0].childNodes[y].childNodes[x];
    },
    
    getSelectedChoice: function(seatCode) {
        for (var choice = 0; choice < this.config.numChoices; choice++) {
            if (this.state.selected[choice][seatCode]) {
                return choice;
            }  
        }
        return -1;
    },
    
    selectChoice: function(cell, seatCode, choice) {
        this.addClass(cell, "choice-" + choice);
        this.state.selected[choice][seatCode] = true;
    },
    
    deselectChoice: function(cell, seatCode, choice) {
        this.removeClass(cell, "choice-" + choice);
        delete this.state.selected[choice][seatCode];        
    },
    
    createStatusEvent: function(mixinData) {
        var status = {
            seatChoices: {}
        };
        for (var choiceKey in this.state.selected) {
            status.seatChoices[choiceKey] = Object.keys(this.state.selected[choiceKey]);            
        }
        if (mixinData) {
            Object.assign(status, mixinData);
        }
        return status;
    },
	
    getStatus() {
	return this.createStatusEvent();    
    },
    
    onCellClick: function(cell) {
        var seatCode = cell.rowCode + cell.colCode;
        var selectedChoice = this.getSelectedChoice(seatCode);
        if (selectedChoice > -1) {
            this.deselectChoice(cell, seatCode, selectedChoice);
        }
        selectedChoice++;
        if (selectedChoice < this.config.numChoices) {
            this.selectChoice(cell, seatCode, selectedChoice);
        }
        this.fireEvent("change", this.createStatusEvent({
            type: "change"
        }));
    },
    
    on: function(eventName, listener) {
        var listeners = this.eventListeners[eventName];
        if (!listeners) {
            listeners = [];
            this.eventListeners[eventName] = listeners;
        }
        listeners.push(listener);
    },
    
    fireEvent: function(eventName, event) {
        var listeners = this.eventListeners[eventName];
        if (listeners) {
            listeners.forEach(function(listener) {
                listener(event);
            }, this);
        }
    },
    
    hasClass: function(elem, className) {
        if (elem.classList) {
            return elem.classList.contains(className);            
        } else {
            return !!elem.className.match(new RegExp('(\\s|^)' + className + '(\\s|$)'));
        }
    },

    addClass(elem, className) {
        if (elem.classList) {
            elem.classList.add(className);            
        } else if (!this.hasClass(elem, className)) {
            elem.className += " " + className;
        }
    },

    removeClass: function(elem, className) {
        if (elem.classList) {
            elem.classList.remove(className)            
        } else if (this.hasClass(elem, className)) {
            var reg = new RegExp('(\\s|^)' + className + '(\\s|$)');
            elem.className = elem.className.replace(reg, ' ');
        }
    },
    
    assignSeatEvents: function(cell) {
        cell.onclick = this.onCellClick.bind(this, cell);
    },
    
    addRowHeaders: function(grid, startLetter, numRows) {
        var code = startLetter.charCodeAt(0);
        var codeColumnsIndexes = this.config.codeColumnsIndexes;
        for(var i = this.config.startRowIndex; i < numRows; i++) {
            codeColumnsIndexes.forEach(function(colIndex) {
                var cell = this.getCellAt(grid, colIndex, i);
                var rowCode = this.getRowHeaderLetters(code);
                cell.rowCode = rowCode;
                cell.innerHTML = rowCode;
                cell.className = "rowHeader";                
            }, this);
            code++;
        }
    },
    
    getRowHeaderLetters: function(code) {
        if (code <= 90) {
            return String.fromCharCode(code);
        } else {
            return "A" + String.fromCharCode(code - 26);
        }
    },

    addColumnHeaders: function(grid, numColumns) {
        for(var i = 1; i < numColumns; i++) {
            var cell = this.getCellAt(grid, i, 0);
            var colCode = i + "";
            cell.colCode = colCode;
            cell.innerHTML = colCode;
            cell.className = "colHeader";
        }
    },
    
    shiftRangeCoordinates: function(rangeCoordinates, xOffset, yOffset) {
       rangeCoordinates.begin.x += xOffset;
       rangeCoordinates.begin.y += yOffset;
       rangeCoordinates.end.x += xOffset;
       rangeCoordinates.end.y += yOffset;
    }
});
</script>
</head>
<body>
    <div id="lowerLevelContainer"></div>
    <div id="upperLevelContainer"></div>
</body>
<script>
function aggregateStatuses(statuses) {
    var nameMap = ["1st","2nd","3rd","4th","5th"];
    var aggregate = {
	seatChoices: {}    
    };
    statuses.forEach(function(status) {
	for(var choiceKey in status.seatChoices) {
	    var choices = status.seatChoices[choiceKey];
	    var aggChoices = aggregate.seatChoices[choiceKey];
	    if (!aggChoices) {
	    	aggChoices = [];
	    	aggregate.seatChoices[choiceKey] = aggChoices;
	    }
	    choices.forEach(function(choice) {
	    	aggChoices.push(choice);
	    });
	}
    });
    for(var choiceKey in aggregate.seatChoices) {
    	var choices = aggregate.seatChoices[choiceKey];
    	delete aggregate.seatChoices[choiceKey];
	aggregate.seatChoices[nameMap[choiceKey]] = choices.join(",");
    }
    return aggregate;
}
JFCustomWidget.subscribe("ready", function(){
    var lowerGrid = new SeatingGrid(lowerConfig);
    var upperGrid = new SeatingGrid(upperConfig);
    document.getElementById("lowerLevelContainer").appendChild(lowerGrid.createGrid());
    document.getElementById("upperLevelContainer").appendChild(upperGrid.createGrid());
    JFCustomWidget.subscribe("submit", function() {
	var lowerStatus = lowerGrid.getStatus();
	var upperStatus = upperGrid.getStatus();
	var aggregateStatus = aggregateStatuses([lowerStatus, upperStatus]);
	JFCustomWidget.sendSubmit({
		valid: true,
		value: JSON.stringify(aggregateStatus)
	});
    });
});
</script>
</html>