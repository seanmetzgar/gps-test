"use strict";
Number.prototype.between = function(min, max) {
	var rVal = false;
	if (typeof min === "number" && typeof max === "number") {
		rVal = (this >= min && this <= max) ? true : false;
	}
	return rVal;
};
Number.prototype.toRad = function() {
   return this * Math.PI / 180;
};

//Globals
var views = {
	navigation : null,
	settings : null,
	destination: null
};
var settingFields = {
	imperial: null,
	hemispheres: null,
	format: null,
};
var $appWrapper = null;
var $compass = null;
var $currentPosition = null;
var $destinationPosition = null;
var $accuracy = null;
var $distance = null;
var currentPosition = false;
var destinationPosition = false;
var geolocationWatch = false;
var defaults = {
	imperial : true,
	hemispheres : true,
	format : "DMS",
	destination : false,
	zerofill : false
};
var settings = false;
var $settings = null;

//Functions
var checkBoolean = function(value) {
	var rVal = (typeof value !== undefined &&
		(typeof value === "boolean" ||
			(typeof value === "number" &&
				(value === 1 || value === 0)
			)
		)
	) ? true : false;

	return rVal;
};

var setCompassRotation = function(rotation, $el) {
	var currentRotation = false;
	var animateDirection = false;
	var difference = null;

	$el = (typeof $el == "object" && $el instanceof jQuery) ? $el : $compass;

	currentRotation = $el.data("rotation");
	if (typeof currentRotation !== "number") { $el.data("rotation", 0); }
	if (typeof rotation === "number" && rotation.between(0,360)) {
		difference = currentRotation - rotation;

		difference = (currentRotation < rotation) ? Math.abs(difference) : difference;
		animateDirection = (difference > 180) ? "anticlockwise" : "clockwise";

		$el.data("rotation", rotation).css({
		  '-webkit-transform' : 'rotate('+rotation+'deg)',
		     '-moz-transform' : 'rotate('+rotation+'deg)',
		      '-ms-transform' : 'rotate('+rotation+'deg)',
		       '-o-transform' : 'rotate('+rotation+'deg)',
		          'transform' : 'rotate('+rotation+'deg)',
		               'zoom' : 1

		});
	}
};

var updatePosition = function(position, $el, $el2) {
	$el = (typeof $el == "object" && $el instanceof jQuery) ? $el : $currentPosition;
	$el2 = (typeof $el2 == "object" && $el2 instanceof jQuery) ? $el2 : $accuracy;

	currentPosition = position; //Update global variable

    $el.find(".latitude").html(formatDisplayCoordinate(position.coords.latitude, "lat"))
    	.next(".longitude").html(formatDisplayCoordinate(position.coords.longitude, "lon"));
    $el2.html(position.coords.accuracy + "m");
};

var reduceUnits = function(distance, imperial) {
	var units = false;

	imperial = (checkBoolean(imperial)) ? imperial : settings.imperial;

	units = (imperial) ? "mi" : "km";

	if (imperial) {
		if (distance < 0.5) {
			//If less than 1/2 mile, reduce to yards
			distance = distance * 1760;
			units = "yd";
			if (distance < 200) {
				distance = distance * 3;
				units = "ft";
			}
		}
	} else {
		if (distance < 0.5) {
			distance = distance * 1000;
			units = "m";
		}
	}
	return {distance : distance, units : units};
};

var formatDisplayCoordinate = function(coord, type, hemispheres, format, zerofill) {
	var currentHemisphere = false;
	var degrees = false;
	var minutes = false;
	var seconds = false;
	var degreeParts = false;
	var minutesParts = false;
	var absDegrees = false;

	hemispheres = (checkBoolean(hemispheres)) ? hemispheres : settings.hemispheres;
	format = (typeof format === "string") ? format : settings.format;
	zerofill = (checkBoolean(zerofill)) ? zerofill : settings.zerofill;

	if (type === "latitude" || type === "lat") {
		currentHemisphere = (coord > 0) ? "N " : "S ";
	} else {
		currentHemisphere = (coord > 0) ? "E " : "W ";
	}

	absDegrees = Math.abs(coord);

	if (format === "D" || format === "DD") {
		if (absDegrees >= 100) {
			absDegrees = absDegrees.toPrecision(8).toString();
		} else if (coord >= 10 || coord <= -10) {
			absDegrees = (zerofill) ?
				"0" + absDegrees.toPrecision(7) :
				absDegrees.toPrecision(7).toString();
		} else {
			absDegrees = (zerofill) ?
				"00" + absDegrees.toPrecision(6) :
				absDegrees.toPrecision(6).toString();
		}

		coord = (hemispheres) ?
			currentHemisphere + absDegrees + "&deg;":
			((coord < 0) ? "-" : "") + absDegrees + "&deg;";
	} else {
		degreeParts = [
			coord > 0 ? Math.floor(coord) : Math.ceil(coord),
			Math.abs(coord % 1)
		];
		degrees = degreeParts[0];
		absDegrees = Math.abs(degrees);
		if (absDegrees >= 10 && absDegrees < 100) {
			absDegrees = (zerofill) ?
				"0" + absDegrees :
				absDegrees.toString();
		} else if (absDegrees < 10) {
			absDegrees = (zerofill) ?
				"00" + absDegrees :
				absDegrees.toString();
		} else {
			absDegrees = absDegrees.toString();
		}
		minutes = degreeParts[1] * 60;

		if (format === "DMS") {
			minutesParts = [
				Math.floor(minutes),
				Math.abs(minutes % 1)
			];
			minutes = minutesParts[0];
			seconds = (minutesParts[1] * 60);

			if (minutes < 10) {
				minutes = (zerofill) ?
					"0" + minutes :
					minutes.toString();
			}

			if (seconds >= 10) {
				seconds = seconds.toPrecision(4).toString();
			} else {
				seconds = (zerofill) ?
					"0" + seconds.toPrecision(3).toString() :
					seconds.toPrecision(3).toString();
			}

			coord = (hemispheres) ?
				currentHemisphere + absDegrees + "&deg; " + minutes + "' " + seconds + "\"" :
				((coord < 0) ? "-" : "") + absDegrees + "&deg; " + minutes + "' " + seconds + "\"";
		} else {
			if (minutes >= 10) {
				minutes = minutes.toPrecision(5).toString();
			} else {
				minutes = (zerofill) ?
					"0" + minutes.toPrecision(4) :
					minutes.toPrecision(4).toString();
			}

			coord = (hemispheres) ?
				currentHemisphere + absDegrees + "&deg; " + minutes + "'" :
				((degrees < 0) ? "-" : "") + absDegrees + "&deg; " + minutes + "'";
		}
	}

	return coord;
};

