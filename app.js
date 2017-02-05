var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var multer = require('multer');
var upload = multer({dest: 'uploads/'});
var fs = require('fs');
var chrono = require('chrono-node');

var vision = require('@google-cloud/vision')({
  projectId: 'daring-keep-139023',
  keyFilename: 'My Project-e9080f515280.json'
});

var language = require('@google-cloud/language')({
  projectId: 'daring-keep-139023',
  keyFilename: 'My Project-e9080f515280.json'
});

var library = "DWE,	Douglas Wright Engineering Building,E2,	Engineering 2,E3,	Engineering 3,PHY,	Physics,ML,	Modern Languages,ESC,	Earth Sciences & Chemistry,B1,	Biology 1,LIB,	Dana Porter Arts Library,AL,	Arts Lecture Hall,EV1,	Environment 1,RCH,	J.R. Coutts Engineering Lecture Hall,CSB,	Central Services Building,B2,	Biology 2,GSC,	General Services Complex,COM,	Commissary,SCH,	South Campus Hall,MC,	Mathematics & Computer Building,PAC,	Physical Activities Complex,SLC,	Student Life Centre,V1,	Student Village 1,HS,	Health Services,MHR,	Minota Hagey Residence,HH,	J.G. Hagey Hall of the Humanities,REV,	Ron Eydt Village,UWP,	University of Waterloo Place,UC,	University Club,C2,	Chemistry 2,CPH,	Carl A. Pollock Hall,PAS,	Psychology, Anthropology, Sociology,NH,	Ira G. Needles Hall,BMH,	B.C. Matthews Hall,OPT,	Optometry,EV2,	Environment 2,ECH,	East Campus Hall,DC,	William G. Davis Computer Research Centre,EIT,	Centre for Environmental and Information Technology,BAU,	Bauer Warehouse,COG,	Columbia Greenhouses,CIF,	Columbia Icefield,CLV,	Columbia Lake Village,MKV,	William Lyon Mackenzie King Village,TC,	William M. Tatham Centre for Co-operative Education & Career Services,ARC,	School of Architecture,ERC,	Energy Research Centre,PHR,	Pharmacy,QNC,	Mike & Ophelia Lazaridis Quantum-Nano Centre,RAC,	Research Advancement Centre,IHB,	Integrated Health Building,E5,	Engineering 5,STC,	Science Teaching Complex,DMS,	Digital Media Stratford,M3,	Mathematics 3,EV3,	Environment 3,RA2,	Research Advancement Centre 2,ART,	Arts Building,E6,	Engineering 6,TJB,	Toby Jenkins Applied Health Research Building,EC1,	East Campus 1,EC2,	East Campus 2,EC3,	East Campus 3,EC4,	East Campus 4,EC5,	East Campus 5,E7,	Engineering 7,NRB,	New Residence Building,ST2,	Science Teaching 2,TUN,	Service Tunnels,GST,	Ground Storage Building V2,EV,	Electrical Vault,MV,	Mechanical Vault,POV,	Pedestrian Overpass,PT,	Pedestrian Tunnels,TEN,	Tennis Courts,SGR,	Schmidt Greenhouse,GH,	Graduate House,DB,	Dearborn Pumphouse,BRH,	Brubacher House,BEG,	BEG Test Building,TUL,	Tri-University Library,AB,	Aberfoyle Building,AH,	Aberfoyle House,AS,	Aberfoyle Storage,KGC,	KW Garden Club,FRF,	Fire Research Facility,PTB,	Pavement & Transportation Technology Building,PTG,	Pavement & Transportation Technology Garage,AAR,	Architecture Annex Rome,ACW,	Accelerator Centre Waterloo,WFF,	Warrior Football Field,MRS,	Medical & Related Sciences,SCO,	Shanghai China Office,HSC,	Huntsville Summit Centre,BSC,	Bright Starts Co-operative Early Learning Centre,ASA,	Allen Square Arts,CIGI,	Centre for International Governance Innovation (BSIA),Velocity Garage,WCP,	Waterloo Central Place,MWS,	Manulife Water Street,MTT,	Master of Taxation Toronto,STM,	Shelburne Terrace, Gaithersburg, Maryland,LHI,	Lyle S. Hallman Institute for Health Promotion,STJ,	St. Jerome's University,REN,	Renison University College,STP,	St. Paul's University College,CGR,	Conrad Grebel University College,CLN,	Columbia Lake Village North,SCS,	South Campus - South Grounds,AHS,	AHS Expansion,SCN,	South Campus - North Grounds,CGB,	Campus General Buildings,VLG,	Village 1 & 2 Grounds,MHG,	Minota Hagey Grounds,FCG,	Faculty Club Grounds,GAG,	Garage & Garbage,MSG,	Married Student Grounds,GRH,	Greenhouse,NCG,	North Campus Grounds,BAG,	Bauer Grounds,LL,	Laurel Lake,SCG,	South Campus General".replace(/\t/g, '').split(',');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.post('/upload', upload.single('image'), function(req, res, next){
	var options = {verbose: true};
	vision.detectText(req.file.path, options, function(err, text, apiResponse){
		fs.unlinkSync(req.file.path);
		if(err){
			res.send(err);
		} else {
			var concatted = concatSpace(text);
			
			language.detectEntities(concatted, function(err, entities, apiResponse){
				if(err){
					res.send(err);
				} else {
					var title = "";
					
					var location = stringInLibrary(text, library);
					
					if(entities.events){
						title = entities.events[0];
					}else if (entities.other){
						title = entities.organizations[0];
					}else if (entities.other){
						title = entities.other[0];
					}
					
					if(location==""){
						if(entities.places){
							location = entities.places[0];
						}else if (entities.organizations){
							location = entities.organizations[0];
						}
					}
					
					var returnobj = {
						date: chrono.parseDate(concatSpace(text)),
						location: location,
						title: title,
						entities: entities,
						text: text
					}
					res.send(returnobj);
				}
			})
		}
	})
});

