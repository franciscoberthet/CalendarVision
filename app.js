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

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.post('/upload', upload.single('image'), function(req, res, next){
	vision.detectText(req.file.path, function(err, text, apiResponse){
		fs.unlinkSync(req.file.path);
		if(err){
			res.send(err);
		} else {
			var concatted = concatSpace(text);
			
			language.detectEntities(concatted, function(err, entities, apiResponse){
				if(err){
					res.send(err);
				} else {
					var title = "",
						location = "";
						
					if(entities.events){
						title = entities.events[0];
					}else if (entities.other){
						title = entities.other[0];
					}
					
					if(entities.places){
						location = entities.places[0];
					}else if (entities.organizations){
						location = entities.organizations[0];
					}
					
					var returnobj = {
						date: chrono.parseDate(concatSpace(text)),
						location: location,
						title: title,
						entities: entities
					}
					res.send(returnobj);
				}
			})
		}
	})
});

var concatSpace = function(strings){
	var new_string = strings[1];
	for(i=2; i<strings.length; i++){
		new_string = new_string + " " + strings[i];
	}
	return new_string;
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