var haversine = function(position1, position2, imperial) {
	var lat1 = position1.coords.latitude;
	var lon1 = position1.coords.longitude;
	var lat2 = position2.coords.latitude;
	var lon2 = position2.coords.longitude;
	var dLat = (lat2-lat1).toRad(); //Delta latitude in radians
	var dLon = (lon2-lon1).toRad(); //Delta longitude in radians
	var R = false;
	var d = false;

	//Convert initial points to radians
	lat1 = lat1.toRad();
	lat2 = lat2.toRad();
	lon1 = lon1.toRad();
	lon2 = lon2.toRad();

	imperial = (checkBoolean(imperial)) ? imperial : settings.imperial;

	// Set Radius of Earth based on unit type (mi : km)
	R = (imperial) ? 3959 : 6371;

	//Haversine Formula
	d = R * 2 * Math.atan2(
		Math.sqrt(
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
		),
		Math.sqrt(1 - (
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        	Math.cos(lat1) * Math.cos(lat2) *
        	Math.sin(dLon / 2) * Math.sin(dLon / 2)
		))
	);

	//Reduce units and return
	return reduceUnits(d, imperial);
};

var loadSettings = function() {
	var loadedSettings = {};

	if (typeof localStorage !== "undefined") {
		loadedSettings = localStorage.getItem("cacherSettings");
		loadedSettings = (typeof loadedSettings === "string") ? JSON.parse(loadedSettings) : {};
	}

	return loadedSettings;
};

var saveSettings = function() {
	if (typeof localStorage !== "undefined") {
		localStorage.setItem("cacherSettings", JSON.stringify(settings));
	}
};

var initializeGeolocationWatch = function() {
    if (navigator.geolocation) {
        geolocationWatch = navigator.geolocation.watchPosition(updatePosition);
    }
};

var initializeApp = function() {
	var $compassWrapper = null;
	var $positionWrapper = null;
	var $distanceWrapper = null;

	//Load Settings and Extend Defaults
	settings = $.extend(defaults, loadSettings());

	//Init Views
	views.settings = $(".view.settings");
	views.navigation = $("<div></div>").addClass("view").addClass("navigation").addClass("active").prependTo($appWrapper);
	views.destination = $("<div></div>").addClass("view").addClass("destination").appendTo($appWrapper);

	//Compass Elements
	$compassWrapper = $("<div></div>").addClass("compass-wrapper").appendTo(views.navigation);
	$compass = $("<div></div>").addClass("compass").prependTo($compassWrapper).data("rotation", 0);

	//Distance & Accuracy Elements
	$distanceWrapper = $("<div></div>").addClass("distance-wrapper").appendTo($compassWrapper);
	$accuracy = $("<p></p>").addClass("accuracy").addClass("icon-signal").appendTo($distanceWrapper);
	$distance = $("<p></p>").addClass("distance").appendTo($distanceWrapper);

	//Position Elements
	$positionWrapper = $("<div></div>").addClass("position-wrapper").appendTo(views.navigation);
	$currentPosition = $("<p></p>").addClass("position").addClass("current").appendTo($positionWrapper);
	$destinationPosition = $("<p></p>").addClass("position").addClass("destination").appendTo($positionWrapper);
	$positionWrapper.find(".position").html("<span class=\"latitude\"></span>\n<span class=\"longitude\"></span>");

	//Setup Compass & Location
	setCompassRotation(0);
	initializeGeolocationWatch();

	//Settings Form
	$settings = views.settings.find(".settings-form");
	$settings.find(".btn").addClass("btn-secondary");

	$settings.find(".btn-group").each(function() {
		var $field = $(this);
		var fieldName = $field.data("field");
		var fieldValue = settings[fieldName];
		fieldValue = String(fieldValue);
		$field.find(".btn[data-value=" + fieldValue + "]")
			.addClass("btn-info")
			.removeClass("btn-secondary")
			.siblings()
			.addClass("btn-secondary")
			.removeClass("btn-info");
	});

	$settings.find(".btn").on("click", function() {
		var $button = $(this);
		var $field = $button.parents(".btn-group");
		var fieldName = $field.data("field");
		var value = $button.data("value");
		$button
			.addClass("btn-info")
			.removeClass("btn-secondary")
			.siblings()
			.addClass("btn-secondary")
			.removeClass("btn-info");
		value = (value === "true" || value === "false") ? JSON.parse(value) : value;
		settings[fieldName] = value;
		saveSettings();
	});
};

$(document).ready(function() {
	$appWrapper = $(".app-wrapper");
	initializeApp();
});