var concatSpace = function(strings){
	var new_string = strings[1].desc;
	for(i=2; i<strings.length; i++){
		new_string = new_string + " " + strings[i].desc;
	}
	return new_string;
}

function stringInLibrary(text, library){
	var matches = [];
	var dists = [];
	var rooms = [];
	var dist;
	var min=999999;
	var minvalue="";
	var minroom="";
	
	
	for(var j=0; j<text.length; j++){
		for(var i = 0; i<library.length; i++){
			dist = getEditDistance(text[j].desc, library[i])
			if(dist<2){
				matches.push(library[i]);
				if(j+1==text.length){
					rooms.push('');
				}else{
					rooms.push(text[j+1].desc);
				}
				dists.push(dist);
			}
		}
		for(var i = 0; i<dists.length; i++){
			if(dists[i]==min){
				if(minvalue.length<matches[i].length){
					min = dists[i];
					minvalue = matches[i];
					minroom = rooms[i];
				}
			}else if(dists[i]<min){
				min = dists[i];
				minvalue = matches[i];
				minroom = rooms[i];
			}
		}
	}
	return minvalue + " " + minroom;
}

// Compute the edit distance between the two given strings
function getEditDistance(a, b) {
  if (a.length === 0) return b.length; 
  if (b.length === 0) return a.length; 

  var matrix = [];

  // increment along the first column of each row
  var i;
  for (i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  // increment each column in the first row
  var j;
  for (j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (i = 1; i <= b.length; i++) {
    for (j = 1; j <= a.length; j++) {
      if (b.charAt(i-1) == a.charAt(j-1)) {
        matrix[i][j] = matrix[i-1][j-1];
      } else {
        matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, // substitution
                                Math.min(matrix[i][j-1] + 1, // insertion
                                         matrix[i-1][j] + 1)); // deletion
      }
    }
  }

  return matrix[b.length][a.length];
};




app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;