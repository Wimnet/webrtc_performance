WebRTC-Analyzer
===============
A video calling application for the performance evaluation of WebRTC-based video conferencing. For more information, please read

_B. Jansen, T. Goodwin, V. Gupta, F. Kuipers, and G. Zussman, “Performance evaluation of WebRTC-based video conferencing,” in Proc. IFIP Performance’17 (to appear), 2017._

## Getting Started

### Setting up the WebRTC-Analyzer application server
#### Installation Instructions
1. Clone or upload this repo to the host machine
2. Install dependencies via `npm install`
3. Start video server: `node server.js`

##### Configuring a hosting location
To run experiments over the Internet, the app must be running on a publically reachable address, and a webserver such as Apache or NGINX is required to forward traffic from port 80 to the app. A very simple way to achieve these steps at once is to use an app hosting service such as AWS Elastic Beanstalk, Google's Firebase, or any hosting service that allows you to upload and host a Node.js project.
Our experiments utilized an ElasticBeanstalk Node.js deployment. See [their docs](http://docs.aws.amazon.com/elasticbeanstalk/latest/dg/create_deploy_nodejs.html) for setup instructions, which primarily involves uploading a zip archive of this repo to AWS.

##### Setting up the database
Out of the box, this app requires a database connection to record call stats. This app was built using a [Firebase](https://firebase.google.com/products/database/) Realtime Database instance.
After creating a Firebase project (free tier worked just fine for our experimental purposes), you will be given a configuration script to paste into your webapp.
In `charts.js`, replace the config object with the one Firebase gives you. It should look something like this:

```js
  // Initialize Firebase
  var config = {
    apiKey: "<YOUR_API_KEY>",
    authDomain: "<your-project>.firebaseapp.com",
    databaseURL: "https://<your-project>.firebaseio.com",
    projectId: "<your-project>",
    storageBucket: "phidio-c8b8a.appspot.com",
    messagingSenderId: "123456789"
  };
```

### Setting up client machines
This repo should be cloned onto the two machines to be used as clients. A webcam and a GUI are not required on these machines, as we used rented Amazon EC2 instances with prepositioned video files for experimental consistency. Setting up a headless client instance requires the following steps:
1. Clone this repo onto the machine
2. Upload video files in the .y4m format to be used in the experiment. We sourced ours from [here](https://media.xiph.org/video/derf/) 
3. Install google chrome according to your machine's specs: see [How to Install Google Chrome in Ubuntu 14.04](How to Install Google Chrome in Ubuntu 14.04)
4. Install ChromeDriver and Selenium (for experiment automation)
5. [Install Xvfb](http://elementalselenium.com/tips/38-headless) in order to run Chrome on a machine with no GUI.

Steps 3 and 4 were completed using this script: https://gist.github.com/ziadoz/3e8ab7e944d02fe872c3454d17af31a5

5. Modify line 10 of the `start-phidio.py` script to include the location of your uploaded .y4m video:
```
LOCAL_PATH_TO_VIDEO = '/home/ubuntu/webrtc-tools/in_to_tree_420_720p50.y4m'
```
6. Modify line 9 of `start-phidio.py` to the address where you are hosting the server.

If you are using a machine with a GUI and a display, only steps 1 and 2 are needed. Installing Chrome on Ubuntu gives access to the `google-chrome` executable. Chrome can be launched via the command line with an injected video file via the following command:
```
$ google-chrome -args --use-file-for-fake-video-capture=/<ABSOLUTE_PATH_TO_VIDEO_FILE>.y4m --use-fake-device-for-media-stream --enable-features=WebRTC-H264WithOpenH264FFmpeg
```

If you are using a wireless client such as a mobile tablet, the only steps needed are to ensure Google Chrome is installed on the device, and that the device is connected to the wireless network.

### Setting up a monitoring device
To record PHY layer information, any wireless-enabled device will suffice. We utilized a Macbook Pro and followed these instructions to set up packet sniffing via the command line: https://diogomonica.com/2011/04/10/sniffing-in-monitor-mode-with-airport/

## Reproducing our Results
#### Basic usage
To run an experiment, simply add two clients to a room. The moment two clients join the same room, the call will begin and the app will begin recording stats. To record call stats, clicking 'log stats' will upload the call metrics to the database. The call will continue after clicking the 'log stats' button. A call ends when one of the clients leaves the room.

#### Experiments with remote machines
To setup an experiment between a local wireless client and a remote machine, first enter the app's URL into the wireless client's browser and then enter a room via the app's web interface. Next, via the command line of the remote client, use the `start-phidio.py` script to have the remote client enter the same room.
The script takes one command line argument, the room name. Run the script on the remote server as follows: `python start-phidio.py <room_name>`.
This will boot an instance of chrome, inject the local video file into it for fake video capture, and point it to your instance of the app at the specified room name. If no room is specified, it will default to a room with the name 'testroom'.

To have the remote server virtually click the "log stats" button, add the `-log` flag on the command line. This will automatically 'click' the Log Stats button after 3 minutes, thus uploading call data from your remote server to the database. Call data from the wireless client can be uploaded by manually clicking the "log stats" button when the experiment has concluded.

To record PHY layer data from the client machines, simply run a Wireshark trace on the network interface of each respective machine. We currently do not have a methodology for collecting PHY layer data on a client without Wireshark installed.
To record wireless monitor data, put the monitor machine into monitor mode using the command `sudo airport sniff CHANNEL`, where `CHANNEL` is the wireless channel of the WiFi network that the wireless client is connected to. This will produce a `.pcap` trace file that can be later viewed in Wireshark or processed using scripts included in this repo.

## Viewing and collecting experiment data
All experimental results can be viewed using the app via the `/charts` resource. i.e. in our demo app, this is at `https://your-app-url.net/charts`. All calls can be viewed using the dropdown selector. It may take a moment for the call data to load from the database. Below the dropdown selector is a button to download the selected call's data in JSON format. The data is structured as key-value pairs, where the key is the name of the statistic and the value is an array of floats, with each value representing a given second of the experimental call. A script to compute statistics on a given call's data is provided in `scripts/get-call-stats.py`.

The wireless monitor traces can be processed using the included script `make_graphs.sh` `parse_xml.py`. `make_graphs.sh` will produce XML trees from the `.pcap` file, which are then processed by `parse_xml.py` to produce Matplotlib figures. The `make_graphs.sh` script assumes the following file structure: 3 folders labeled `monitor`, `sender`, and `receiver`. `sender` and `receiver` contain the Wireshark traces collected on each machine during the experiment. `monitor` contains the trace produced from the `airport sniff` command. It also contains the `$SENDER_IP` variable, which is the IP address of the non-wireless "sender" client, which allows the script to produce the relevant XML trees from the traces. The script must be run on a computer with Wireshark installed.


This experimental tool was built using the [SimpleWebRTC](https://github.com/andyet/SimpleWebRTC) library.

