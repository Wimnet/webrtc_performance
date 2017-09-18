$(document).ready(function() {
	// grab the room from the URL
	var room = location.search && location.search.split('?')[1];

	// create our webrtc connection
	var webrtc = new SimpleWebRTC({
		// the id/element dom element that will hold "our" video
		localVideoEl: 'localVideo',
		// the id/element dom element that will hold remote videos
		remoteVideosEl: '',
		// immediately ask for camera access
		autoRequestMedia: true,
		debug: false
	});

	// when it's ready, join if we got a room from the URL
	webrtc.on('readyToCall', function () {
		if (room) webrtc.joinRoom(room);
		window.callInfo = [];
	});

	webrtc.on('channelMessage', function (peer, label, data) {
		if (data.type == 'volume') {
			showVolume(document.getElementById('volume_' + peer.id), data.volume);
		}
	});

	//videoAdded event. peer video has been added
	webrtc.on('videoAdded', function (video, peer) {
		console.log('video added', peer);

		var remotes = document.getElementById('remotes');
		if (remotes) {
			var d = document.createElement('div');
			d.className = 'videoContainer';
			d.id = 'container_' + webrtc.getDomId(peer);
			d.appendChild(video);
			var vol = document.createElement('div');
			vol.id = 'volume_' + peer.id;
			vol.className = 'volume_bar';
			video.onclick = function () {
				video.style.width = video.videoWidth + 'px';
				video.style.height = video.videoHeight + 'px';
			};
			d.appendChild(vol);

			// start timing immediately when the call begins.
			if (peer && peer.pc) {
				window.getStatsTimer = setInterval(function() {
					peer.pc.getStats(function(err, stats) {
						var test = {};
						test.results = $.map(stats, function(value, index) {
							return [value];
						});
						window.callInfo.push(test); // push unprocessed for now to not slow things down
					});
				}, 1000);
				var connstate = document.createElement('div');
				connstate.className = 'connection-state';
				peer.pc.on('iceConnectionStateChange', function(e) {
					switch (peer.pc.iceConnectionState) {
						case 'checking':
							connstate.innerText = 'Connecting to peer...';
							break;
						case 'connected':
						case 'completed': //on caller side
							connstate.innerText = 'Connection established.';
							break;
						case 'disconnected':
							connstate.innerText = 'Disconnected';
						case 'failed':
							connstate.innerText = 'Connection failed';
						case 'closed':
							connstate.innerText = 'Connection closed.';
							break;
					}
				});
			}
			remotes.appendChild(d);
		}
	});
	// a peer was removed
	webrtc.on('videoRemoved', function (video, peer) {
		clearInterval(window.getStatsTimer);
		console.log('video removed ', peer);
		var remotes = document.getElementById('remotes');
		var el = document.getElementById('container_' + webrtc.getDomId(peer));
		if (remotes && el) {
			remotes.removeChild(el);
		}
	});
	webrtc.on('volumeChange', function (volume, treshold) {
		showVolume(document.getElementById('localVolume'), volume);
	});

	// Since we use this twice we put it here
	function setRoom(name) {
		$('form').remove();
		$('h3').text(name);
		$('#subTitle').text('Link to join: ' + location.href);
		$('body').addClass('active');
	}

	if (room) {
		setRoom(room);
	} else {
		$('form').submit(function () {
			var val = $('#sessionInput').val().toLowerCase().replace(/\s/g, '-').replace(/[^A-Za-z0-9_\-]/g, '');
			webrtc.createRoom(val, function (err, name) {
				console.log(' create room cb', arguments);
			
				var newUrl = location.pathname + '?' + name;
				if (!err) {
					history.replaceState({foo: 'bar'}, null, newUrl);
					setRoom(name);
				} else {
					console.log(err);
				}
			});
			return false;          
		});
	}
	var statsButton = $('#logStats');
	statsButton.text('log stats');
	statsButton.click(function() {
		console.log('preparing to upload');
		uploadData();
	});

	function getNecessaryData(res){
		var result = {};
		result.sentAudio = {};
		result.sentVideo = {};
		result.recvVideo = {};
		result.recvAudio = {};

		for(var i = 0; i < res.results.length; i++) {
			switch (res.results[i].type) {
				case 'ssrc':
					if(res.results[i].audioInputLevel && res.results[i].id.indexOf('send') !== -1) {
						result.sentAudio = {};
						result.sentAudio.googCodecName = res.results[i].googCodecName;
						result.sentAudio.audioInputLevel = res.results[i].audioInputLevel;
						result.sentAudio.bytesSent = res.results[i].bytesSent;
						result.sentAudio.googJitterReceived = res.results[i].googJitterReceived;
						result.sentAudio.googRtt = res.results[i].googRtt;
						result.sentAudio.packetsLost = res.results[i].packetsLost;
						result.sentAudio.packetsSent = res.results[i].packetsSent;
						result.sentAudio.timestamp = res.results[i].timestamp;
					}
					else if(res.results[i].googFrameHeightSent && res.results[i].id.indexOf('send') !== -1) {
						result.sentVideo = {};
						result.sentVideo.googCodecName = res.results[i].googCodecName;
						result.sentVideo.bytesSent = res.results[i].bytesSent;
						result.sentVideo.googAdaptationChanges = res.results[i].googAdaptationChanges;
						result.sentVideo.googBandwidthLimitedResolution = res.results[i].googBandwidthLimitedResolution;
						result.sentVideo.googViewLimitedResolution = res.results[i].googViewLimitedResolution;
						result.sentVideo.googCpuLimitedResolution = res.results[i].googCpuLimitedResolution;
						result.sentVideo.googAvgEncodeMs = res.results[i].googAvgEncodeMs;
						result.sentVideo.googEncodeUsagePercent = res.results[i].googEncodeUsagePercent;
						result.sentVideo.googFrameHeightInput = res.results[i].googFrameHeightInput;
						result.sentVideo.googFrameHeightSent = res.results[i].googFrameHeightSent;
						result.sentVideo.googFrameRateInput = res.results[i].googFrameRateInput;
						result.sentVideo.googFrameRateSent = res.results[i].googFrameRateSent;
						result.sentVideo.googFrameWidthInput = res.results[i].googFrameWidthInput;
						result.sentVideo.googFrameWidthSent = res.results[i].googFrameWidthSent;
						result.sentVideo.googNacksReceived = res.results[i].googNacksReceived;
						result.sentVideo.googPlisReceived = res.results[i].googPlisReceived;
						result.sentVideo.googRtt = res.results[i].googRtt;
						result.sentVideo.packetsLost = res.results[i].packetsLost;
						result.sentVideo.packetsSent = res.results[i].packetsSent;
						result.sentVideo.timestamp = res.results[i].timestamp;
					} else if(res.results[i].audioOutputLevel && res.results[i].id.indexOf('recv') !== -1) {
						result.recvAudio = {};
						result.recvAudio.audioOutputLevel = res.results[i].audioOutputLevel;
						result.recvAudio.googCodecName = res.results[i].googCodecName;
						result.recvAudio.bytesReceived = res.results[i].bytesReceived;
						result.recvAudio.googCurrentDelayMs = res.results[i].googCurrentDelayMs;
						result.recvAudio.packetsLost = res.results[i].packetsLost;
						result.recvAudio.packetsReceived = res.results[i].packetsReceived;
						result.recvAudio.timestamp = res.results[i].timestamp;
					} else if(res.results[i].googFrameHeightReceived && res.results[i].id.indexOf('recv') !== -1) {
						result.recvVideo = {};
						result.recvVideo.googCodecName = res.results[i].googCodecName;
						result.recvVideo.bytesReceived = res.results[i].bytesReceived;
						result.recvVideo.googCurrentDelayMs = res.results[i].googCurrentDelayMs;
						result.recvVideo.googDecodeMs = res.results[i].googDecodeMs;
						result.recvVideo.googFrameRateReceived = res.results[i].googFrameRateReceived;
						result.recvVideo.googFrameHeightReceived = res.results[i].googFrameHeightReceived;
						result.recvVideo.googFrameWidthReceived = res.results[i].googFrameWidthReceived;
						result.recvVideo.googFrameRateOutput = res.results[i].googFrameRateOutput;
						result.recvVideo.googNacksSent = res.results[i].googNacksSent;
						result.recvVideo.googPlisSent = res.results[i].googPlisSent;
						result.recvVideo.packetsLost = res.results[i].packetsLost;
						result.recvVideo.packetsReceived = res.results[i].packetsReceived;
						result.recvVideo.timestamp = res.results[i].timestamp;
					}
					break;
				case 'VideoBwe':
					result.videoBWE = res.results[i];
					break;
				case 'googCandidatePair':
					if (res.results[i].googActiveConnection === "true") {
						result.bytesReceived = res.results[i].bytesReceived;
						result.bytesSent = res.results[i].bytesSent;
						result.googRtt = res.results[i].googRtt;
						result.packetDiscardedOnSend = res.results[i].packetsDiscardedOnSend;
						result.packetsSent = res.results[i].packetsSent;
						result.timestamp = res.results[i].timestamp;
					}
			}
		}
		return result;
	}

	function fmtr(nr) {
		if (nr < 10){
			nr = '0' + nr;
		}
		return nr;
	}

	function getTime() {
		var now = new Date();
		var year = fmtr(now.getFullYear());
		var month = fmtr(now.getMonth() + 1);
		var day = fmtr(now.getDate());
		var hours = fmtr(now.getHours());
		var minutes = fmtr(now.getMinutes());
		var seconds = fmtr(now.getSeconds());
		return year + '-' + month + '-' + day + '-' + hours + ':' + minutes + ':' + seconds;
	}

	function uploadData() {
		var data = [];
		if (!window.callInfo || window.callInfo.length === 0) {
			console.error('no callInfo to upload, exiting!');
			return;
		}
		// set up database connection here
		var db = firebase.database();

		// process raw data from callStats() API into the model we want to use
		for(var i = 0; i < window.callInfo.length; i++) {
			data.push(getNecessaryData(window.callInfo[i]));
		}
		var json_resp = JSON.stringify(data);

		db.ref('/logs').push({
			date: getTime(),
			contents: json_resp,
			callLength: window.callInfo.length
		}, function() {
			alert('successfully pushed data to firebase');
		});
	}
});
		   