const fs = require('fs');

const system = require('system');
var args = system.args;

Date.prototype.addDays=function(d){return new Date(this.valueOf()+864E5*d);};

var startDateDate = new Date();
var endDateDate = (new Date()).addDays(1);

var channelNumber = args.length > 1 ? args[1] : 1;

var startDate = startDateDate.getFullYear() + '-' + ( startDateDate.getMonth() + 1 < 10 ? '0' + (startDateDate.getMonth() + 1) : startDateDate.getMonth() + 1 ) + '-' + (startDateDate.getDate() < 10 ? '0' + startDateDate.getDate() : startDateDate.getDate());

var endDate = endDateDate.getFullYear() + '-' + ( endDateDate.getMonth() + 1 < 10 ? '0' + (endDateDate.getMonth() + 1) : endDateDate.getMonth() +1 ) + '-' + (endDateDate.getDate() < 10 ? '0' + endDateDate.getDate() : endDateDate.getDate());
console.log(endDate);

var url = 'https://www.sky.com.br/service/Guide/GetSchedules?channelNumber='+ channelNumber +'&limit=50&start=' + startDate + 'T03:00:00.000Z&end='+ endDate +'T03:00:00.000Z&order=NumberForward&quality=none&showAdultContent=false';

console.log(url);

var page;

var allGood = false;
var tryTimes = 0;

function loadPage(callback) {
	tryTimes = tryTimes + 1;
	page = require('webpage').create();

	page.open(url, callback);
	page.onResourceReceived = function(response) {
		if ( response.stage == "end" && response.url == url ) {
			var contentType = '';
			for ( var k in response.headers ) {
				if ( response.headers[k]['name'] == 'Content-Type' ) {
					contentType = response.headers[k]['value'];
				}
			}

			if ( contentType.indexOf('json') > -1 ) {
				allGood = true;
			}
		}
	};
}

var continueRequests = function() {
	if ( tryTimes > 3 ) {
		phantom.exit(1);
	}
	else {
		if ( ! allGood ) {
			loadPage(continueRequests);
		}
		else {
			fs.write('dump.json', page.plainText, 'w');
	
			phantom.exit();
		}
	}
}

if ( fs.isFile('dump.json') ) {
	fs.remove('dump.json');
}

loadPage(continueRequests);
